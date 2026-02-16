import { NextRequest, NextResponse } from "next/server";
import { getAllChannels, addChannel, channelExists } from "@/lib/db";
import { resolveChannel } from "@/lib/youtube";
import { invalidateCache } from "@/lib/cache";

export async function GET() {
  try {
    const channels = await getAllChannels();
    return NextResponse.json(channels);
  } catch (error) {
    console.error("Error fetching channels:", error);
    return NextResponse.json(
      { error: "Error fetching channels" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { url?: string };
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Resolve channel info from URL
    const channelInfo = await resolveChannel(normalizedUrl);

    // Check if already exists
    const exists = await channelExists(channelInfo.channelId);
    if (exists) {
      return NextResponse.json(
        { error: "This channel is already added" },
        { status: 409 }
      );
    }

    // Add to database
    const channel = await addChannel(
      channelInfo.channelId,
      channelInfo.name,
      channelInfo.handle,
      channelInfo.thumbnailUrl
    );

    invalidateCache("aggregated_feed");

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error("Error adding channel:", error);
    const message =
      error instanceof Error ? error.message : "Error adding channel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

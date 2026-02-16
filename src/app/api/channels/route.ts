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

interface AddChannelBody {
  url?: string;
  channelId?: string;
  name?: string;
  handle?: string | null;
  thumbnailUrl?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AddChannelBody;

    let channelId: string;
    let name: string;
    let handle: string | null;
    let thumbnailUrl: string | null;

    if (body.channelId && body.name) {
      // Pre-resolved data from the preview flow
      channelId = body.channelId;
      name = body.name;
      handle = body.handle ?? null;
      thumbnailUrl = body.thumbnailUrl ?? null;
    } else if (body.url) {
      // Legacy flow: resolve from URL
      let normalizedUrl = body.url.trim();
      if (!normalizedUrl.startsWith("http")) {
        normalizedUrl = `https://${normalizedUrl}`;
      }
      const channelInfo = await resolveChannel(normalizedUrl);
      channelId = channelInfo.channelId;
      name = channelInfo.name;
      handle = channelInfo.handle;
      thumbnailUrl = channelInfo.thumbnailUrl;
    } else {
      return NextResponse.json(
        { error: "URL or channel data is required" },
        { status: 400 }
      );
    }

    // Check if already exists
    const exists = await channelExists(channelId);
    if (exists) {
      return NextResponse.json(
        { error: "This channel is already added" },
        { status: 409 }
      );
    }

    // Add to database
    const channel = await addChannel(channelId, name, handle, thumbnailUrl);

    invalidateCache("aggregated_feed");

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error("Error adding channel:", error);
    const message =
      error instanceof Error ? error.message : "Error adding channel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

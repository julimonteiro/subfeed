import { NextRequest, NextResponse } from "next/server";
import { channelExists } from "@/lib/db";
import { resolveChannel } from "@/lib/youtube";

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

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    const channelInfo = await resolveChannel(normalizedUrl);

    const alreadyAdded = await channelExists(channelInfo.channelId);

    return NextResponse.json({
      channelId: channelInfo.channelId,
      name: channelInfo.name,
      handle: channelInfo.handle,
      thumbnailUrl: channelInfo.thumbnailUrl,
      alreadyAdded,
    });
  } catch (error) {
    console.error("Error resolving channel:", error);
    const message =
      error instanceof Error ? error.message : "Could not resolve channel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

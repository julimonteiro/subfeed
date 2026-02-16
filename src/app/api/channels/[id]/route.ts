import { NextRequest, NextResponse } from "next/server";
import { deleteChannel, getChannelById } from "@/lib/db";
import { getCached, setCache } from "@/lib/cache";
import { type VideoEntry } from "@/lib/youtube";
import { getMsUntilNextUpdate } from "@/lib/schedule";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const channelId = parseInt(id, 10);

    if (isNaN(channelId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const channel = await getChannelById(channelId);
    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    await deleteChannel(channelId);

    // Remove deleted channel's videos from the cache instead of invalidating it
    type CachedVideo = VideoEntry & { channelThumbnail: string | null };
    const cached = getCached<CachedVideo[]>("aggregated_feed");

    if (cached) {
      const filtered = cached.filter(
        (v) => v.channelId !== channel.channel_id
      );
      setCache("aggregated_feed", filtered, getMsUntilNextUpdate());
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting channel:", error);
    return NextResponse.json(
      { error: "Error removing channel" },
      { status: 500 }
    );
  }
}

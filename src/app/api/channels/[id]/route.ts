import { NextRequest, NextResponse } from "next/server";
import { deleteChannel, getChannelById } from "@/lib/db";
import { invalidateCache } from "@/lib/cache";

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

    invalidateCache("aggregated_feed");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting channel:", error);
    return NextResponse.json(
      { error: "Error removing channel" },
      { status: 500 }
    );
  }
}

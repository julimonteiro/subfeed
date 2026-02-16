import { NextRequest, NextResponse } from "next/server";
import {
  getWatchedVideoIds,
  markVideoWatched,
  unmarkVideoWatched,
} from "@/lib/db";

export async function GET() {
  try {
    const watchedIds = await getWatchedVideoIds();
    return NextResponse.json([...watchedIds]);
  } catch (error) {
    console.error("Error fetching watched videos:", error);
    return NextResponse.json(
      { error: "Error fetching watched videos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { videoId?: string; undo?: boolean };
    const { videoId, undo } = body;

    if (!videoId || typeof videoId !== "string") {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 }
      );
    }

    if (undo) {
      await unmarkVideoWatched(videoId);
    } else {
      await markVideoWatched(videoId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating watched status:", error);
    return NextResponse.json(
      { error: "Error updating status" },
      { status: 500 }
    );
  }
}

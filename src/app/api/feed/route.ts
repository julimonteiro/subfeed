import { NextResponse } from "next/server";
import { getAllChannels, getWatchedVideoIds } from "@/lib/db";
import { fetchChannelFeed, type VideoEntry } from "@/lib/youtube";
import { getCached, setCache } from "@/lib/cache";
import { getMsUntilNextUpdate, getNextUpdateTime } from "@/lib/schedule";

const FEED_CACHE_KEY = "aggregated_feed";

export async function GET() {
  try {
    const channels = await getAllChannels();

    if (channels.length === 0) {
      return NextResponse.json({
        videos: [],
        nextUpdateAt: getNextUpdateTime().toISOString(),
      });
    }

    // Fetch feed (with schedule-aware cache) and watched IDs in parallel
    let allVideos: (VideoEntry & { channelThumbnail: string | null })[];

    const cached = getCached<typeof allVideos>(FEED_CACHE_KEY);
    if (cached) {
      allVideos = cached;
    } else {
      const feedPromises = channels.map((channel) =>
        fetchChannelFeed(channel.channel_id).then((videos) =>
          videos.map((video) => ({
            ...video,
            channelThumbnail: channel.thumbnail_url,
          }))
        )
      );

      const results = await Promise.allSettled(feedPromises);
      allVideos = results
        .filter(
          (r): r is PromiseFulfilledResult<typeof allVideos> =>
            r.status === "fulfilled"
        )
        .flatMap((r) => r.value)
        .sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
        );

      // Cache until the next scheduled update window (8 AM or 8 PM BRT)
      setCache(FEED_CACHE_KEY, allVideos, getMsUntilNextUpdate());
    }

    // Always fetch fresh watched status (not cached)
    const watchedIds = await getWatchedVideoIds();

    const videosWithWatched = allVideos.map((video) => ({
      ...video,
      watched: watchedIds.has(video.videoId),
    }));

    return NextResponse.json({
      videos: videosWithWatched,
      nextUpdateAt: getNextUpdateTime().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json(
      { error: "Error fetching feed" },
      { status: 500 }
    );
  }
}

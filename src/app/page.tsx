"use client";

import { useState, useEffect, useCallback } from "react";
import VideoCard from "@/components/VideoCard";

interface Video {
  videoId: string;
  title: string;
  link: string;
  thumbnail: string;
  channelName: string;
  channelId: string;
  channelThumbnail?: string | null;
  publishedAt: string;
  watched: boolean;
}

export default function TimelinePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/feed");
      if (!response.ok) throw new Error("Failed to fetch feed");
      const data = (await response.json()) as Video[];
      setVideos(data);
    } catch {
      setError("Could not load feed. Try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const toggleWatched = useCallback(
    async (videoId: string, currentlyWatched: boolean) => {
      // Optimistic update
      setVideos((prev) =>
        prev.map((v) =>
          v.videoId === videoId ? { ...v, watched: !currentlyWatched } : v
        )
      );

      try {
        const response = await fetch("/api/watched", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoId,
            undo: currentlyWatched,
          }),
        });
        if (!response.ok) throw new Error("Failed to update watched status");
      } catch {
        // Revert on failure
        setVideos((prev) =>
          prev.map((v) =>
            v.videoId === videoId ? { ...v, watched: currentlyWatched } : v
          )
        );
      }
    },
    []
  );

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return (
    <div>
      {/* Load new posts bar */}
      {!loading && videos.length > 0 && (
        <button
          onClick={() => fetchFeed(true)}
          disabled={refreshing}
          className="flex w-full items-center justify-center border-b border-[var(--border)] py-3 text-[14px] font-medium text-[var(--accent)] transition-colors hover:bg-[var(--bg-surface)] disabled:opacity-50"
        >
          {refreshing ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Updating...
            </span>
          ) : (
            "Load new videos"
          )}
        </button>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-32">
          <svg
            className="h-7 w-7 animate-spin text-[var(--accent)]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center px-4 py-32">
          <p className="text-[15px] text-[var(--text-secondary)]">{error}</p>
          <button
            onClick={() => fetchFeed()}
            className="mt-4 rounded-full bg-[var(--accent)] px-6 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && videos.length === 0 && (
        <div className="flex flex-col items-center justify-center px-4 py-32">
          <svg
            className="h-12 w-12 text-[var(--text-muted)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-4 text-[17px] font-bold text-[var(--text-primary)]">
            Your feed is empty
          </p>
          <p className="mt-1.5 text-center text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Add YouTube channels to follow
            <br />
            the latest videos.
          </p>
          <a
            href="/channels"
            className="mt-5 rounded-full bg-[var(--accent)] px-7 py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            Add channels
          </a>
        </div>
      )}

      {/* Feed */}
      {!loading && !error && videos.length > 0 && (
        <div>
          {videos.map((video) => (
            <VideoCard
              key={video.videoId}
              {...video}
              onToggleWatched={toggleWatched}
            />
          ))}
        </div>
      )}
    </div>
  );
}

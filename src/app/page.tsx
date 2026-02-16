"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import VideoCard from "@/components/VideoCard";
import VideoCardGrid from "@/components/VideoCardGrid";
import { SkeletonVideoCard } from "@/components/SkeletonCard";

type FilterMode = "all" | "unwatched" | "watched";
type ViewMode = "list" | "grid";

interface Video {
  videoId: string;
  title: string;
  link: string;
  thumbnail: string;
  channelName: string;
  channelId: string;
  channelThumbnail?: string | null;
  publishedAt: string;
  description?: string;
  watched: boolean;
}

interface FeedResponse {
  videos: Video[];
  nextUpdateAt: string;
}

function formatNextUpdate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function TimelinePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [nextUpdateAt, setNextUpdateAt] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("subfeed_view") as ViewMode) || "list";
    }
    return "list";
  });
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [viewFading, setViewFading] = useState(false);
  const [showNextUpdate, setShowNextUpdate] = useState(false);
  const nextUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track whether this is the initial load (for staggered entry animation)
  const hasAnimated = useRef(false);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/feed");
      if (!response.ok) throw new Error("Failed to fetch feed");
      const data = (await response.json()) as FeedResponse;
      setVideos(data.videos);
      setNextUpdateAt(data.nextUpdateAt);
    } catch {
      setError("Could not load feed. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleWatched = useCallback(
    async (videoId: string, currentlyWatched: boolean) => {
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
        setVideos((prev) =>
          prev.map((v) =>
            v.videoId === videoId ? { ...v, watched: currentlyWatched } : v
          )
        );
      }
    },
    []
  );

  const markAllWatched = useCallback(
    async (videoIds: string[]) => {
      if (videoIds.length === 0) return;

      setVideos((prev) =>
        prev.map((v) =>
          videoIds.includes(v.videoId) ? { ...v, watched: true } : v
        )
      );

      try {
        const response = await fetch("/api/watched", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoIds }),
        });
        if (!response.ok) throw new Error("Failed to batch update");
      } catch {
        setVideos((prev) =>
          prev.map((v) =>
            videoIds.includes(v.videoId) ? { ...v, watched: false } : v
          )
        );
      }
    },
    []
  );

  // Unique channels for the channel filter bar (scoped to active watch-status filter)
  const channels = useMemo(() => {
    let source = videos;
    if (filter === "unwatched") {
      source = videos.filter((v) => !v.watched);
    } else if (filter === "watched") {
      source = videos.filter((v) => v.watched);
    }

    const seen = new Map<string, { channelId: string; channelName: string; channelThumbnail: string | null }>();
    for (const v of source) {
      if (!seen.has(v.channelId)) {
        seen.set(v.channelId, {
          channelId: v.channelId,
          channelName: v.channelName,
          channelThumbnail: v.channelThumbnail ?? null,
        });
      }
    }
    return Array.from(seen.values());
  }, [videos, filter]);

  // Reset selected channel if it no longer exists in the filtered list
  useEffect(() => {
    if (selectedChannel && !channels.some((ch) => ch.channelId === selectedChannel)) {
      setSelectedChannel(null);
    }
  }, [channels, selectedChannel]);

  const filteredVideos = useMemo(() => {
    let result = videos;

    if (selectedChannel) {
      result = result.filter((v) => v.channelId === selectedChannel);
    }

    if (filter === "unwatched") {
      result = result.filter((v) => !v.watched);
    } else if (filter === "watched") {
      result = result.filter((v) => v.watched);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.channelName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [videos, filter, searchQuery, selectedChannel]);

  // Initial load
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Smart auto-reload: schedule a re-fetch when the next update window arrives
  useEffect(() => {
    if (!nextUpdateAt) return;

    const ms = new Date(nextUpdateAt).getTime() - Date.now();
    if (ms <= 0) return;

    // Add a small buffer (5 s) so the server cache has expired by the time we fetch
    const timer = setTimeout(() => {
      fetchFeed();
    }, ms + 5000);

    return () => clearTimeout(timer);
  }, [nextUpdateAt, fetchFeed]);

  const handleViewToggle = useCallback(() => {
    setViewFading(true);
    setTimeout(() => {
      setViewMode((prev) => {
        const next = prev === "list" ? "grid" : "list";
        localStorage.setItem("subfeed_view", next);
        return next;
      });
      // Re-trigger entry animations for the new view
      hasAnimated.current = false;
      setTimeout(() => setViewFading(false), 30);
    }, 200);
  }, []);

  const unwatchedCount = videos.filter((v) => !v.watched).length;
  const watchedCount = videos.filter((v) => v.watched).length;
  const unwatchedInView = filteredVideos.filter((v) => !v.watched);

  const filters: { key: FilterMode; label: string; count?: number }[] = [
    { key: "all", label: "All" },
    { key: "unwatched", label: "Unwatched", count: unwatchedCount },
    { key: "watched", label: "Watched", count: watchedCount },
  ];

  return (
    <div>
      {/* Toolbar: filters + actions */}
      {!loading && videos.length > 0 && (
        <div className="animate-feed-in border-b border-[var(--border)]">
          <div className="flex items-center px-4 sm:px-0">
            {/* Filter pills */}
            <div className="flex flex-1 items-center gap-1 py-2">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors duration-200 ${
                    filter === f.key
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {f.label}
                  {f.count !== undefined && f.count > 0 && (
                    <span
                      className={`ml-1.5 text-[12px] ${
                        filter === f.key
                          ? "text-white/70"
                          : "text-[var(--text-muted)]"
                      }`}
                    >
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {/* Next update indicator */}
              {nextUpdateAt && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNextUpdate((prev) => !prev);
                      if (nextUpdateTimer.current) clearTimeout(nextUpdateTimer.current);
                      nextUpdateTimer.current = setTimeout(() => setShowNextUpdate(false), 3000);
                    }}
                    className="flex h-8 items-center gap-1 rounded-full px-2 text-[12px] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] sm:pointer-events-none"
                    title={`Next feed update at ${formatNextUpdate(nextUpdateAt)}`}
                  >
                    <svg
                      className="h-[14px] w-[14px]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="hidden sm:inline">
                      {formatNextUpdate(nextUpdateAt)}
                    </span>
                  </button>
                  {showNextUpdate && (
                    <div className="absolute right-0 top-full z-50 mt-1 whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] text-[var(--text-secondary)] shadow-lg sm:hidden">
                      Update at {formatNextUpdate(nextUpdateAt)}
                    </div>
                  )}
                </div>
              )}

              {/* Mark all as watched */}
              {unwatchedInView.length > 0 && (
                <button
                  onClick={() =>
                    markAllWatched(unwatchedInView.map((v) => v.videoId))
                  }
                  className="flex h-8 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--success)]"
                  title="Mark all visible as watched"
                >
                  <svg
                    className="h-[14px] w-[14px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <path d="M22 4L12 14.01l-3-3" />
                  </svg>
                  <span className="hidden sm:inline">Mark all watched</span>
                </button>
              )}

              {/* View toggle */}
              <button
                onClick={handleViewToggle}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                title={viewMode === "list" ? "Grid view" : "List view"}
              >
                {viewMode === "list" ? (
                  <svg
                    className="h-[16px] w-[16px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                ) : (
                  <svg
                    className="h-[16px] w-[16px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                )}
              </button>

              {/* Search toggle */}
              <button
                onClick={() => {
                  setSearchOpen((prev) => !prev);
                  if (searchOpen) setSearchQuery("");
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  searchOpen
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                }`}
                title="Search videos"
              >
                <svg
                  className="h-[16px] w-[16px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </button>
            </div>
          </div>

          {/* Channel filter bar */}
          {channels.length >= 2 && (
            <div className="border-t border-[var(--border)] px-4 py-1.5 sm:px-0">
              <div className="scrollbar-hide flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setSelectedChannel(null)}
                  className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold transition-colors duration-200 ${
                    selectedChannel === null
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  All channels
                </button>
                {channels.map((ch) => (
                  <button
                    key={ch.channelId}
                    onClick={() =>
                      setSelectedChannel(
                        selectedChannel === ch.channelId ? null : ch.channelId
                      )
                    }
                    className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[12px] font-semibold transition-colors duration-200 ${
                      selectedChannel === ch.channelId
                        ? "bg-[var(--accent)] text-white"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <div className="h-[18px] w-[18px] flex-shrink-0 overflow-hidden rounded-full bg-[var(--bg-surface)]">
                      {ch.channelThumbnail ? (
                        <img
                          src={ch.channelThumbnail}
                          alt={ch.channelName}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[9px] font-bold text-[var(--text-secondary)]">
                          {ch.channelName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="max-w-[100px] truncate">
                      {ch.channelName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search bar (animated slide) */}
          <div
            className={`search-slide border-t border-[var(--border)] ${
              searchOpen ? "search-slide-enter" : "search-slide-exit"
            }`}
          >
            <div className="px-4 py-2 sm:px-0">
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 flex-shrink-0 text-[var(--text-muted)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or channel..."
                  className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
                  autoFocus={searchOpen}
                  tabIndex={searchOpen ? 0 : -1}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--text-muted)] text-[var(--bg-app)]"
                  >
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonVideoCard key={i} />
          ))}
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

      {/* No results from filter/search */}
      {!loading &&
        !error &&
        videos.length > 0 &&
        filteredVideos.length === 0 && (
          <div className="flex flex-col items-center justify-center px-4 py-20">
            {filter === "unwatched" && !searchQuery && (
              <svg
                className="mb-4 h-12 w-12 text-[var(--text-muted)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 2C8.5 2 6 5 6 8v6c0 1-1 2-1 3s1 1.5 1.5 1.5c.5-.5 1-1.5 1.5-1.5s1.5 1.5 2 1.5S11 17 12 17s1.5 1.5 2 1.5 1.5-1.5 2-1.5 1 1 1.5 1.5S19 18 19 17s-1-2-1-3V8c0-3-2.5-6-6-6z"
                />
                <circle cx="9.5" cy="9" r="1" fill="currentColor" stroke="none" />
                <circle cx="14.5" cy="9" r="1" fill="currentColor" stroke="none" />
              </svg>
            )}
            <p className="text-[15px] text-[var(--text-secondary)]">
              {searchQuery
                ? "No videos match your search."
                : filter === "unwatched"
                  ? "All caught up -- no unwatched videos."
                  : "No watched videos yet."}
            </p>
          </div>
        )}

      {/* Feed */}
      {!loading && !error && filteredVideos.length > 0 && (
        <div
          className="view-transition"
          style={{ opacity: viewFading ? 0 : 1 }}
          onTransitionEnd={() => {
            if (!viewFading) hasAnimated.current = true;
          }}
        >
          {viewMode === "list" ? (
            <div>
              {filteredVideos.map((video, i) => (
                <div
                  key={video.videoId}
                  className={hasAnimated.current ? "" : "animate-feed-in"}
                  style={
                    hasAnimated.current
                      ? undefined
                      : ({
                          "--feed-in-delay": `${Math.min(i * 50, 500)}ms`,
                        } as React.CSSProperties)
                  }
                >
                  <VideoCard
                    {...video}
                    onToggleWatched={toggleWatched}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 px-4 py-3 sm:px-0">
              {filteredVideos.map((video, i) => (
                <div
                  key={video.videoId}
                  className={hasAnimated.current ? "" : "animate-feed-in"}
                  style={
                    hasAnimated.current
                      ? undefined
                      : ({
                          "--feed-in-delay": `${Math.min(i * 50, 500)}ms`,
                        } as React.CSSProperties)
                  }
                >
                  <VideoCardGrid
                    {...video}
                    onToggleWatched={toggleWatched}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

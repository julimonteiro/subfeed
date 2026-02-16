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

const AUTO_REFRESH_INTERVAL = 2 * 60 * 1000;

export default function TimelinePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("subfeed_view") as ViewMode) || "list";
    }
    return "list";
  });
  const [newVideoCount, setNewVideoCount] = useState(0);
  const pendingVideosRef = useRef<Video[] | null>(null);

  const fetchFeed = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/feed");
      if (!response.ok) throw new Error("Failed to fetch feed");
      const data = (await response.json()) as Video[];
      setVideos(data);
      setNewVideoCount(0);
      pendingVideosRef.current = null;
    } catch {
      setError("Could not load feed. Try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
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

      // Optimistic update
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
        // Revert on failure
        setVideos((prev) =>
          prev.map((v) =>
            videoIds.includes(v.videoId) ? { ...v, watched: false } : v
          )
        );
      }
    },
    []
  );

  const filteredVideos = useMemo(() => {
    let result = videos;

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
  }, [videos, filter, searchQuery]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Auto-refresh: poll for new videos in the background
  useEffect(() => {
    if (loading) return;

    const checkForNewVideos = async () => {
      if (document.visibilityState === "hidden") return;

      try {
        const response = await fetch("/api/feed");
        if (!response.ok) return;
        const data = (await response.json()) as Video[];

        const currentIds = new Set(videos.map((v) => v.videoId));
        const newVideos = data.filter((v) => !currentIds.has(v.videoId));

        if (newVideos.length > 0) {
          setNewVideoCount(newVideos.length);
          pendingVideosRef.current = data;
        }
      } catch {
        // Silent fail for background polling
      }
    };

    const interval = setInterval(checkForNewVideos, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loading, videos]);

  const loadPendingVideos = useCallback(() => {
    if (pendingVideosRef.current) {
      setVideos(pendingVideosRef.current);
      pendingVideosRef.current = null;
      setNewVideoCount(0);
    }
  }, []);

  const handleViewToggle = useCallback(() => {
    setViewMode((prev) => {
      const next = prev === "list" ? "grid" : "list";
      localStorage.setItem("subfeed_view", next);
      return next;
    });
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
      {/* New videos banner (auto-refresh) */}
      {newVideoCount > 0 && (
        <button
          onClick={loadPendingVideos}
          className="flex w-full items-center justify-center border-b border-[var(--border)] bg-[var(--accent)]/10 py-2.5 text-[14px] font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/20"
        >
          {newVideoCount} new {newVideoCount === 1 ? "video" : "videos"} -- Click to load
        </button>
      )}

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

      {/* Toolbar: filters + actions */}
      {!loading && videos.length > 0 && (
        <div className="border-b border-[var(--border)]">
          <div className="flex items-center px-4 sm:px-0">
            {/* Filter pills */}
            <div className="flex flex-1 items-center gap-1 py-2">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${
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

          {/* Search bar (collapsible) */}
          {searchOpen && (
            <div className="border-t border-[var(--border)] px-4 py-2 sm:px-0">
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
                  autoFocus
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
          )}
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
        <>
          {viewMode === "list" ? (
            <div>
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.videoId}
                  {...video}
                  onToggleWatched={toggleWatched}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 px-4 py-3 sm:px-0">
              {filteredVideos.map((video) => (
                <VideoCardGrid
                  key={video.videoId}
                  {...video}
                  onToggleWatched={toggleWatched}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

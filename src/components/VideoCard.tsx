"use client";

import { formatDistanceToNow } from "date-fns";

interface VideoCardProps {
  videoId: string;
  title: string;
  link: string;
  thumbnail: string;
  channelName: string;
  channelThumbnail?: string | null;
  publishedAt: string;
  watched: boolean;
  onToggleWatched: (videoId: string, currentlyWatched: boolean) => void;
}

export default function VideoCard({
  videoId,
  title,
  link,
  thumbnail,
  channelName,
  channelThumbnail,
  publishedAt,
  watched,
  onToggleWatched,
}: VideoCardProps) {
  const timeAgo = publishedAt
    ? formatDistanceToNow(new Date(publishedAt), {
        addSuffix: false,
      })
    : "";

  return (
    <div
      className={`border-b border-[var(--border)] transition-opacity duration-200 ${watched ? "opacity-50" : ""}`}
    >
      <div className="px-4 py-3 sm:px-0">
        {/* Header: avatar, name, handle, time */}
        <div className="flex items-start gap-2.5">
          {/* Avatar */}
          <div className="h-[42px] w-[42px] flex-shrink-0 overflow-hidden rounded-full bg-[var(--bg-surface)]">
            {channelThumbnail ? (
              <img
                src={channelThumbnail}
                alt={channelName}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[15px] font-bold text-[var(--text-secondary)]">
                {channelName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 pt-0.5">
            {/* Name row */}
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[15px] font-bold text-[var(--text-primary)]">
                {channelName}
              </span>
              {timeAgo && (
                <>
                  <span className="text-[var(--text-muted)]">&middot;</span>
                  <span className="flex-shrink-0 text-[14px] text-[var(--text-secondary)]">
                    {timeAgo}
                  </span>
                </>
              )}
              {watched && (
                <>
                  <span className="text-[var(--text-muted)]">&middot;</span>
                  <span className="flex-shrink-0 text-[12px] font-medium text-[var(--success)]">
                    Watched
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            <p className="mt-0.5 text-[15px] leading-[21px] text-[var(--text-primary)]">
              {title}
            </p>

            {/* Thumbnail */}
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-2.5 block overflow-hidden rounded-xl border border-[var(--border)] transition-colors hover:border-[var(--border-light)]"
              onClick={() => {
                if (!watched) {
                  onToggleWatched(videoId, false);
                }
              }}
            >
              <div className="relative aspect-video w-full bg-[var(--bg-surface)]">
                <img
                  src={thumbnail}
                  alt={title}
                  className="h-full w-full object-cover transition-[filter] duration-200 group-hover:brightness-110"
                  loading="lazy"
                />
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                    <svg
                      className="ml-1 h-6 w-6 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                {/* Watched badge on thumbnail */}
                {watched && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 backdrop-blur-sm">
                    <svg
                      className="h-3.5 w-3.5 text-[var(--success)]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-[11px] font-medium text-white">
                      Watched
                    </span>
                  </div>
                )}
              </div>
            </a>

            {/* Action bar */}
            <div className="-ml-2 mt-2 flex items-center gap-2">
              {/* Watch on YouTube */}
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--accent)]"
                onClick={() => {
                  if (!watched) {
                    onToggleWatched(videoId, false);
                  }
                }}
              >
                <svg
                  className="h-[18px] w-[18px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                <span className="text-[13px]">Watch</span>
              </a>

              {/* Toggle watched */}
              <button
                type="button"
                onClick={() => onToggleWatched(videoId, watched)}
                className={`flex items-center gap-1.5 rounded-full px-2 py-1.5 transition-colors hover:bg-[var(--bg-surface)] ${
                  watched
                    ? "text-[var(--success)] hover:text-[var(--text-secondary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--success)]"
                }`}
                title={watched ? "Mark as unwatched" : "Mark as watched"}
              >
                {watched ? (
                  <svg
                    className="h-[18px] w-[18px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-[18px] w-[18px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
                <span className="text-[13px]">
                  {watched ? "Watched" : "Mark watched"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

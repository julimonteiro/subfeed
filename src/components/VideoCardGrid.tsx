"use client";

import { formatDistanceToNow } from "date-fns";

interface VideoCardGridProps {
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

export default function VideoCardGrid({
  videoId,
  title,
  link,
  thumbnail,
  channelName,
  publishedAt,
  watched,
  onToggleWatched,
}: VideoCardGridProps) {
  const timeAgo = publishedAt
    ? formatDistanceToNow(new Date(publishedAt), { addSuffix: false })
    : "";

  return (
    <div
      className={`overflow-hidden rounded-xl border border-[var(--border)] transition-opacity duration-200 ${
        watched ? "opacity-50" : ""
      }`}
    >
      {/* Thumbnail */}
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
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
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
              <svg
                className="ml-0.5 h-4 w-4 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          {/* Watched badge */}
          {watched && (
            <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded bg-black/70 px-1.5 py-0.5 backdrop-blur-sm">
              <svg
                className="h-3 w-3 text-[var(--success)]"
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
            </div>
          )}
        </div>
      </a>

      {/* Info */}
      <div className="p-2.5">
        <p className="line-clamp-2 text-[13px] font-semibold leading-[18px] text-[var(--text-primary)]">
          {title}
        </p>
        <div className="mt-1 flex items-center gap-1">
          <span className="truncate text-[12px] text-[var(--text-secondary)]">
            {channelName}
          </span>
          {timeAgo && (
            <>
              <span className="text-[11px] text-[var(--text-muted)]">
                &middot;
              </span>
              <span className="flex-shrink-0 text-[12px] text-[var(--text-muted)]">
                {timeAgo}
              </span>
            </>
          )}
        </div>

        {/* Quick watched toggle */}
        <button
          type="button"
          onClick={() => onToggleWatched(videoId, watched)}
          className={`mt-1.5 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
            watched
              ? "text-[var(--success)] hover:text-[var(--text-secondary)]"
              : "text-[var(--text-muted)] hover:text-[var(--success)]"
          }`}
          title={watched ? "Mark as unwatched" : "Mark as watched"}
        >
          {watched ? (
            <svg
              className="h-3.5 w-3.5"
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
              className="h-3.5 w-3.5"
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
          {watched ? "Watched" : "Mark watched"}
        </button>
      </div>
    </div>
  );
}

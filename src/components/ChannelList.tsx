"use client";

import { useState } from "react";

interface Channel {
  id: number;
  channel_id: string;
  name: string;
  handle: string | null;
  thumbnail_url: string | null;
  added_at: string;
}

interface ChannelListProps {
  channels: Channel[];
  onChannelRemoved: () => void;
}

export default function ChannelList({
  channels,
  onChannelRemoved,
}: ChannelListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this channel?")) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/channels/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onChannelRemoved();
      }
    } catch {
      console.error("Error deleting channel");
    } finally {
      setDeletingId(null);
    }
  };

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center px-4 py-20">
        <svg
          className="h-10 w-10 text-[var(--text-muted)]"
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
        <p className="mt-3 text-[15px] text-[var(--text-secondary)]">
          No channels added yet.
        </p>
        <p className="mt-1 text-[13px] text-[var(--text-muted)]">
          Use the field above to add channels.
        </p>
      </div>
    );
  }

  return (
    <div>
      {channels.map((channel) => (
        <div
          key={channel.id}
          className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 transition-colors hover:bg-[var(--bg-surface-hover)] sm:px-0"
        >
          {/* Avatar */}
          <a
            href={`https://www.youtube.com/channel/${channel.channel_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-[42px] w-[42px] flex-shrink-0 overflow-hidden rounded-full bg-[var(--bg-surface)]"
          >
            {channel.thumbnail_url ? (
              <img
                src={channel.thumbnail_url}
                alt={channel.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[15px] font-bold text-[var(--text-secondary)]">
                {channel.name.charAt(0).toUpperCase()}
              </div>
            )}
          </a>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <a
              href={`https://www.youtube.com/channel/${channel.channel_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-[15px] font-bold text-[var(--text-primary)] hover:underline"
            >
              {channel.name}
            </a>
            {channel.handle && (
              <p className="mt-0.5 truncate text-[13px] text-[var(--text-secondary)]">
                {channel.handle}
              </p>
            )}
          </div>

          {/* Remove button */}
          <button
            onClick={() => handleDelete(channel.id)}
            disabled={deletingId === channel.id}
            className="flex h-[32px] flex-shrink-0 items-center rounded-full border border-[var(--border)] px-4 text-[13px] font-semibold text-[var(--text-secondary)] transition-all hover:border-[var(--danger)] hover:text-[var(--danger)] disabled:opacity-50"
          >
            {deletingId === channel.id ? (
              <svg
                className="h-3.5 w-3.5 animate-spin"
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
            ) : (
              "Remove"
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

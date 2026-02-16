"use client";

import { useState, useEffect, useCallback } from "react";
import ChannelForm from "@/components/ChannelForm";
import ChannelList from "@/components/ChannelList";

interface Channel {
  id: number;
  channel_id: string;
  name: string;
  handle: string | null;
  thumbnail_url: string | null;
  added_at: string;
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChannels = useCallback(async () => {
    try {
      const response = await fetch("/api/channels");
      if (response.ok) {
        const data = (await response.json()) as Channel[];
        setChannels(data);
      }
    } catch {
      console.error("Error fetching channels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  return (
    <div>
      {/* Add channel form */}
      <ChannelForm onChannelAdded={fetchChannels} />

      {/* Channel count header */}
      {!loading && channels.length > 0 && (
        <div className="border-b border-[var(--border)] px-4 py-2.5 sm:px-0">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {channels.length} {channels.length === 1 ? "channel" : "channels"}
          </p>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg
            className="h-6 w-6 animate-spin text-[var(--accent)]"
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
      ) : (
        <ChannelList channels={channels} onChannelRemoved={fetchChannels} />
      )}
    </div>
  );
}

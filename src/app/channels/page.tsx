"use client";

import { useState, useEffect, useCallback } from "react";
import ChannelForm from "@/components/ChannelForm";
import ChannelList from "@/components/ChannelList";
import { SkeletonChannelItem } from "@/components/SkeletonCard";

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
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonChannelItem key={i} />
          ))}
        </div>
      ) : (
        <ChannelList channels={channels} onChannelRemoved={fetchChannels} />
      )}
    </div>
  );
}

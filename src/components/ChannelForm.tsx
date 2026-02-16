"use client";

import { useState } from "react";

interface ChannelFormProps {
  onChannelAdded: () => void;
}

interface ResolvedChannel {
  channelId: string;
  name: string;
  handle: string | null;
  thumbnailUrl: string | null;
  alreadyAdded: boolean;
}

export default function ChannelForm({ onChannelAdded }: ChannelFormProps) {
  const [url, setUrl] = useState("");
  const [resolving, setResolving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<ResolvedChannel | null>(null);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPreview(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Paste the YouTube channel URL");
      return;
    }

    setResolving(true);

    try {
      const response = await fetch("/api/channels/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = (await response.json()) as
        | ResolvedChannel
        | { error: string };

      if (!response.ok) {
        setError(
          "error" in data ? data.error : "Could not find this channel"
        );
        return;
      }

      setPreview(data as ResolvedChannel);
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setResolving(false);
    }
  };

  const handleAdd = async () => {
    if (!preview) return;

    setAdding(true);
    setError(null);

    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: preview.channelId,
          name: preview.name,
          handle: preview.handle,
          thumbnailUrl: preview.thumbnailUrl,
        }),
      });

      const data = (await response.json()) as { error?: string; name?: string };

      if (!response.ok) {
        setError(data.error || "Error adding channel");
        return;
      }

      setSuccess(`${preview.name} added`);
      setUrl("");
      setPreview(null);
      onChannelAdded();

      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setAdding(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setError(null);
  };

  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg-surface)]">
      <form onSubmit={handleResolve} className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Search icon */}
          <svg
            className="h-5 w-5 flex-shrink-0 text-[var(--text-muted)]"
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

          {/* Input */}
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
              if (preview) {
                setPreview(null);
              }
            }}
            placeholder="Paste the YouTube channel URL..."
            className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
            disabled={resolving || adding}
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={resolving || adding || !url.trim() || !!preview}
            className="flex h-[34px] flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-[14px] font-bold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-30 disabled:hover:bg-[var(--accent)]"
          >
            {resolving ? (
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
            ) : (
              "Search"
            )}
          </button>
        </div>
      </form>

      {/* Channel preview card */}
      {preview && (
        <div className="border-t border-[var(--border)] px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="h-[48px] w-[48px] flex-shrink-0 overflow-hidden rounded-full bg-[var(--bg-app)]">
              {preview.thumbnailUrl ? (
                <img
                  src={preview.thumbnailUrl}
                  alt={preview.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[17px] font-bold text-[var(--text-secondary)]">
                  {preview.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-[var(--text-primary)]">
                {preview.name}
              </p>
              {preview.handle && (
                <p className="mt-0.5 truncate text-[13px] text-[var(--text-secondary)]">
                  {preview.handle}
                </p>
              )}
              {preview.alreadyAdded && (
                <p className="mt-1 text-[13px] font-medium text-[var(--danger)]">
                  This channel is already in your list
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-app)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={adding || preview.alreadyAdded}
                className="flex h-[34px] items-center justify-center rounded-full bg-[var(--accent)] px-5 text-[14px] font-bold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-30"
              >
                {adding ? (
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
                ) : (
                  "Add"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback */}
      {(error || success) && (
        <div className="border-t border-[var(--border)] px-4 py-2">
          {error && (
            <p className="text-[13px] text-[var(--danger)]">{error}</p>
          )}
          {success && (
            <p className="text-[13px] text-[var(--success)]">{success}</p>
          )}
        </div>
      )}
    </div>
  );
}

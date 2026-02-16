"use client";

import { useState } from "react";

interface ChannelFormProps {
  onChannelAdded: () => void;
}

export default function ChannelForm({ onChannelAdded }: ChannelFormProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Paste the YouTube channel URL");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = (await response.json()) as {
        error?: string;
        name?: string;
      };

      if (!response.ok) {
        setError(data.error || "Error adding channel");
        return;
      }

      setSuccess(`${data.name} added`);
      setUrl("");
      onChannelAdded();

      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3">
      <form onSubmit={handleSubmit}>
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
            }}
            placeholder="Paste the YouTube channel URL..."
            className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
            disabled={loading}
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="flex h-[34px] flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-[14px] font-bold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-30 disabled:hover:bg-[var(--accent)]"
          >
            {loading ? (
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
      </form>

      {/* Feedback */}
      {error && (
        <p className="mt-2 text-[13px] text-[var(--danger)]">{error}</p>
      )}
      {success && (
        <p className="mt-2 text-[13px] text-[var(--success)]">{success}</p>
      )}
    </div>
  );
}

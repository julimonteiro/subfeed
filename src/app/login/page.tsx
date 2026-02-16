"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  // Check if auth is required on mount
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/auth");
        const data = (await response.json()) as { required: boolean };

        if (!data.required) {
          // Auth not configured -- cookie was auto-set by the API
          router.replace("/");
          return;
        }
      } catch {
        // If check fails, show the login form as a safe default
      }
      setChecking(false);
    })();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError("Enter the password");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error || "Login failed");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show nothing while checking if auth is required
  if (checking) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
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
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-[340px]">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <Logo size={40} />
          <h1 className="mt-3 text-[22px] font-bold text-[var(--text-primary)]">
            SubFeed
          </h1>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
            Enter the password to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="Password"
              autoFocus
              disabled={loading}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-[15px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)]"
            />

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="flex w-full items-center justify-center rounded-lg bg-[var(--accent)] py-3 text-[15px] font-bold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-40"
            >
              {loading ? (
                <svg
                  className="h-5 w-5 animate-spin"
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
                "Log in"
              )}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <p className="mt-3 text-center text-[13px] text-[var(--danger)]">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

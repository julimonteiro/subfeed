"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/login";

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-app)]">
      <div className="mx-auto flex h-[52px] max-w-[600px] items-center px-4">
        {/* Logo */}
        <Link
          href="/"
          className="mr-auto flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <svg
            className="h-7 w-7 text-[var(--accent)]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          <span className="hidden text-[16px] font-bold tracking-tight text-[var(--text-primary)] sm:inline">
            SubFeed
          </span>
        </Link>

        {/* Tab navigation + logout */}
        {!isLoginPage && (
          <div className="flex h-full items-stretch">
            <Link
              href="/"
              className="relative flex items-center px-4 text-[14px] font-semibold transition-colors"
            >
              <span
                className={
                  pathname === "/"
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }
              >
                Feed
              </span>
              {pathname === "/" && (
                <span className="absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-[var(--accent)]" />
              )}
            </Link>

            <Link
              href="/channels"
              className="relative flex items-center px-4 text-[14px] font-semibold transition-colors"
            >
              <span
                className={
                  pathname === "/channels"
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }
              >
                Channels
              </span>
              {pathname === "/channels" && (
                <span className="absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-[var(--accent)]" />
              )}
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Log out"
              className="ml-2 flex items-center px-2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
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
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

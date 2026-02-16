"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";

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
      <div className="relative mx-auto flex h-[52px] max-w-[600px] items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="relative z-10 flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <Logo size={28} />
        </Link>

        {!isLoginPage && (
          <>
            {/* Tab navigation (absolute center) */}
            <div className="absolute inset-0 flex h-full items-stretch justify-center">
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
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Log out"
              className="relative z-10 flex items-center px-2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
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
          </>
        )}
      </div>
    </nav>
  );
}

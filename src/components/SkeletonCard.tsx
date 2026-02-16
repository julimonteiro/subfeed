export function SkeletonVideoCard() {
  return (
    <div className="border-b border-[var(--border)]">
      <div className="px-4 py-3 sm:px-0">
        <div className="flex items-start gap-2.5 animate-pulse">
          {/* Avatar */}
          <div className="h-[42px] w-[42px] flex-shrink-0 rounded-full bg-[var(--bg-surface)]" />

          {/* Content */}
          <div className="min-w-0 flex-1 pt-0.5">
            {/* Name row */}
            <div className="flex items-center gap-2">
              <div className="h-4 w-28 rounded bg-[var(--bg-surface)]" />
              <div className="h-3 w-16 rounded bg-[var(--bg-surface)]" />
            </div>

            {/* Title lines */}
            <div className="mt-2 h-4 w-full rounded bg-[var(--bg-surface)]" />
            <div className="mt-1.5 h-4 w-3/4 rounded bg-[var(--bg-surface)]" />

            {/* Thumbnail */}
            <div className="mt-2.5 aspect-video w-full rounded-xl bg-[var(--bg-surface)]" />

            {/* Action bar */}
            <div className="mt-2 flex items-center gap-4">
              <div className="h-4 w-16 rounded bg-[var(--bg-surface)]" />
              <div className="h-4 w-24 rounded bg-[var(--bg-surface)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonChannelItem() {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-0 animate-pulse">
      {/* Avatar */}
      <div className="h-[42px] w-[42px] flex-shrink-0 rounded-full bg-[var(--bg-surface)]" />

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="h-4 w-36 rounded bg-[var(--bg-surface)]" />
        <div className="mt-1.5 h-3 w-24 rounded bg-[var(--bg-surface)]" />
      </div>

      {/* Button placeholder */}
      <div className="h-[32px] w-[80px] rounded-full bg-[var(--bg-surface)]" />
    </div>
  );
}

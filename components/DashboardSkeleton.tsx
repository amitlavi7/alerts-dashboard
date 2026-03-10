"use client";

function SkeletonBlock({
  className = "",
  height,
}: {
  className?: string;
  height?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded bg-zinc-200 dark:bg-zinc-700 ${className}`}
      style={height ? { height } : undefined}
    />
  );
}

const cardClass =
  "rounded-xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/50";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <section className={`${cardClass} p-5`}>
        <SkeletonBlock className="mb-4 h-6 w-24" />
        <div className="space-y-5">
          <div>
            <SkeletonBlock className="mb-2 h-4 w-20" />
            <div className="flex flex-wrap gap-2">
              <SkeletonBlock className="h-10 w-28" />
              <SkeletonBlock className="h-10 w-28" />
              <SkeletonBlock className="h-10 w-28" />
            </div>
          </div>
          <div>
            <SkeletonBlock className="mb-2 h-4 w-20" />
            <SkeletonBlock className="h-4 w-4" />
          </div>
          <div>
            <SkeletonBlock className="mb-2 h-4 w-24" />
            <SkeletonBlock className="h-10 w-full max-w-md" />
          </div>
        </div>
      </section>
      <section>
        <SkeletonBlock className="mb-4 h-6 w-24" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`${cardClass} p-4`}>
              <SkeletonBlock className="mb-2 h-3 w-16" />
              <SkeletonBlock className="h-8 w-14" />
            </div>
          ))}
        </div>
      </section>
      <section>
        <SkeletonBlock className="mb-4 h-6 w-36" />
        <div className={`${cardClass} p-5`}>
          <SkeletonBlock className="h-64 w-full" />
        </div>
      </section>
      <section>
        <SkeletonBlock className="mb-4 h-6 w-48" />
        <div className={`${cardClass} p-5`}>
          <SkeletonBlock className="h-64 w-full" />
        </div>
      </section>
    </div>
  );
}

import { Suspense } from "react";
import { Dashboard } from "@/components/Dashboard";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-white/95 px-6 py-5 backdrop-blur-sm transition-shadow dark:border-zinc-800 dark:bg-zinc-950/95">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Pikud Haoref Alerts
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Historical alert statistics from the Israeli Home Front Command
        </p>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Suspense fallback={<DashboardSkeleton />}>
          <Dashboard />
        </Suspense>
      </main>
    </div>
  );
}

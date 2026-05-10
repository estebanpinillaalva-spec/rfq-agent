export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-9 w-48 rounded-md bg-[var(--border)]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="surface-card rounded-lg p-5">
            <div className="h-3 w-20 rounded bg-[var(--border)]" />
            <div className="mt-3 h-8 w-12 rounded bg-[var(--border)]" />
            <div className="mt-2 h-3 w-24 rounded bg-[var(--border)]" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <div className="surface-card rounded-lg p-5">
          <div className="mb-4 h-5 w-32 rounded bg-[var(--border)]" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="mt-3 flex gap-4 border-t border-[var(--border)] pt-3">
              <div className="h-4 flex-1 rounded bg-[var(--border)]" />
              <div className="h-4 w-24 rounded bg-[var(--border)]" />
              <div className="h-4 w-16 rounded bg-[var(--border)]" />
            </div>
          ))}
        </div>
        <div className="surface-card rounded-lg p-5">
          <div className="h-5 w-40 rounded bg-[var(--border)]" />
          <div className="mt-5 flex items-end gap-2 h-28">
            {[60, 90, 40, 100, 70, 50, 80].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-[var(--border)]" style={{ height: `${h * 0.7}px` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

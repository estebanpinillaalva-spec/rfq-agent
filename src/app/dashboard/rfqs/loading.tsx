export default function RfqsLoading() {
  return (
    <div className="animate-pulse grid gap-5">
      <div className="h-9 w-24 rounded-md bg-[var(--border)]" />
      <div className="surface-card rounded-lg p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_180px_180px_180px_180px]">
          <div className="h-10 rounded-md bg-[var(--border)]" />
          <div className="h-10 rounded-md bg-[var(--border)]" />
          <div className="h-10 rounded-md bg-[var(--border)]" />
          <div className="h-10 rounded-md bg-[var(--border)]" />
          <div className="h-10 rounded-md bg-[var(--border)]" />
        </div>
      </div>
      <div className="surface-card rounded-lg p-4">
        <div className="h-10 w-full rounded-md bg-[var(--border)]" />
      </div>
      <div className="grid min-w-0 gap-4 xl:grid-cols-3">
        {[1, 2, 3].map((col) => (
          <div key={col} className="surface-card rounded-lg p-4">
            <div className="mb-3 h-4 w-32 rounded bg-[var(--border)]" />
            {[1, 2].map((card) => (
              <div key={card} className="mt-3 rounded-md border border-[var(--border)] p-3">
                <div className="h-4 w-3/4 rounded bg-[var(--border)]" />
                <div className="mt-2 h-3 w-1/2 rounded bg-[var(--border)]" />
                <div className="mt-3 h-3 w-full rounded bg-[var(--border)]" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

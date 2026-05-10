export default function RfqDetailLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-3 w-24 rounded bg-[#e2e8f0]" />
          <div className="mt-2 h-7 w-56 rounded bg-[#e2e8f0]" />
        </div>
        <div className="h-9 w-20 rounded-md bg-[#e2e8f0]" />
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface-card rounded-lg p-4">
            <div className="h-3 w-16 rounded bg-[#e2e8f0]" />
            <div className="mt-3 h-5 w-24 rounded bg-[#e2e8f0]" />
          </div>
        ))}
      </section>

      <div className="surface-card mt-6 rounded-lg p-5">
        <div className="flex gap-3 border-b border-[#e2e8f0] pb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-md bg-[#e2e8f0]" />
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-4 rounded bg-[#e2e8f0]"
              style={{ width: `${45 + ((i * 13) % 45)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

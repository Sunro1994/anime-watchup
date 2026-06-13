export default function Loading() {
  return (
    <main className="p-4 space-y-4 pb-24">
      <div className="flex gap-3 items-start">
        <div className="w-20 h-28 bg-zinc-800 rounded-xl ring-1 ring-zinc-800 shrink-0 animate-pulse" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-6 w-3/4 bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse" />
            <div className="h-10 w-full bg-zinc-900/60 ring-1 ring-zinc-800 rounded-lg animate-pulse" />
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          <div className="flex-1 h-11 bg-zinc-800 rounded-lg animate-pulse" />
          <div className="w-16 h-11 bg-zinc-800 rounded-lg animate-pulse" />
        </div>
      </div>
    </main>
  )
}

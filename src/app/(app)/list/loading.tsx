export default function Loading() {
  return (
    <main className="p-4 space-y-4 pb-24">
      <div className="h-8 w-32 bg-zinc-800/60 rounded-lg animate-pulse" />
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-16 bg-zinc-900/60 ring-1 ring-zinc-800 rounded-full animate-pulse" />
        ))}
      </div>
      <ul className="space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="flex gap-3 items-center bg-zinc-900/40 ring-1 ring-zinc-800 rounded-xl p-3 animate-pulse">
            <div className="w-12 h-16 bg-zinc-800 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 bg-zinc-800 rounded" />
              <div className="h-3 w-1/3 bg-zinc-800 rounded" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}

export default function Loading() {
  return (
    <main className="p-4 space-y-4 pb-24">
      <div className="h-8 w-20 bg-zinc-800/60 rounded-lg animate-pulse" />
      <div className="h-12 w-full bg-zinc-900/60 ring-1 ring-zinc-800 rounded-lg animate-pulse" />
      <ul className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="flex gap-3 items-center bg-zinc-900/40 ring-1 ring-zinc-800 rounded-xl p-3 animate-pulse">
            <div className="w-12 h-16 bg-zinc-800 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-zinc-800 rounded" />
              <div className="h-3 w-1/2 bg-zinc-800 rounded" />
            </div>
            <div className="w-12 h-8 bg-zinc-800 rounded-lg shrink-0" />
          </li>
        ))}
      </ul>
    </main>
  )
}

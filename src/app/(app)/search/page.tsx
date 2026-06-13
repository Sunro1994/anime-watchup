import { SearchClient } from './search-client'

export default function SearchPage() {
  return (
    <main className="p-4 space-y-4 pb-24">
      <h1 className="text-2xl font-bold text-zinc-100">검색</h1>
      <SearchClient />
    </main>
  )
}

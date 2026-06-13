import { SearchClient } from './search-client'

export default function SearchPage() {
  return (
    <main className="p-4 space-y-4">
      <h1 className="text-lg font-bold">검색</h1>
      <SearchClient />
    </main>
  )
}

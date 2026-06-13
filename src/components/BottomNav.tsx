'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/list', label: '내 목록' },
  { href: '/search', label: '검색' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 inset-x-0 border-t bg-white">
      <ul className="flex">
        {TABS.map((t) => {
          const active = pathname.startsWith(t.href)
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={`block text-center p-3 text-sm ${active ? 'font-bold' : 'text-gray-500'}`}
              >
                {t.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

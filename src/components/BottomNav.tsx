'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { List, Search, User } from 'lucide-react'

const TABS = [
  { href: '/list', label: '내 목록', Icon: List },
  { href: '/search', label: '검색', Icon: Search },
  { href: '/me', label: '내 정보', Icon: User },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-zinc-950/80 backdrop-blur-md border-t border-zinc-800">
      <ul className="flex">
        {TABS.map((t) => {
          const active = pathname.startsWith(t.href)
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={`relative flex flex-col items-center justify-center py-2 gap-0.5 transition-colors duration-150 ${
                  active ? 'text-purple-300' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {active && (
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                )}
                <t.Icon className="w-5 h-5" />
                <span className="text-xs">{t.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

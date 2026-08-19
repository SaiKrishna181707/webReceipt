'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ShieldCheck, ArrowRight } from 'lucide-react'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Console', href: '/console' },
  { label: 'Mutation Lab', href: '/mutation-lab' },
  { label: 'Receipts', href: '/receipts' },
  { label: 'Docs', href: '/docs' },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href)

  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex gap-10 items-center">
            <Link className="text-lg font-bold tracking-tight flex items-center gap-2 text-white" href="/">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-cyan-500 flex items-center justify-center text-white">
                <ShieldCheck size={16} />
              </span>
              WebReceipt
            </Link>

            <div className="hidden items-center gap-6 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm transition-colors font-mono tracking-wide ${
                    isActive(item.href) ? 'text-white font-semibold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/console"
              className="hidden md:inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium h-9 px-4 transition-colors"
            >
              Launch Console <ArrowRight size={14} />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-transparent hover:bg-white/5 size-9 md:hidden text-white"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        <div className={`overflow-hidden transition-all duration-200 md:hidden ${mobileMenuOpen ? 'max-h-96 pb-4' : 'max-h-0'}`}>
          <div className="flex flex-col gap-3 mt-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm transition-colors font-mono tracking-wide py-1 ${
                  isActive(item.href) ? 'text-white font-semibold' : 'text-gray-400 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/console"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium h-10 w-full transition-colors"
            >
              Launch Console <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

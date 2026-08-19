'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

const navItems = [
  { label: 'Terminal', href: '/' },
  { label: 'Self-Healing', href: '/demo' },
  { label: 'Contracts', href: '/contracts' },
  { label: 'Evidence', href: '/evidence' },
  { label: 'Collectors', href: '/scrapers' },
  { label: 'API Docs', href: '/docs' },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/10 transition-colors bg-black/50 backdrop-blur-md">
        <div className="box-border mx-auto w-full max-w-[1300px] px-5 lg:px-16 border-x border-white/10 border-dashed">
          <div className="flex h-14 items-center justify-between">
            <div className="flex gap-10 items-center">
              <Link className="text-xl font-bold tracking-tighter flex items-center gap-2 text-white" href="/">
                {/* Simulated WeMakeDevs Logo */}
                <div className="w-8 h-8 rounded bg-gradient-to-tr from-[#ff4d4d] via-[#a855f7] to-[#ec4899] flex items-center justify-center text-white font-black text-xs">
                  WR
                </div>
                WebReceipt
              </Link>
              
              <div className="hidden items-center gap-6 md:flex">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm transition-colors font-mono uppercase tracking-wider ${
                      pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                        ? 'text-white font-semibold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-3 md:flex">
                <Link
                  className="group relative inline-flex shrink-0 items-center justify-center rounded-sm border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none overflow-hidden bg-theme-2-light text-white duration-300 hover:bg-theme-2-dark h-8 px-4"
                  href="/scrapers/new"
                >
                  <span className="relative z-10 inline-flex items-center gap-1.5">New Collector</span>
                </Link>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-sm border border-white/10 bg-transparent hover:bg-white/5 size-8 md:hidden text-white"
              >
                {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          <div className={`overflow-hidden transition-all duration-200 md:hidden ${mobileMenuOpen ? 'max-h-96 pb-4' : 'max-h-0'}`}>
            <div className="flex flex-col gap-4 mt-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm transition-colors font-mono uppercase tracking-wider text-center ${
                    pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                      ? 'text-white font-semibold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                className="relative inline-flex shrink-0 items-center justify-center rounded-sm border border-transparent text-sm font-medium transition-all overflow-hidden bg-theme-2-light text-white duration-300 hover:bg-theme-2-dark h-8 w-full"
                href="/scrapers/new"
                onClick={() => setMobileMenuOpen(false)}
              >
                New Collector
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

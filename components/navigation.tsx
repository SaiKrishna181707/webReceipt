'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronRight } from 'lucide-react'
import { SystemLink, SystemButton, SystemStatus } from '@/components/matrix/matrix-ui'
import { WebReceiptLogo } from '@/components/brand/webreceipt-logo'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Console', href: '/console' },
  { label: 'Mutation Lab', href: '/mutation-lab' },
  { label: 'Receipts', href: '/receipts' },
  { label: 'Docs', href: '/docs' },
]

const MOBILE_NAV_ID = 'wr-mobile-nav'

export function Navigation() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href)

  useEffect(() => setOpen(false), [pathname])

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-matrix-400/12 bg-black/85 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-matrix-rule opacity-40" />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[4.5rem] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4 lg:gap-8">
            <Link
              href="/"
              aria-label="WebReceipt home"
              className="group flex shrink-0 items-center font-mono text-matrix-400/40"
            >
              <WebReceiptLogo size={39} className="transition-transform duration-300 group-hover:-translate-y-px" />
            </Link>

            <span className="hidden h-5 w-px bg-matrix-400/15 lg:block" aria-hidden />
            <SystemStatus label="System" value="Online" className="hidden lg:inline-flex" />
          </div>

          <div className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`group relative font-mono text-[11px] uppercase tracking-[0.18em] transition-colors ${
                    active ? 'text-matrix-300' : 'text-void-200 hover:text-matrix-200'
                  }`}
                >
                  <span aria-hidden className={`absolute -left-3 text-matrix-400 transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    &gt;
                  </span>
                  {item.label}
                  {active && <span aria-hidden className="absolute -bottom-2 left-0 h-px w-full bg-matrix-400 shadow-[0_0_8px_rgba(51,255,102,.9)]" />}
                </Link>
              )
            })}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <SystemLink href="/console" tone="matrix" size="sm" className="hidden md:inline-flex">
              Launch console <ChevronRight size={13} aria-hidden />
            </SystemLink>
            <SystemButton
              type="button"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              aria-expanded={open}
              aria-controls={MOBILE_NAV_ID}
              tone="void"
              size="sm"
              className="w-10 !px-0 md:hidden"
            >
              {open ? <X size={17} aria-hidden /> : <Menu size={17} aria-hidden />}
            </SystemButton>
          </div>
        </div>

        <div id={MOBILE_NAV_ID} aria-hidden={!open} className={`overflow-hidden transition-all duration-300 md:hidden ${open ? 'max-h-96 pb-4' : 'max-h-0'}`}>
          <div className="mt-1 flex flex-col">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                tabIndex={open ? undefined : -1}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`flex touch-target items-center gap-2 border-b border-matrix-400/8 font-mono text-[12px] uppercase tracking-[0.18em] transition-colors ${isActive(item.href) ? 'text-matrix-300' : 'text-void-200'}`}
              >
                <span aria-hidden className="text-matrix-400/60">&gt;</span>
                {item.label}
              </Link>
            ))}
            <SystemLink href="/console" tone="matrix" size="md" className="mt-4 w-full" tabIndex={open ? undefined : -1}>
              Launch console <ChevronRight size={13} aria-hidden />
            </SystemLink>
          </div>
        </div>
      </div>
    </nav>
  )
}

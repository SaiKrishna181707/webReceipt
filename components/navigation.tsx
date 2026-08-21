'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ArrowRight } from 'lucide-react'
import { NeonLink, NeonButton } from '@/components/vice/vice-ui'
import { WebReceiptLogo } from '@/components/brand/webreceipt-logo'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Console', href: '/console' },
  { label: 'Mutation Lab', href: '/mutation-lab' },
  { label: 'Receipts', href: '/receipts' },
  { label: 'Docs', href: '/docs' },
]

/** The top bar is the underside of a hotel awning: dark glass, chrome, tube. */
export function Navigation() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href)

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-night-900/85 shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_18px_36px_-24px_rgba(0,0,0,1)] backdrop-blur-md">
      {/* Neon tube along the bottom edge of the awning */}
      <div className="pointer-events-none absolute inset-x-0 -bottom-px h-[2px] bg-neon-rule opacity-80 shadow-[0_0_14px_-2px_rgba(255,46,151,.9)]" />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-10">
            <Link className="group flex items-center" href="/" aria-label="WebReceipt home">
              <WebReceiptLogo
                size={20}
                className="transition-transform duration-300 group-hover:-translate-y-[1px]"
              />
            </Link>

            <div className="hidden items-center gap-7 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative font-mono text-[13px] uppercase tracking-[0.12em] transition-colors ${
                    isActive(item.href)
                      ? 'text-gold-300 [text-shadow:0_0_12px_rgba(255,194,60,.8)]'
                      : 'text-night-200 hover:text-white'
                  }`}
                >
                  {item.label}
                  {/* Active tab lights a tube underneath */}
                  {isActive(item.href) && (
                    <span className="absolute -bottom-2 left-0 h-[2px] w-full rounded-full bg-gold-400 shadow-[0_0_10px_rgba(255,194,60,.95)]" />
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NeonLink href="/console" tone="neon" size="sm" className="hidden md:inline-flex">
              Launch Console <ArrowRight size={14} />
            </NeonLink>
            <NeonButton
              type="button"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              tone="chrome"
              size="sm"
              className="w-10 !px-0 md:hidden"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </NeonButton>
          </div>
        </div>

        <div className={`overflow-hidden transition-all duration-300 md:hidden ${open ? 'max-h-96 pb-4' : 'max-h-0'}`}>
          <div className="mt-2 flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`py-1 font-mono text-sm uppercase tracking-[0.12em] transition-colors ${
                  isActive(item.href) ? 'text-gold-300' : 'text-night-200 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <NeonLink href="/console" tone="neon" size="md" className="w-full">
              Launch Console <ArrowRight size={14} />
            </NeonLink>
          </div>
        </div>
      </div>
    </nav>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ArrowRight } from 'lucide-react'
import { BrickLink } from '@/components/lego/brick-ui'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Console', href: '/console' },
  { label: 'Mutation Lab', href: '/mutation-lab' },
  { label: 'Receipts', href: '/receipts' },
  { label: 'Docs', href: '/docs' },
]

/** The top bar is a single dark 16x1 brick with studs along its underside. */
export function Navigation() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href)

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-black/60 bg-plate-800/92 shadow-[inset_0_2px_0_rgba(255,255,255,.09),0_5px_0_-1px_rgba(0,0,0,.6),0_14px_28px_-14px_rgba(0,0,0,.9)] backdrop-blur-md">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-10">
            <Link className="group flex items-center gap-2.5" href="/">
              {/* 2x2 brick logo mark */}
              <span
                className="relative grid h-9 w-9 grid-cols-2 gap-[2px] rounded-[5px] p-[3px]"
                style={{
                  background: 'linear-gradient(180deg,#ff5a63 0%,#e3000b 46%,#b40009 100%)',
                  boxShadow: 'inset 0 2px 0 rgba(255,255,255,.45), inset 0 -2px 0 rgba(0,0,0,.3), 0 3px 0 -1px #7c0006',
                }}
              >
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="rounded-full bg-white/45 shadow-[inset_0_-1px_0_rgba(0,0,0,.35)] transition-transform duration-300 group-hover:scale-110"
                  />
                ))}
              </span>
              <span className="display text-xl leading-none text-white">WebReceipt</span>
            </Link>

            <div className="hidden items-center gap-7 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative font-mono text-[13px] tracking-wide transition-colors ${
                    isActive(item.href) ? 'text-stud-400' : 'text-plate-200 hover:text-white'
                  }`}
                >
                  {item.label}
                  {/* Active tab gets a stud underneath */}
                  {isActive(item.href) && (
                    <span className="absolute -bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-stud-400 shadow-[0_0_8px_rgba(246,197,0,.9)]" />
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <BrickLink href="/console" tone="red" size="sm" studs={false} className="hidden md:inline-flex">
              Launch Console <ArrowRight size={14} />
            </BrickLink>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              className="brick-btn size-10 md:hidden"
              style={{
                background: 'linear-gradient(180deg,#55574f 0%,#3a3c36 46%,#26271f 100%)',
                color: '#f6f7f3',
                ['--brick-btn-edge' as string]: '#111208',
              }}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        <div className={`overflow-hidden transition-all duration-300 md:hidden ${open ? 'max-h-96 pb-4' : 'max-h-0'}`}>
          <div className="mt-2 flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`py-1 font-mono text-sm tracking-wide transition-colors ${
                  isActive(item.href) ? 'text-stud-400' : 'text-plate-200 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <BrickLink href="/console" tone="red" size="md" studs={false} className="w-full">
              Launch Console <ArrowRight size={14} />
            </BrickLink>
          </div>
        </div>
      </div>
    </nav>
  )
}

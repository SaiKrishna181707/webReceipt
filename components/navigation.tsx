'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  FileCheck2,
  FlaskConical,
  GitCompare,
  Home,
  Menu,
  Plus,
  Receipt,
  ShieldCheck,
  TerminalSquare,
  X,
} from 'lucide-react'

const primary = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Console', href: '/console', icon: TerminalSquare },
  { label: 'Mutation Lab', href: '/mutation-lab', icon: FlaskConical },
  { label: 'Receipts', href: '/receipts', icon: Receipt },
  { label: 'Docs', href: '/docs', icon: BookOpen },
]

const workspace = [
  { label: 'Deal Contracts', href: '/receipts', icon: FileCheck2 },
  { label: 'Integrity', href: '/console', icon: ShieldCheck },
  { label: 'Promise Diff', href: '/console', icon: GitCompare },
]

export function Navigation() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [pathname])

  const active = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`))

  return (
    <>
      <header className="scout-mobile-bar">
        <Link href="/" className="scout-mobile-brand" aria-label="WebReceipt home">
          <BrandMark />
          <span>WebReceipt</span>
        </Link>
        <button
          type="button"
          className="scout-mobile-menu"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
        </button>
      </header>

      {open && <button className="scout-mobile-overlay" aria-label="Close navigation" onClick={() => setOpen(false)} />}

      <aside className={`scout-sidebar ${open ? 'is-open' : ''}`} aria-label="Primary navigation">
        <Link href="/" className="scout-brand" aria-label="WebReceipt home">
          <BrandMark />
          <span>WebReceipt</span>
        </Link>

        <Link href="/console" className="scout-track-button">
          <Plus size={17} strokeWidth={2.4} aria-hidden />
          New observation
        </Link>

        <nav className="scout-nav" aria-label="Product">
          {primary.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} className={`scout-nav-link ${active(href) ? 'is-active' : ''}`}>
              <Icon size={17} strokeWidth={1.9} aria-hidden />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="scout-sidebar-label">Workspace</div>
        <nav className="scout-nav" aria-label="Workspace">
          {workspace.map(({ label, href, icon: Icon }) => (
            <Link key={label} href={href} className="scout-nav-link">
              <Icon size={17} strokeWidth={1.9} aria-hidden />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="scout-sidebar-footer">
          <span className="scout-sidebar-footer-dot" aria-hidden />
          <span>System healthy</span>
        </div>
      </aside>
    </>
  )
}

function BrandMark() {
  return (
    <span className="scout-brand-mark" aria-hidden>
      <i />
      <i />
      <i />
      <i />
    </span>
  )
}

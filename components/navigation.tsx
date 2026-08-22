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
  PanelLeftClose,
  PanelLeftOpen,
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

const SIDEBAR_KEY = 'webreceipt:sidebar-collapsed'

export function Navigation() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    const saved = window.localStorage.getItem(SIDEBAR_KEY)
    if (saved === 'true') setCollapsed(true)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.scoutSidebar = collapsed ? 'collapsed' : 'expanded'
    window.localStorage.setItem(SIDEBAR_KEY, String(collapsed))
    return () => {
      delete document.documentElement.dataset.scoutSidebar
    }
  }, [collapsed])

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

      <aside className={`scout-sidebar ${open ? 'is-open' : ''} ${collapsed ? 'is-collapsed' : ''}`} aria-label="Primary navigation">
        <div className="scout-sidebar-head">
          <Link href="/" className="scout-brand" aria-label="WebReceipt home" title={collapsed ? 'WebReceipt' : undefined}>
            <BrandMark />
            <span className="scout-sidebar-copy">WebReceipt</span>
          </Link>
          <button
            type="button"
            className="scout-sidebar-toggle"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <PanelLeftOpen size={17} strokeWidth={1.9} aria-hidden /> : <PanelLeftClose size={17} strokeWidth={1.9} aria-hidden />}
          </button>
        </div>

        <Link href="/console" className="scout-track-button" aria-label="New observation" title={collapsed ? 'New observation' : undefined}>
          <Plus size={17} strokeWidth={2.4} aria-hidden />
          <span className="scout-sidebar-copy">New observation</span>
        </Link>

        <nav className="scout-nav" aria-label="Product">
          {primary.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={collapsed ? label : undefined}
              className={`scout-nav-link ${active(href) ? 'is-active' : ''}`}
            >
              <Icon size={17} strokeWidth={1.9} aria-hidden />
              <span className="scout-sidebar-copy">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="scout-sidebar-label"><span className="scout-sidebar-copy">Workspace</span></div>
        <nav className="scout-nav" aria-label="Workspace">
          {workspace.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              aria-label={label}
              title={collapsed ? label : undefined}
              className="scout-nav-link"
            >
              <Icon size={17} strokeWidth={1.9} aria-hidden />
              <span className="scout-sidebar-copy">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="scout-sidebar-footer" title={collapsed ? 'System healthy' : undefined}>
          <span className="scout-sidebar-footer-dot" aria-hidden />
          <span className="scout-sidebar-copy">System healthy</span>
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

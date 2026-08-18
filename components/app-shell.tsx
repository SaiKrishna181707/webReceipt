'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Boxes, PlusCircle, WandSparkles, BookOpen, Menu, Search, Bell, CircleDot, Network } from 'lucide-react'
import { useState } from 'react'

const nav = [
  ['Dashboard', '/', LayoutDashboard],
  ['Scrapers', '/scrapers', Boxes],
  ['Create Scraper', '/scrapers/new', PlusCircle],
  ['Self-Healing Demo', '/demo', WandSparkles],
  ['API Docs', '/docs', BookOpen],
] as const

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-ink text-zinc-100">
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <div className="web-mark" aria-hidden="true">
            <Network size={20} />
          </div>
          <div>
            <div className="brand-name">ScrapeHeal</div>
            <div className="brand-sub">SCRAPER CONTROL PLANE</div>
          </div>
        </div>

        <div className="side-label">WORKSPACE</div>
        <nav aria-label="Primary navigation">
          {nav.map(([label, href, Icon]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`nav-item ${path === href || (href !== '/' && path.startsWith(href)) ? 'active' : ''}`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="side-bottom">
          <div className="system-card">
            <span className="pulse" />
            All systems nominal
            <div className="mono">LOCAL MOCK / v2.0</div>
          </div>
        </div>
      </aside>

      <div className="shell">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
            <Menu size={20} />
          </button>
          <div className="crumb">
            {path === '/'
              ? 'Mission Control'
              : path.split('/').filter(Boolean).map((x) => x.replaceAll('-', ' ')).join(' / ') || 'Mission Control'}
          </div>
          <div className="top-actions">
            <div className="search">
              <Search size={15} />
              <span>Search scrapers...</span>
              <kbd>⌘ K</kbd>
            </div>
            <span className="env"><CircleDot size={12} /> Local Mock</span>
            <Bell size={18} className="muted-icon" />
            <div className="avatar">SK</div>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>

      {open && <button aria-label="close navigation" className="mobile-overlay" onClick={() => setOpen(false)} />}
    </div>
  )
}

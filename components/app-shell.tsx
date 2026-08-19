'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Boxes, PlusCircle, WandSparkles, BookOpen, Menu, Search, Bell, CircleDot, Activity, Settings2, Shield, Globe, FileText } from 'lucide-react'
import { useState } from 'react'

const nav = [
  ['Overview', '/', LayoutDashboard],
  ['Collectors', '/scrapers', Boxes],
  ['New collector', '/scrapers/new', PlusCircle],
  ['Self-healing', '/demo', WandSparkles],
  ['Contracts', '/contracts', FileText],
  ['Evidence', '/evidence', Shield],
  ['API', '/docs', BookOpen],
] as const

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="tv-shell">
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <div className="web-mark" aria-hidden="true"><span>WR</span></div>
          <div>
            <div className="brand-name">WebReceipt</div>
            <div className="brand-sub">WEB EVIDENCE TERMINAL</div>
          </div>
        </div>
        <div className="market-label">WORKSPACE</div>
        <nav aria-label="Primary navigation">
          {nav.map(([label, href, Icon]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className={`nav-item ${path === href || (href !== '/' && path.startsWith(href)) ? 'active' : ''}`}>
              <Icon size={18} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="market-label">SYSTEM</div>
        <div className="system-card">
          <span className="pulse" /> Operational
          <div className="mono">LOCAL MOCK · PAPER TRADING</div>
        </div>
        <button className="settings-button">
          <Settings2 size={16} /> Settings
        </button>
      </aside>

      <div className="shell">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
            <Menu size={20} />
          </button>
          <div className="symbol-strip">
            <span className="symbol-dot" />
            <strong>WEB</strong>
            <span className="market-muted">/ RECEIPT</span>
            <span className="market-chip">LIVE</span>
          </div>
          <div className="top-actions">
            <div className="search">
              <Search size={16} />
              <span>Search collectors, IDs...</span>
              <kbd>⌘ K</kbd>
            </div>
            <span className="env">
              <CircleDot size={12} /> Local Mock
            </span>
            <Bell size={18} className="muted-icon" />
            <div className="avatar">SK</div>
          </div>
        </header>
        <div className="marketbar">
          <span>Overview</span>
          <span>Runs <b>2,184</b></span>
          <span>Healthy <b className="up">19</b></span>
          <span>Broken <b className="down">2</b></span>
          <span>Rows <b>48.2K</b></span>
          <span className="marketbar-spacer" />
          <span className="mono">{new Date().toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})} UTC</span>
        </div>
        <main className="main-content">{children}</main>
      </div>
      {open && <button aria-label="close navigation" className="mobile-overlay" onClick={() => setOpen(false)} />}
    </div>
  )
}

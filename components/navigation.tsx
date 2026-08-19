'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Terminal,
  Boxes,
  Wand2,
  Shield,
  FileText,
  BookOpen,
  HelpCircle,
  Plus,
  Search,
  Moon,
  Sun,
  X,
  Menu,
  Activity,
  Sparkles
} from 'lucide-react'

const navItems = [
  { icon: Terminal, label: 'Terminal', href: '/' },
  { icon: Wand2, label: 'Self-Healing', href: '/demo' },
  { icon: Shield, label: 'Contracts', href: '/contracts' },
  { icon: FileText, label: 'Evidence Vault', href: '/evidence' },
  { icon: Boxes, label: 'Collectors', href: '/scrapers' },
  { icon: BookOpen, label: 'API Docs', href: '/docs' },
  { icon: HelpCircle, label: 'Help', href: '/help' },
]

export function Navigation() {
  const pathname = usePathname()
  const [isDark, setIsDark] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('webreceipt-theme')
    if (saved) {
      const isD = saved === 'dark'
      setIsDark(isD)
      if (isD) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('webreceipt-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('webreceipt-theme', 'light')
    }
  }

  return (
    <>
      {/* Sleek Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#050811]/85 backdrop-blur-xl border-b border-white/[0.08] z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-violet-600/25 group-hover:scale-105 transition-transform">
              <span className="font-mono text-sm tracking-wider">WR</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white group-hover:text-violet-300 transition-colors">
                  WebReceipt
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30 rounded-full">
                  CONTROL PLANE
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono hidden sm:block">Self-Healing Web Evidence</span>
            </div>
          </Link>

          {/* Desktop Center Navigation Pills */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-1 backdrop-blur-md">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600/25 to-indigo-600/25 text-white border border-violet-500/40 shadow-sm shadow-violet-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-violet-400' : 'text-gray-500'} />
                  <span>{item.label}</span>
                  {isActive && <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />}
                </Link>
              )
            })}
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Gateway Status Pill */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE GATEWAY</span>
            </div>

            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all"
              aria-label="Search"
            >
              <Search size={16} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-violet-400" />}
            </button>

            {/* New Collector Action Button */}
            <Link
              href="/scrapers/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/20 transition-all hover:scale-[1.02]"
            >
              <Plus size={14} />
              <span>New Collector</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#050811]/95 backdrop-blur-2xl border-b border-white/[0.1] px-4 py-4 space-y-2 animate-fade-in-up">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-violet-600/25 text-white border border-violet-500/40 font-bold'
                        : 'text-gray-400 bg-white/[0.02] hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-violet-400' : 'text-gray-400'} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
            <Link
              href="/scrapers/new"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md"
            >
              <Plus size={14} />
              <span>Create New Collector</span>
            </Link>
          </div>
        )}
      </header>

      {/* Global Quick Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-start justify-center pt-24 px-4">
          <div className="w-full max-w-xl bg-[#090d1a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="flex items-center gap-3 p-4 border-b border-white/10">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search contracts, evidence hashes, collectors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm font-medium"
                autoFocus
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
              <p className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">Quick Navigation</p>
              <div className="space-y-1">
                {[
                  { name: 'Hotel Checkout Observation (Demo)', href: '/' },
                  { name: 'Self-Healing Sandbox & Refactor Diff', href: '/demo' },
                  { name: 'Deal Contracts History & Integrity', href: '/contracts' },
                  { name: 'Forensic Evidence Vault & Screenshots', href: '/evidence' },
                  { name: 'Registered Web Collectors Registry', href: '/scrapers' },
                ]
                  .filter((x) => x.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span>{item.name}</span>
                      <Sparkles size={12} className="text-violet-400" />
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Boxes, Wand2, Shield, FileText, BookOpen, HelpCircle, Plus, Search, Bell, Moon, Sun, X } from 'lucide-react'

const navItems = [
  { icon: Home, label: 'Terminal', href: '/' },
  { icon: Boxes, label: 'Collectors', href: '/scrapers' },
  { icon: Wand2, label: 'Self-Healing', href: '/demo' },
  { icon: Shield, label: 'Contracts', href: '/contracts' },
  { icon: FileText, label: 'Evidence Chain', href: '/evidence' },
  { icon: BookOpen, label: 'API Docs', href: '/docs' },
  { icon: HelpCircle, label: 'Help Center', href: '/help' },
]

export function Navigation() {
  const pathname = usePathname()
  const [isDark, setIsDark] = useState(true)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  useEffect(() => {
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setIsDark(false)
    }
  }, [])

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-[#0a0e17] border-r border-white/10 flex-col z-40">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white animate-pulse">
              WR
            </div>
            <div>
              <h1 className="font-bold text-white">WebReceipt</h1>
              <p className="text-xs text-gray-400">Evidence Terminal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white border border-purple-500/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-purple-400' : ''} />
                <span className="font-medium">{item.label}</span>
                {isActive && <div className="ml-auto w-2 h-2 bg-purple-500 rounded-full animate-pulse" />}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center font-bold text-white">
              SK
            </div>
            <div className="flex-1">
              <p className="font-medium text-white text-sm">Sai Krishna</p>
              <p className="text-xs text-gray-400">Pro Plan</p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-purple-400" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0e17]/95 backdrop-blur-lg border-t border-white/10 z-50 safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-purple-400'
                    : 'text-gray-400'
                }`}
              >
                <Icon size={24} />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && <div className="w-1 h-1 bg-purple-500 rounded-full" />}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-[#0a0e17]/95 backdrop-blur-lg border-b border-white/10 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">
              WR
            </div>
            <span className="font-bold text-white">WebReceipt</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              aria-label="Search"
            >
              <Search size={20} className="text-gray-400" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-purple-400" />}
            </button>
            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <Bell size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Search Modal */}
      {mobileSearchOpen && (
        <div className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
          <div className="w-full max-w-lg bg-[#0a0e17] rounded-2xl border border-white/10 overflow-hidden animate-fade-in">
            <div className="flex items-center gap-3 p-4 border-b border-white/10">
              <Search size={20} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search contracts, evidence..."
                className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg"
                autoFocus
              />
              <button
                onClick={() => setMobileSearchOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-400 mb-3">Recent searches</p>
              <div className="space-y-2">
                {['Ocean House contract', 'Price monitoring', 'Evidence #123'].map((search, i) => (
                  <button
                    key={i}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-gray-300"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Top Bar */}
      <header className="hidden md:flex fixed top-0 left-64 right-0 h-16 bg-[#0a0e17]/95 backdrop-blur-lg border-b border-white/10 z-40 items-center justify-between px-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search contracts, evidence, analytics..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder-gray-400 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors relative">
            <Bell size={20} className="text-gray-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-purple-400" />}
          </button>
          <Link href="/scrapers/new" className="bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 rounded-xl font-medium text-white hover:opacity-90 transition-opacity flex items-center gap-2">
            <Plus size={18} />
            New Collector
          </Link>
        </div>
      </header>
    </>
  )
}
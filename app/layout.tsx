import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import { Navigation } from '@/components/navigation'

export const metadata: Metadata = {
  title: 'WebReceipt — Proof of Promise, sealed in neon',
  description:
    'A self-healing evidence engine for the mutable web. Turn public purchase journeys into timestamped, tamper-evident Deal Contracts, catch semantic extraction drift, and diff commercial promises over time.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      {/* The whole site stands on one boulevard at dusk. */}
      <body className="vice-body relative min-h-screen text-[#f6f3ff] selection:bg-neon-500/40 selection:text-white">
        <Navigation />
        {/* No width cap here — pages own their own shell so the hero can go
            full-bleed while the consoles stay in a readable column. */}
        <main className="min-h-screen pt-16">{children}</main>
        {/* The tube it's all being watched on. Purely decorative, never clickable. */}
        <div className="crt-overlay" aria-hidden />
        <div className="crt-vignette" aria-hidden />
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  )
}

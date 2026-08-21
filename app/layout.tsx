import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import { Navigation } from '@/components/navigation'
import { MatrixBackground } from '@/components/matrix/matrix-background'
import { BootIntro } from '@/components/matrix/boot-intro'
import { SystemFooter } from '@/components/matrix/system-footer'

export const metadata: Metadata = {
  title: 'WebReceipt — Proof of promise, sealed in code',
  description:
    'A self-healing evidence engine for the mutable web. Turn public purchase journeys into timestamped, tamper-evident Deal Contracts, catch semantic extraction drift, and diff commercial promises over time.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      {/* The whole product runs inside one construct: black, and full of code. */}
      <body className="construct-body relative min-h-screen bg-black text-void-100 selection:bg-matrix-500/35 selection:text-white">
        <a href="#main" className="skip-link">
          Skip to content
        </a>

        {/* The environment. Fixed, pointer-transparent, behind everything. */}
        <MatrixBackground />

        <Navigation />

        {/* No width cap here — pages own their own shell so the hero can go
            full-bleed while the consoles stay in a readable column. */}
        <main id="main" className="relative min-h-screen pt-16">
          {children}
        </main>

        <SystemFooter />

        {/* The screen this is all being watched on. Never clickable. */}
        <div className="crt-overlay" aria-hidden />
        <div className="crt-vignette" aria-hidden />

        <BootIntro />

        <Toaster
          theme="dark"
          position="bottom-right"
          richColors
          toastOptions={{ className: 'font-mono !rounded-[2px] !text-[12.5px]' }}
        />
      </body>
    </html>
  )
}

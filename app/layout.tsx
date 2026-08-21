import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import { Navigation } from '@/components/navigation'
import { MatrixBackground } from '@/components/matrix/matrix-background'
import { Spiders } from '@/components/matrix/spiders'
import { CursorSmoke } from '@/components/matrix/cursor-smoke'
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
      <body className="construct-body relative min-h-screen bg-black text-void-100 selection:bg-matrix-500/35 selection:text-white">
        <a href="#main" className="skip-link">
          Skip to content
        </a>

        <MatrixBackground />
        <Spiders />
        <CursorSmoke />
        <Navigation />

        <main id="main" className="relative z-10 min-h-screen pt-16">
          {children}
        </main>

        <div className="relative z-10">
          <SystemFooter />
        </div>

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

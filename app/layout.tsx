import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { Navigation } from '@/components/navigation'
import ClickSpark from '@/components/effects/click-spark'
import { MatrixBackground } from '@/components/matrix/matrix-background'
import { BootIntro } from '@/components/matrix/boot-intro'

/* Both faces are self-hosted and preloaded at build time. */
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-display' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'WebReceipt — Proof of promise, sealed in code',
  description:
    'A self-healing evidence engine for the mutable web. Turn public purchase journeys into timestamped, tamper-evident Deal Contracts, catch semantic extraction drift, and diff commercial promises over time.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="construct-body relative min-h-screen bg-black text-void-100 selection:bg-matrix-500/35 selection:text-white">
        <a href="#main" className="skip-link">Skip to content</a>
        <MatrixBackground />
        <Navigation />
        <main id="main" tabIndex={-1} className="relative z-10 min-h-screen pt-[4.5rem] outline-none">
          <ClickSpark className="min-h-full">{children}</ClickSpark>
        </main>
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

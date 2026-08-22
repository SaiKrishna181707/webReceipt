import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import './scout.css'
import './scout-polish.css'
import { Toaster } from 'sonner'
import { Navigation } from '@/components/navigation'
import { ScoutRightRail } from '@/components/scout-right-rail'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-display' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'WebReceipt — Proof of promise, sealed in code',
  description:
    'A self-healing evidence engine for the mutable web. Turn public purchase journeys into timestamped, tamper-evident Deal Contracts, catch semantic extraction drift, and diff commercial promises over time.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="scout-theme min-h-screen">
        <a href="#main" className="skip-link">Skip to content</a>
        <Navigation />
        <main id="main" tabIndex={-1} className="scout-main">
          {children}
        </main>
        <ScoutRightRail />
        <Toaster
          theme="light"
          position="bottom-right"
          richColors
          toastOptions={{ className: '!rounded-xl !text-[13px] !shadow-lg' }}
        />
      </body>
    </html>
  )
}

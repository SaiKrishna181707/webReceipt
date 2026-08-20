import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import { Navigation } from '@/components/navigation'

export const metadata: Metadata = {
  title: 'WebReceipt — Proof of Promise, brick by brick',
  description:
    'A self-healing evidence engine for the mutable web. Turn public purchase journeys into timestamped, tamper-evident Deal Contracts, catch semantic extraction drift, and diff commercial promises over time.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      {/* The whole site is built on one studded baseplate. */}
      <body className="baseplate relative min-h-screen text-[#f6f7f3] selection:bg-stud-400/35 selection:text-white">
        <Navigation />
        {/* No width cap here — pages own their own shell so the hero can go
            full-bleed while the consoles stay in a readable column. */}
        <main className="min-h-screen pt-16">{children}</main>
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  )
}

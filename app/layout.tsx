import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import { Navigation } from '@/components/navigation'

export const metadata: Metadata = {
  title: 'WebReceipt — Web Evidence Terminal',
  description: 'Transform web journeys into timestamped, evidence-backed Deal Contracts with semantic integrity validation.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#050811] text-[#f0f6fc] min-h-screen relative selection:bg-purple-500/30 selection:text-purple-200">
        {/* Ambient Top Glow Backdrop */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[420px] bg-gradient-to-b from-violet-600/12 via-cyan-500/6 to-transparent blur-3xl pointer-events-none -z-10" />
        <Navigation />
        <main className="pt-20 pb-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up">
          {children}
        </main>
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  )
}

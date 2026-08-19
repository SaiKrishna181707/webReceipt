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
      <body>
        <Navigation />
        <main className="md:ml-64 pt-16 md:pt-16 pb-20 md:pb-0 min-h-screen">
          {children}
        </main>
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  )
}

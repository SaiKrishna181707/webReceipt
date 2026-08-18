import type { Metadata } from 'next'
import './globals.css'
import { AppShell } from '@/components/app-shell'
import { Toaster } from 'sonner'

export const metadata: Metadata = { title: 'ScrapeHeal', description: 'Self-healing web scraper control plane' }
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><AppShell>{children}</AppShell><Toaster theme="dark" position="bottom-right" /></body></html> }

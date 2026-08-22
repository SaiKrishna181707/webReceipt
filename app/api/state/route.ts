import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Anonymous users keep their visible receipt ledger in this browser via lib/api.
// Never expose the process-global engine store: a warm public server can serve
// multiple people, and Vercel's temp filesystem is not durable user storage.
export async function GET() {
  return NextResponse.json({ contracts: [], events: [], stressRuns: [] })
}

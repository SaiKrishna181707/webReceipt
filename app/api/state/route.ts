import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Browser-visible receipt history is intentionally stored per browser by
// lib/api.ts. Never expose the process-global server engine ledger to anonymous
// visitors, because a warm public deployment can serve multiple users.
export async function GET() {
  return NextResponse.json({ contracts: [], events: [], stressRuns: [] })
}

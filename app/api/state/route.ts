import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Anonymous receipt/history state is stored per browser by lib/api.ts. A warm
// serverless instance can serve multiple visitors, so never expose its internal
// process-global orchestration ledger as a public cross-user history endpoint.
export async function GET() {
  return NextResponse.json({ contracts: [], events: [], stressRuns: [] })
}

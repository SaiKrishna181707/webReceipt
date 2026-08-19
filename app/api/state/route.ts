import { getStore } from '@/lib/server/service'
import { runSafely } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Full persisted state: receipt history, orchestrator events, chaos runs.
export async function GET() {
  return runSafely(async () => (await getStore()).state)
}

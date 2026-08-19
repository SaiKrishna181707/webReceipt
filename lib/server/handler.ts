import { NextResponse } from 'next/server'

// Mirrors the error classification in src/server.js so the Next API surface
// returns the same stable {error, code} shapes and HTTP statuses.
function classify(error: unknown): { status: number; code: string; message: string } {
  const message = String((error as { message?: string })?.message || 'Unexpected error')
  if (/valid URL|Only http|Credential-bearing|publicly reachable|login\/private|public anonymous|Target hostname|Target must/i.test(message))
    return { status: 400, code: 'invalid_target', message }
  if (/Need at least two stored observations/i.test(message)) return { status: 409, code: 'insufficient_history', message }
  if (/simulator-only|available only in simulator|Simulator mode only produces data/i.test(message))
    return { status: 400, code: 'unsupported_mode', message }
  if (/Unknown simulator mutation|Chaos Checkout mutations/i.test(message)) return { status: 400, code: 'invalid_mutation', message }
  return { status: 500, code: 'internal_error', message }
}

/** Wrap a route handler body, returning JSON on success or a classified error. */
export async function runSafely<T>(fn: () => Promise<T>) {
  try {
    return NextResponse.json(await fn())
  } catch (error) {
    const mapped = classify(error)
    return NextResponse.json({ error: mapped.message, code: mapped.code }, { status: mapped.status })
  }
}

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const text = await req.text()
    return text ? JSON.parse(text) : {}
  } catch {
    return {}
  }
}

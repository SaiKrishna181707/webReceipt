import { NextResponse } from 'next/server'
import { readWebJson } from '@/src/web-request.js'

// Mirrors the error classification in src/server.js so the Next API surface
// returns the same stable {error, code} shapes and HTTP statuses.
function classify(error: unknown): { status: number; code: string; message: string } {
  const candidate = error as { status?: unknown; code?: unknown; message?: unknown }
  const message = String(candidate?.message || 'Unexpected error')
  const status = Number(candidate?.status)
  const code = String(candidate?.code || '')

  // Do not rely on instanceof here. Next's production bundler can duplicate
  // module/class identities across route chunks, so structural status/code is
  // the stable contract between the request reader and route handler.
  if ([400, 413].includes(status) && ['invalid_json', 'body_too_large'].includes(code))
    return { status, code, message }
  if (status === 429 && code === 'rate_limited') return { status, code, message }
  if (/Request body must be valid(?: UTF-8)? JSON|Request body must be a JSON object/i.test(message))
    return { status: 400, code: 'invalid_json', message }
  if (/Request body exceeds \d+ bytes/i.test(message))
    return { status: 413, code: 'body_too_large', message }
  if (/valid URL|Only http|Credential-bearing|publicly reachable|private\/reserved|login\/private|public anonymous|Target hostname|Target must|requires targetUrl/i.test(message))
    return { status: 400, code: 'invalid_target', message }
  if (/No commerce price with an identifiable currency/i.test(message))
    return { status: 422, code: 'unsupported_page', message }
  if (/Public page response exceeds \d+ bytes/i.test(message))
    return { status: 413, code: 'upstream_too_large', message }
  if (/Public page returned unsupported content type/i.test(message))
    return { status: 415, code: 'unsupported_content', message }
  if (/Public page fetch timed out/i.test(message))
    return { status: 504, code: 'public_fetch_timeout', message }
  if (/Public page (?:fetch failed|returned HTTP|redirect|exceeded)/i.test(message))
    return { status: 502, code: 'public_fetch_failed', message }
  if (/Unknown public-web mutation/i.test(message))
    return { status: 400, code: 'invalid_mutation', message }
  if (/Promise Diff contracts must belong to the same target URL|Promise Diff rejected a contract with an invalid seal/i.test(message))
    return { status: 400, code: 'invalid_diff', message }
  if (/Operator authorization required/i.test(message)) return { status: 401, code: 'operator_required', message }
  if (/Another Bright Data operation is already running/i.test(message)) return { status: 409, code: 'live_operation_busy', message }
  if (/Need at least two stored observations/i.test(message)) return { status: 409, code: 'insufficient_history', message }
  if (/simulator-only|available only in simulator|Simulator mode only produces data/i.test(message))
    return { status: 400, code: 'unsupported_mode', message }
  if (/Unknown simulator mutation|Chaos Checkout mutations/i.test(message)) return { status: 400, code: 'invalid_mutation', message }
  if (/Bright Data is configured but live operations are locked/i.test(message)) return { status: 503, code: 'live_locked', message }
  if (/Bright Data live mode is not configured|Bright Data mode requires/i.test(message))
    return { status: 503, code: 'brightdata_not_configured', message }
  if (/Bright Data .*timed out/i.test(message)) return { status: 504, code: 'brightdata_timeout', message }
  if (/^Bright Data /i.test(message)) return { status: 502, code: 'brightdata_upstream', message }
  return {
    status: 500,
    code: 'internal_error',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : message,
  }
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
  return readWebJson(req) as Promise<Record<string, unknown>>
}

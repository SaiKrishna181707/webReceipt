import { NextResponse } from 'next/server'
import { readWebJson } from '@/src/web-request.js'

// Mirrors the error classification in src/server.js so the Next API surface
// returns stable {error, code} shapes and HTTP statuses.
function classify(error: unknown): { status: number; code: string; message: string } {
  const candidate = error as { status?: unknown; code?: unknown; message?: unknown }
  const message = String(candidate?.message || 'Unexpected error')
  const status = Number(candidate?.status)
  const code = String(candidate?.code || '')

  // Structural codes from bounded public scraping. These are deliberately
  // allowlisted so arbitrary thrown status/code pairs cannot control responses.
  const publicCodes: Record<string, number> = {
    invalid_target: 400,
    invalid_mutation: 400,
    scraper_response_too_large: 413,
    scraper_no_price: 422,
    scraper_unsupported_content: 422,
    rate_limited: 429,
    scraper_upstream: 502,
    scraper_timeout: 504,
  }
  if (publicCodes[code] === status) return { status, code, message }

  // Do not rely on instanceof here. Next's production bundler can duplicate
  // module/class identities across route chunks, so structural status/code is
  // the stable contract between the request reader and route handler.
  if ([400, 413].includes(status) && ['invalid_json', 'body_too_large'].includes(code))
    return { status, code, message }
  if (/Request body must be valid(?: UTF-8)? JSON|Request body must be a JSON object/i.test(message))
    return { status: 400, code: 'invalid_json', message }
  if (/Request body exceeds \d+ bytes/i.test(message))
    return { status: 413, code: 'body_too_large', message }
  if (/valid URL|Only http|standard public web ports|Credential-bearing|publicly reachable|private or reserved|login\/private|public anonymous|Target hostname|Target must|requires targetUrl|requires a URL input/i.test(message))
    return { status: 400, code: 'invalid_target', message }
  if (/No commerce price with an identifiable currency/i.test(message))
    return { status: 422, code: 'scraper_no_price', message }
  if (/Operator authorization required/i.test(message)) return { status: 401, code: 'operator_required', message }
  if (/Another Bright Data operation is already running/i.test(message)) return { status: 409, code: 'live_operation_busy', message }
  if (/Need at least two stored observations/i.test(message)) return { status: 409, code: 'insufficient_history', message }
  if (/simulator-only|available only in simulator|Simulator mode only produces data/i.test(message))
    return { status: 400, code: 'unsupported_mode', message }
  if (/Unknown (?:simulator|public-web) mutation|Chaos Checkout mutations/i.test(message)) return { status: 400, code: 'invalid_mutation', message }
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

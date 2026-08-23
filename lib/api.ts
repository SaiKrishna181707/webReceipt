import type { ObservationResult, ObserveResult, DiffResult, StressRun, StoreState, WebReceiptEvent } from './types'

const CLIENT_STATE_KEY = 'webreceipt:state:v2'
const MAX_CLIENT_CONTRACTS = 16
const MAX_CLIENT_EVENTS = 120

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || `Request to ${path} failed (${res.status})`)
  return data as T
}
function emptyState(): StoreState { return { contracts: [], events: [], stressRuns: [] } }
function readClientState(): StoreState {
  if (typeof window === 'undefined') return emptyState()
  try {
    const raw = window.localStorage.getItem(CLIENT_STATE_KEY); if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<StoreState>
    return { contracts: Array.isArray(parsed.contracts) ? parsed.contracts.slice(0, MAX_CLIENT_CONTRACTS) : [], events: Array.isArray(parsed.events) ? parsed.events.slice(0, MAX_CLIENT_EVENTS) : [], stressRuns: Array.isArray(parsed.stressRuns) ? parsed.stressRuns.slice(0, 20) : [] }
  } catch { return emptyState() }
}
function writeClientState(state: StoreState): StoreState {
  const normalized: StoreState = { contracts: state.contracts.slice(0, MAX_CLIENT_CONTRACTS), events: state.events.slice(0, MAX_CLIENT_EVENTS), stressRuns: state.stressRuns.slice(0, 20) }
  if (typeof window === 'undefined') return normalized
  try { window.localStorage.setItem(CLIENT_STATE_KEY, JSON.stringify(normalized)) }
  catch {
    try {
      const compact: StoreState = { contracts: normalized.contracts.slice(0, 6), events: normalized.events.slice(0, 40), stressRuns: normalized.stressRuns.slice(0, 6) }
      window.localStorage.setItem(CLIENT_STATE_KEY, JSON.stringify(compact)); return compact
    } catch {}
  }
  return normalized
}
function eventId(): string { try { return globalThis.crypto?.randomUUID?.() ?? `evt_${Date.now()}_${Math.random().toString(36).slice(2)}` } catch { return `evt_${Date.now()}_${Math.random().toString(36).slice(2)}` } }
function addClientEvent(state: StoreState, type: string, message: string, meta: Record<string, unknown> = {}) {
  const event: WebReceiptEvent = { id: eventId(), type, message, meta, at: new Date().toISOString() }; state.events.unshift(event); state.events = state.events.slice(0, MAX_CLIENT_EVENTS)
}
function rememberObservation(result: ObservationResult, action: 'observe' | 'heal' = 'observe') {
  const state = readClientState()
  if (result.contract) {
    if (!state.contracts.some((entry) => entry.contract.contractHash === result.contract.contractHash)) state.contracts.unshift({ contract: result.contract, integrity: result.integrity, anomalies: result.anomalies })
    const status = result.integrity.status
    addClientEvent(state, action === 'heal' ? 'heal' : status === 'invalid' ? 'integrity' : 'success', action === 'heal' ? (result.healed ? 'Verified repair completed' : 'Repair run completed') : status === 'invalid' ? 'Observation detected a contract integrity failure' : 'Public observation sealed', { targetUrl: result.contract.targetUrl, status, contractHash: result.contract.contractHash })
  } else {
    addClientEvent(state, 'observe', 'Public product offer observed; checkout was not fabricated', {
      targetUrl: result.observation.targetUrl,
      status: result.integrity.status,
      productPrice: result.commercial.productPrice,
      currency: result.commercial.currency,
      collectorId: result.observation.collectorId,
      sealable: false,
    })
  }
  writeClientState(state)
}
function clientUrl(value?: string): URL | null {
  const raw = String(value || '').trim()
  if (!raw) return null
  try {
    if (raw.startsWith('//')) return new URL(`https:${raw}`)
    if (!/^[A-Za-z][A-Za-z0-9+.-]*:/.test(raw)) return new URL(`https://${raw}`)
    return new URL(raw)
  } catch { return null }
}
function isDemoTarget(value?: string): boolean {
  const parsed = clientUrl(value)
  if (!parsed) return false
  const host = parsed.hostname.toLowerCase()
  return host === 'demo.webreceipt.dev'
    || (parsed.pathname === '/fixture/product' && [
      'web-receipt-tawny.vercel.app',
      'web-receipt-golden-state-warriors.vercel.app',
      'web-receipt-git-main-golden-state-warriors.vercel.app',
    ].includes(host))
}
function sameTarget(left: string, right: string): boolean {
  const a = clientUrl(left); const b = clientUrl(right)
  if (!a || !b) return left === right
  a.hash = ''; b.hash = ''
  return a.toString() === b.toString()
}
async function liveClientDiff(targetUrl: string): Promise<DiffResult> {
  let state = readClientState(); let matches = state.contracts.filter((entry) => sameTarget(entry.contract.targetUrl, targetUrl))
  if (matches.length < 2) {
    const fresh = await post<ObservationResult>('/api/observe', { targetUrl, mutation: 'healthy', autoHeal: false }); rememberObservation(fresh)
    if (!fresh.contract) throw new Error('This URL currently provides a product-offer observation only. Promise Diff requires two sealed Deal Contracts with checkout evidence.')
    state = readClientState(); matches = state.contracts.filter((entry) => sameTarget(entry.contract.targetUrl, fresh.contract.targetUrl))
  }
  if (matches.length < 2) return post<DiffResult>('/api/diff', { simulate: true, targetUrl })
  const after = matches[0].contract; const before = matches[1].contract
  const diff = await post<DiffResult>('/api/diff', { simulate: false, targetUrl: after.targetUrl, before, after })
  state = readClientState(); addClientEvent(state, 'diff', `${diff.changes.length} promise changes detected`, { targetUrl: after.targetUrl, source: diff.source }); writeClientState(state); return diff
}

export const api = {
  observe: async (body: { targetUrl?: string; mutation?: string; autoHeal?: boolean }) => { const result = await post<ObservationResult>('/api/observe', body); rememberObservation(result); return result },
  heal: async (body: { targetUrl?: string; mutation?: string }) => { const result = await post<ObserveResult>('/api/heal', body); rememberObservation(result, 'heal'); return result },
  diff: async (body?: { simulate?: boolean; targetUrl?: string }) => {
    const state = readClientState(); const latestTarget = body?.targetUrl || state.contracts[0]?.contract.targetUrl
    if (latestTarget && !isDemoTarget(latestTarget)) return liveClientDiff(latestTarget)
    const result = await post<DiffResult>('/api/diff', body); const next = readClientState(); addClientEvent(next, 'diff', `${result.changes.length} promise changes detected`, { source: result.source }); writeClientState(next); return result
  },
  stress: async (body?: { mutations?: string[] }) => { const run = await post<StressRun>('/api/stress', body); const state = readClientState(); state.stressRuns.unshift(run); addClientEvent(state, 'stress', `Chaos suite: ${run.recovered}/${run.total} resilient`, { runId: run.id }); writeClientState(state); return run },
  reset: async () => { const cleared = writeClientState(emptyState()); await post<StoreState>('/api/reset').catch(() => cleared); return cleared },
  state: async () => readClientState(),
}

const SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }
export function money(amount: number, currency = 'INR'): string { const symbol = SYMBOLS[currency] ?? `${currency} `; return `${symbol}${Math.round(amount).toLocaleString('en-IN')}` }
export function signedMoney(delta: number, currency = 'INR'): string { const sign = delta > 0 ? '+' : delta < 0 ? '−' : ''; return `${sign}${money(Math.abs(delta), currency)}` }
export function percent(ratio: number): string { return `${ratio > 0 ? '+' : ''}${(ratio * 100).toFixed(1)}%` }
export function shortHash(hash: string, head = 10, tail = 6): string { if (!hash || hash.length <= head + tail + 1) return hash; return `${hash.slice(0, head)}…${hash.slice(-tail)}` }
export function formatTime(iso: string): string { try { return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) } catch { return iso } }

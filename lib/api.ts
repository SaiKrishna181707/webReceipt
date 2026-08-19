import type { ObserveResult, DiffResult, StressRun, StoreState } from './types'

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || `Request to ${path} failed (${res.status})`)
  return data as T
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: 'no-store' })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || `Request to ${path} failed (${res.status})`)
  return data as T
}

export const api = {
  observe: (body: { targetUrl?: string; mutation?: string; autoHeal?: boolean }) =>
    post<ObserveResult>('/api/observe', body),
  heal: (body: { targetUrl?: string; mutation?: string }) => post<ObserveResult>('/api/heal', body),
  diff: (body?: { simulate?: boolean; targetUrl?: string }) => post<DiffResult>('/api/diff', body),
  stress: (body?: { mutations?: string[] }) => post<StressRun>('/api/stress', body),
  reset: () => post<StoreState>('/api/reset'),
  state: () => get<StoreState>('/api/state'),
}

const SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }

/** Format a money amount with its currency symbol, e.g. ₹10,147. */
export function money(amount: number, currency = 'INR'): string {
  const symbol = SYMBOLS[currency] ?? `${currency} `
  return `${symbol}${Math.round(amount).toLocaleString('en-IN')}`
}

/** Signed delta, e.g. +₹1,648 or −₹200. */
export function signedMoney(delta: number, currency = 'INR'): string {
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : ''
  return `${sign}${money(Math.abs(delta), currency)}`
}

export function percent(ratio: number): string {
  return `${ratio > 0 ? '+' : ''}${(ratio * 100).toFixed(1)}%`
}

export function shortHash(hash: string, head = 10, tail = 6): string {
  if (!hash || hash.length <= head + tail + 1) return hash
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`
}

export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return iso
  }
}

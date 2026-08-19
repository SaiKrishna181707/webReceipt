// Shared types mirroring the canonical Deal Contract produced by the
// engine in `src/domain`. These are the wire shapes returned by the
// Next.js API routes under `app/api/*`.

export interface Money {
  amount: number
  currency: string
}

export interface FeeItem {
  label: string
  amount: number
  currency: string
  required: boolean
}

export interface Evidence {
  id: string
  field: string
  sourceUrl: string
  capturedText: string
  screenshotRef: string | null
  domPath: string | null
  journeyStep: number | null
  collectorVersion: string
  observedAt: string
  hash: string
}

export interface JourneyStep {
  index: number
  label: string
  url: string
  displayedPrice: Money
  evidenceId: string | null
}

export interface DealContract {
  schemaVersion: string
  dealId: string
  subject: string
  targetUrl: string
  observedAt: string
  locale: string
  collector: { id: string; version: string; worker: string }
  offer: { advertisedPrice: Money; claims: string[] }
  checkout: {
    basePrice: Money
    feeItems: FeeItem[]
    mandatoryFees: Money
    taxes: Money
    optionalAddons: Money
    discounts: Money
    finalTotal: Money
  }
  terms: {
    cancellation: string
    refundability: string
    paymentTiming: string
    inclusions: string[]
  }
  journey: JourneyStep[]
  evidence: Evidence[]
  contractHash: string
}

export type IntegritySeverity = 'critical' | 'high'

export interface IntegrityCheck {
  id: string
  label: string
  pass: boolean
  details: Record<string, unknown>
  severity: IntegritySeverity
}

export interface Integrity {
  status: 'valid' | 'warning' | 'invalid'
  checks: IntegrityCheck[]
  failures: IntegrityCheck[]
  passed: number
  total: number
}

export type AnomalySeverity = 'high' | 'medium' | 'info'

export interface Anomaly {
  id: string
  label: string
  severity: AnomalySeverity
  value: string
  details: string
}

export interface RepairResult {
  requested: boolean
  proposalStatus: string
  approval: string
  previewIntegrity: Integrity | null
  previewContractHash: string | null
  approved: boolean
  rejected: boolean
  postApprovalVerified: boolean
  proposal?: unknown
  postContract?: DealContract
  postIntegrity?: Integrity
}

export interface ObserveResult {
  contract: DealContract
  integrity: Integrity
  anomalies: Anomaly[]
  healed: boolean
  repair: RepairResult | null
}

export type DiffChange =
  | { path: string; kind: 'money'; before: number; after: number; currency: string; delta: number }
  | { path: string; kind: 'text'; before: string; after: string }
  | { path: string; kind: 'list'; before: string[]; after: string[] }
  | { path: string; kind: 'fee_added'; before: null; after: number; currency: string }
  | { path: string; kind: 'fee_removed'; before: number; after: null; currency: string }

export interface DiffResult {
  before: DealContract
  after: DealContract
  changes: DiffChange[]
  integrity: Integrity
  source: string
}

export interface StressResult {
  mutation: string
  initiallyValid: boolean
  detectedFailure: boolean
  previewVerified: boolean
  rejected: boolean
  healed: boolean
  finalStatus: string
  failedChecks: string[]
}

export interface StressRun {
  id: string
  at: string
  durationMs: number
  total: number
  initiallyHealthy: number
  detected: number
  previewVerified: number
  recovered: number
  results: StressResult[]
}

export interface WebReceiptEvent {
  id: string
  type: string
  message: string
  meta: Record<string, unknown>
  at: string
}

export interface StoreState {
  contracts: { contract: DealContract; integrity: Integrity; anomalies: Anomaly[] }[]
  events: WebReceiptEvent[]
  stressRuns: StressRun[]
}

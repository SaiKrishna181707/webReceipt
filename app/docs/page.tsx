import { ArrowRight, BookOpen } from 'lucide-react'
import {
  SystemLink,
  MatrixPanel,
  SystemRail,
  Kicker,
  SystemStatus,
  type MatrixTone,
} from '@/components/matrix/matrix-ui'

const CHECKS: [string, string][] = [
  ['total_arithmetic', 'base + mandatoryFees + taxes + optionalAddons − discounts equals finalTotal'],
  ['fee_breakdown', 'Sum of required fee items equals the mandatory-fee total'],
  ['discount_bounds', 'Discounts never exceed gross charges'],
  ['currency_consistency', 'Every money field shares one currency'],
  ['journey_monotonicity', 'Final price is plausible after discounts'],
  ['critical_evidence', 'Advertised price, base price, final total and cancellation all carry provenance'],
  ['evidence_hashes', 'Each evidence record hashes to its stored SHA-256'],
  ['contract_hash', 'The whole Deal Contract hashes to its stored seal'],
  ['evidence_links', 'Every journey step resolves to a real evidence record'],
  ['source_urls', 'Evidence sources are HTTP(S) URLs'],
  ['journey_complete', 'Journey has comparable start and end observations'],
]

const ENDPOINTS: { method: string; path: string; body: string; returns: string; desc: string }[] = [
  {
    method: 'POST',
    path: '/api/observe',
    body: '{ targetUrl?, mutation?="healthy", autoHeal?=false }',
    returns: 'ObserveResult',
    desc: 'Traverse the journey, compile the Deal Contract, run integrity and detect anomalies.',
  },
  {
    method: 'POST',
    path: '/api/heal',
    body: '{ targetUrl?, mutation?="wrong-valid-total" }',
    returns: 'ObserveResult',
    desc: 'Observe with auto-heal on: propose a repair, verify the preview, then deploy if valid.',
  },
  {
    method: 'POST',
    path: '/api/diff',
    body: '{ simulate?=true, targetUrl? }',
    returns: 'DiffResult',
    desc: 'Diff two contracts — a simulated day +3, or the two most recent stored observations.',
  },
  {
    method: 'POST',
    path: '/api/stress',
    body: '{ mutations?: string[] }',
    returns: 'StressRun',
    desc: 'Run the Chaos Checkout suite: inject mutations and measure detection and recovery.',
  },
  { method: 'GET', path: '/api/state', body: '—', returns: 'StoreState', desc: 'Stored contracts, events and stress runs.' },
  { method: 'POST', path: '/api/reset', body: '—', returns: 'StoreState', desc: 'Clear stored state and reset the simulator.' },
]

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-14 px-4 py-10 sm:px-6 lg:px-8">
      {/* ==================================================================
          HEADER
          Docs get the lightest touch in the system: readability first, theme
          second. Green is confined to labels, rules and code.
          ================================================================== */}
      <header>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Kicker tone="phosphor">Docs</Kicker>
          <SystemRail count={8} tone="phosphor" className="opacity-70" />
          <SystemStatus label="Schema" value="v1.1.0" tone="phosphor" live={false} />
        </div>
        <h1 className="mt-3 text-[28px] font-bold leading-tight text-void-100 sm:text-[34px]">How WebReceipt works</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-void-200">
          A self-healing consumer evidence engine. It compiles public purchase journeys into one canonical Deal
          Contract, seals every claim with tamper-evident evidence, and verifies extraction against deterministic
          semantic invariants.
        </p>
      </header>

      <Section title="Core concepts" tone="matrix">
        <Concept
          accent="#33ff66"
          name="Deal Contract"
          body="One canonical economic schema (v1.1.0) compiled from any site: advertised price, checkout breakdown (base, fee items, mandatory fees, taxes, add-ons, discounts, final total), terms, the journey, and the evidence set — sealed with a contract hash."
        />
        <Concept
          accent="#2fe3ba"
          name="Evidence"
          body="Each critical field carries a record: captured text, source URL, DOM path, journey step, collector version, timestamp and a SHA-256 hash. Screenshots are references, not proof — the hash is the proof."
        />
        <Concept
          accent="#3fbf66"
          name="Contract Integrity Engine"
          body="Eleven deterministic checks that catch wrong-but-valid extraction — where every field is populated but the numbers don't reconcile. A critical failure marks the contract invalid."
        />
        <Concept
          accent="#ccbb45"
          name="Deal Anomalies"
          body="Observed, not adjudicated: journey price increases, mandatory non-tax charges and taxes are surfaced as facts with context — never as legal conclusions."
        />
        <Concept
          accent="#7bffa0"
          name="Promise Diff"
          body="git diff for commercial promises. Compares two contracts and reports money, text, list and fee changes — e.g. 'Free cancellation' → 'Non-refundable'."
        />
        <Concept
          accent="#00b83f"
          name="Self-Healing"
          body="When a redesign breaks extraction, an AI repair is proposed. WebReceipt treats the preview as untrusted: it must compile into the same Deal Contract and pass every critical invariant before it is approved and deployed."
        />
      </Section>

      <Section title="Integrity checks" tone="matrix">
        {/* Eleven checks on one circuit — any critical failure invalidates the contract. */}
        <div className="divide-y divide-matrix-400/8 overflow-hidden rounded-[2px] border border-matrix-500/25 bg-black/50 shadow-[inset_0_0_34px_-24px_rgba(51,255,102,.9)]">
          {CHECKS.map(([id, desc]) => (
            <div key={id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-4">
              <code className="shrink-0 font-mono text-[12px] text-matrix-300 sm:w-52">{id}</code>
              <span className="text-[13.5px] leading-relaxed text-void-200">{desc}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="API reference" tone="data">
        <p className="text-[13.5px] leading-relaxed text-void-200">
          All routes run on the Node.js runtime and drive the same engine that powers the Console. Bodies are JSON. In
          this app the collector behind them is the simulator; the Bright Data adapter is exercised by the sponsor
          harness and the CLI runbook.
        </p>
        <div className="space-y-3">
          {ENDPOINTS.map((e) => {
            const get = e.method === 'GET'
            const c = get ? '#2fe3ba' : '#33ff66'
            return (
              <div
                key={e.path}
                className="rounded-[2px] border border-matrix-400/12 bg-black/50 p-4"
                style={{ boxShadow: `inset 0 0 30px -22px ${c}` }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-[1px] border px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.1em]"
                    style={{ borderColor: c, color: c, background: `${c}18` }}
                  >
                    {e.method}
                  </span>
                  <code className="font-mono text-[13.5px] text-void-100">{e.path}</code>
                  <span className="ml-auto font-mono text-[11px] text-void-300">→ {e.returns}</span>
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-void-200">{e.desc}</p>
                {e.body !== '—' && (
                  <pre className="mt-2 overflow-x-auto rounded-[2px] border border-matrix-400/12 bg-black/70 p-3 font-mono text-[12px] text-void-100">
                    {e.body}
                  </pre>
                )}
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="Run it locally" tone="phosphor">
        <pre className="overflow-x-auto rounded-[2px] border border-matrix-500/25 bg-black/70 p-4 font-mono text-[13px] leading-relaxed text-void-100 shadow-[inset_0_0_34px_-24px_rgba(51,255,102,.9)]">
{`npm install
npm run dev        # Next.js console at http://localhost:3000
npm run verify     # engine checks: schema + unit tests + chaos suite`}
        </pre>
      </Section>

      <MatrixPanel tone="matrix" tilt={false} className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h3 className="text-[17px] font-semibold text-void-100">Ready to see it run?</h3>
          <p className="mt-1 text-[13.5px] text-void-200">
            Walk the full observe → break → heal → diff loop on live engine data.
          </p>
        </div>
        <SystemLink href="/console" tone="matrix" size="md" variant="solid" className="shrink-0" scan>
          Launch console <ArrowRight size={15} aria-hidden />
        </SystemLink>
      </MatrixPanel>
    </div>
  )
}

function Section({ title, tone, children }: { title: string; tone: MatrixTone; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="space-y-2 pb-1">
        <h2 className="flex items-center gap-2 text-[20px] font-semibold text-void-100">
          <BookOpen size={15} className="text-matrix-400" aria-hidden />
          {title}
        </h2>
        <SystemRail count={8} tone={tone} className="opacity-70" />
      </div>
      {children}
    </section>
  )
}

/** Each concept keeps its own accent on the left edge, so the page reads as a directory. */
function Concept({ name, body, accent }: { name: string; body: string; accent: string }) {
  return (
    <div
      className="rounded-[2px] border-y border-l-2 border-r border-y-matrix-400/10 border-r-matrix-400/10 bg-black/50 p-4"
      style={{ borderLeftColor: accent, boxShadow: `inset 14px 0 30px -26px ${accent}` }}
    >
      <h3 className="mb-1 font-mono text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: accent }}>
        {name}
      </h3>
      <p className="text-[13.5px] leading-relaxed text-void-200">{body}</p>
    </div>
  )
}

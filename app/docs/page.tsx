import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

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
    <div className="max-w-3xl space-y-14">
      <header className="space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-violet-400">Docs</div>
        <h1 className="text-3xl font-bold text-white">How WebReceipt works</h1>
        <p className="text-gray-400">
          A self-healing consumer evidence engine. It compiles public purchase journeys into one canonical Deal
          Contract, seals every claim with tamper-evident evidence, and verifies extraction against deterministic
          semantic invariants.
        </p>
      </header>

      <Section title="Core concepts">
        <Concept name="Deal Contract" body="One canonical economic schema (v1.1.0) compiled from any site: advertised price, checkout breakdown (base, fee items, mandatory fees, taxes, add-ons, discounts, final total), terms, the journey, and the evidence set — sealed with a contract hash." />
        <Concept name="Evidence" body="Each critical field carries a record: captured text, source URL, DOM path, journey step, collector version, timestamp and a SHA-256 hash. Screenshots are references, not proof — the hash is the proof." />
        <Concept name="Contract Integrity Engine" body="Eleven deterministic checks that catch wrong-but-valid extraction — where every field is populated but the numbers don't reconcile. A critical failure marks the contract invalid." />
        <Concept name="Deal Anomalies" body="Observed, not adjudicated: journey price increases, mandatory non-tax charges and taxes are surfaced as facts with context — never as legal conclusions." />
        <Concept name="Promise Diff" body="git diff for commercial promises. Compares two contracts and reports money, text, list and fee changes — e.g. 'Free cancellation' → 'Non-refundable'." />
        <Concept name="Self-Healing" body="When a redesign breaks extraction, an AI repair is proposed. WebReceipt treats the preview as untrusted: it must compile into the same Deal Contract and pass every critical invariant before it is approved and deployed." />
      </Section>

      <Section title="Integrity checks">
        <div className="rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5">
          {CHECKS.map(([id, desc]) => (
            <div key={id} className="flex flex-col sm:flex-row gap-1 sm:gap-4 px-4 py-3">
              <code className="text-xs font-mono text-emerald-300 sm:w-52 shrink-0">{id}</code>
              <span className="text-sm text-gray-400">{desc}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="API reference">
        <p className="text-gray-400 text-sm">
          All routes run on the Node.js runtime and drive the same engine that powers the Console. Bodies are JSON.
        </p>
        <div className="space-y-3">
          {ENDPOINTS.map((e) => (
            <div key={e.path} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${e.method === 'GET' ? 'bg-cyan-500/15 text-cyan-300' : 'bg-violet-500/15 text-violet-300'}`}>
                  {e.method}
                </span>
                <code className="text-sm font-mono text-white">{e.path}</code>
                <span className="text-[11px] font-mono text-gray-500 ml-auto">→ {e.returns}</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">{e.desc}</p>
              {e.body !== '—' && (
                <pre className="mt-2 bg-black/50 border border-white/10 rounded-lg p-3 text-xs font-mono text-gray-300 overflow-x-auto">
                  {e.body}
                </pre>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Run it locally">
        <pre className="bg-black/50 border border-white/10 rounded-xl p-4 text-sm font-mono text-gray-300 overflow-x-auto">
{`npm install
npm run dev        # Next.js console at http://localhost:3000
npm run verify     # engine checks: schema + unit tests + chaos suite`}
        </pre>
      </Section>

      <div className="rounded-2xl border border-violet-500/30 bg-violet-500/[0.06] p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-white font-semibold">Ready to see it run?</h3>
          <p className="text-gray-400 text-sm">Walk the full observe → break → heal → diff loop on live data.</p>
        </div>
        <Link
          href="/console"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium px-5 py-2.5 transition-colors shrink-0"
        >
          Launch Console <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2">{title}</h2>
      {children}
    </section>
  )
}

function Concept({ name, body }: { name: string; body: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <h3 className="text-white font-semibold text-sm mb-1">{name}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{body}</p>
    </div>
  )
}

import {
  ShieldCheck,
  FileText,
  ScanSearch,
  GitCompare,
  Wrench,
  ChevronRight,
  Hash,
  Fingerprint,
  Clock,
  Radar,
  Terminal,
} from 'lucide-react'
import PixelCard from '@/components/effects/pixel-card'
import { DecryptText } from '@/components/effects/decrypt-text'
import { SystemFooter } from '@/components/matrix/system-footer'
import { SystemTicker } from '@/components/matrix/system-ticker'
import {
  SystemLink,
  SystemCard,
  MatrixPanel,
  Reveal,
  SystemRail,
  SystemStatus,
  SectionHead,
  Kicker,
  type MatrixTone,
} from '@/components/matrix/matrix-ui'

const STAGES = [
  { n: 1, title: 'Observe', body: 'Traverse a public commerce journey and capture every displayed price, fee and term.', tone: 'data' },
  { n: 2, title: 'Compile', body: 'Fold the observations into one canonical Deal Contract.', tone: 'phosphor' },
  { n: 3, title: 'Verify', body: 'Run deterministic integrity checks and flag wrong-but-valid semantic drift.', tone: 'matrix' },
  { n: 4, title: 'Heal', body: 'Propose a repair, verify the preview against invariants, then deploy.', tone: 'matrix' },
  { n: 5, title: 'Diff', body: 'Compare contracts over time to expose changed commercial promises.', tone: 'data' },
] as const

const PROBLEMS = [
  ['Commercial terms drift', 'A displayed price can stay the same while shipping, taxes, cancellation rules or other mandatory terms change. The distinction has to survive the scrape.'],
  ['Wrong-but-valid extraction', 'A redesign can leave a selector returning a perfectly valid number even though that selector now represents a different business meaning.'],
  ['Screenshots aren’t evidence', 'A PNG cannot prove when it was taken or whether it was edited. Claims need cryptographic provenance and a verifiable chain of evidence.'],
] as const

const CAPABILITIES: [typeof FileText, MatrixTone, string, string, string][] = [
  [FileText, 'phosphor', 'Deal Contract', 'One canonical schema compiled from public commerce journeys — prices, checkout breakdowns, fees, taxes and terms.', '/docs'],
  [ShieldCheck, 'matrix', 'Contract Integrity Engine', 'Eleven deterministic checks catch semantic drift and arithmetic contradictions — not just missing selectors.', '/docs'],
  [ScanSearch, 'warn', 'Observed Anomalies', 'Surface observed price changes and mandatory charges as reported facts — observed, never adjudicated.', '/console'],
  [GitCompare, 'data', 'Promise Diff', 'Compare commercial promises over time: pricing, fees, cancellation terms and other conditions.', '/console'],
  [Wrench, 'matrix', 'Self-Healing', 'When extraction breaks after a redesign, a repair can be proposed and verified against the contract before deployment.', '/console'],
  [Fingerprint, 'data', 'Tamper-Evident Evidence', 'Every field carries a SHA-256 hash; the whole contract is sealed so changes are detectable.', '/receipts'],
]

export default function LandingPage() {
  return (
    <div>
      <section className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(72% 60% at 22% 42%, rgba(0,0,0,.92) 0%, rgba(0,0,0,.72) 46%, transparent 78%)' }} />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[1.08fr_1fr] lg:gap-14 lg:py-14 lg:px-8">
          <div>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-matrix-200">
              <span className="h-1.5 w-1.5 rounded-full bg-matrix-400 shadow-[0_0_12px_rgba(51,255,102,.8)]" aria-hidden />
              <span className="text-matrix-300">Live evidence system</span>
              <span className="h-px w-14 bg-gradient-to-r from-matrix-400/70 to-transparent" aria-hidden />
              <span className="text-void-300">Channel secure</span>
              <span className="text-matrix-400">/</span>
              <span className="text-void-300">Established</span>
            </div>

            <div className="mt-8 max-w-4xl">
              <h1 className="font-mono text-[clamp(2.15rem,4.2vw,4.25rem)] font-bold uppercase leading-[0.92] tracking-[0.025em]">
                <span className="block text-void-50">
                  <DecryptText text="PROOF OF" delay={120} />
                </span>
                <span className="block text-void-50">
                  <DecryptText text="PROMISES SEALED" delay={360} />
                </span>
                <span className="block text-matrix-400 drop-shadow-[0_0_24px_rgba(51,255,102,.18)]">
                  <DecryptText text="IN CODE._" delay={600} />
                </span>
              </h1>
              <div className="mt-4 h-px w-24 bg-matrix-400/70 shadow-[0_0_12px_rgba(51,255,102,.35)]" aria-hidden />
            </div>

            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-void-200">
              WebReceipt turns public commerce journeys into one canonical <span className="font-semibold text-void-100">Deal Contract</span>{' '}
              with timestamped, tamper-evident evidence. It preserves the meaning behind prices, fees and terms, detects
              wrong-but-valid extraction after a page changes, and makes every repair prove itself before the result is trusted.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <SystemLink href="/console" tone="matrix" size="lg" variant="solid" scan>Open live demo <ChevronRight size={16} aria-hidden /></SystemLink>
              <SystemLink href="/fixture/product?version=v1" tone="void" size="lg" scan>Open controlled fixture</SystemLink>
            </div>
            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
              {[['11', 'integrity checks'], ['SHA-256', 'per evidence field'], ['1', 'canonical contract']].map(([v, k]) => (
                <div key={k}>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-void-300">{k}</dt>
                  <dd className="mt-1 font-mono text-xl font-semibold text-matrix-300">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Reveal delay={140}>
            <div className="terminal terminal-phosphor">
              <div className="terminal-bar">
                <Terminal size={12} className="text-matrix-400" aria-hidden />
                <span className="sys-label flex-1">webreceipt · semantic drift</span>
                <SystemStatus label="" value="Ready" className="!text-[9px]" />
              </div>
              <ol className="relative z-[1] space-y-3 px-5 py-5">
                {STAGES.map((s) => (
                  <li key={s.n} className="flex gap-3">
                    <span className="mt-[3px] font-mono text-[10px] tabular-nums text-void-400">{String(s.n).padStart(2, '0')}</span>
                    <span className="min-w-0">
                      <span className="sys-prompt font-mono text-[12.5px] uppercase tracking-[0.16em] text-matrix-200">{s.title}</span>
                      <span className="mt-0.5 block text-[12.5px] leading-relaxed text-void-200">{s.body}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <div className="relative z-[1] flex items-center gap-2 border-t border-matrix-400/12 px-5 py-3">
                <Radar size={12} className="text-matrix-400" aria-hidden />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-void-300">Controlled demo · reproducible commerce journey</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="border-y border-matrix-400/10 bg-black/50"><SystemTicker /></div>

      <div className="mx-auto max-w-7xl space-y-24 px-4 pt-20 pb-0 sm:px-6 lg:px-8">
        <section className="space-y-10">
          <SectionHead kicker="The problem" tone="alarm" title="The scraper can succeed and still be wrong." desc="Commerce pages mutate. A selector can keep returning a clean, plausible value after the business meaning behind that value has changed." />
          <div className="grid gap-6 md:grid-cols-3">
            {PROBLEMS.map(([title, body], i) => (
              <Reveal key={title} delay={i * 110}>
                <MatrixPanel tone="alarm" className="h-full">
                  <PixelCard variant="alarm" className="h-full p-6">
                    <div className="mb-4 h-px w-10 bg-alarm-400 shadow-[0_0_10px_-1px_rgba(255,77,77,.9)]" />
                    <h3 className="mb-2 text-[17px] font-semibold text-void-100">{title}</h3>
                    <p className="text-[13.5px] leading-relaxed text-void-200">{body}</p>
                  </PixelCard>
                </MatrixPanel>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="space-y-10">
          <SectionHead kicker="Subsystems" title="A self-healing commerce evidence engine" desc="Every capability is wired into the same canonical Deal Contract, so extraction, verification and diffing all speak one economic language." />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map(([Icon, tone, title, body, href], i) => (
              <Reveal key={title} delay={i * 80}>
                <SystemCard href={href} tone={tone} className="group h-full">
                  <PixelCard variant={tone === 'alarm' ? 'alarm' : 'matrix'} className="h-full p-6">
                    <div className="mb-4 grid h-10 w-10 place-items-center rounded-[2px] border bg-black/50" style={{ borderColor: 'color-mix(in srgb, var(--accent) 45%, transparent)', color: 'var(--accent)', boxShadow: 'inset 0 0 18px -9px var(--accent)' }}>
                      <Icon size={18} aria-hidden />
                    </div>
                    <h3 className="mb-2 text-[16.5px] font-semibold text-void-100">{title}</h3>
                    <p className="text-[13.5px] leading-relaxed text-void-200">{body}</p>
                    <span className="mt-4 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-void-300 transition-colors group-hover:text-matrix-300">Open <ChevronRight size={11} aria-hidden /></span>
                  </PixelCard>
                </SystemCard>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="space-y-10">
          <SectionHead kicker="How it works" title="Input → transformation → verification → result" desc="Five stages, one contract. Nothing downstream trusts a value that hasn’t survived the checks." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STAGES.map((s, i) => (
              <Reveal key={s.n} delay={i * 90}>
                <MatrixPanel tone={s.tone} className="h-full">
                  <PixelCard variant="matrix" className="h-full p-5">
                    <SystemRail count={4} tone={s.tone} />
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="font-mono text-[11px] tabular-nums text-void-400">{String(s.n).padStart(2, '0')}</span>
                      <h3 className="text-[16px] font-semibold text-void-100">{s.title}</h3>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-void-200">{s.body}</p>
                  </PixelCard>
                </MatrixPanel>
              </Reveal>
            ))}
          </div>
        </section>

        <section>
          <Reveal>
            <MatrixPanel tone="data" className="relative overflow-hidden">
              <PixelCard variant="matrix" className="relative p-8 md:p-12">
                <div className="relative z-[1] grid items-center gap-8 md:grid-cols-3">
                  <div className="space-y-3 md:col-span-2">
                    <Kicker tone="data">Provenance</Kicker>
                    <h2 className="text-[26px] font-bold leading-tight text-void-100 sm:text-[30px]">Evidence you can verify, not just view</h2>
                    <p className="max-w-xl text-[14.5px] leading-relaxed text-void-200">Captured text, source URL, DOM path, journey step and timestamp are hashed with SHA-256. The entire Deal Contract is sealed with its own hash, so tampering with any claim is provable — and detectable.</p>
                    <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-[2px] border border-data-400/35 bg-black/60 px-4 py-2.5 font-mono text-[12px] text-data-300"><Hash size={13} aria-hidden /> 9f2c1a7e4b…c081 <span className="text-void-400">contract hash · example shape</span></div>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex w-full justify-center gap-8">
                      <Metric icon={Hash} label="Per-field" value="SHA-256" />
                      <Metric icon={Clock} label="Every claim" value="Timestamped" />
                    </div>
                  </div>
                </div>
              </PixelCard>
            </MatrixPanel>
          </Reveal>
        </section>

        <section className="space-y-6 pb-4 text-center">
          <h2 className="text-[30px] font-bold uppercase leading-tight tracking-[-0.015em] sm:text-[40px]"><span className="phosphor-text">See the semantic-drift loop</span> <span className="code-text">in two minutes</span></h2>
          <p className="mx-auto max-w-lg text-[14.5px] leading-relaxed text-void-200">Observe a controlled commerce contract, introduce a meaning change, verify the repair, rerun the journey, and diff the promise over time.</p>
          <div className="flex justify-center pt-2"><SystemLink href="/console" tone="matrix" size="lg" variant="solid" scan>Open live demo <ChevronRight size={16} aria-hidden /></SystemLink></div>
        </section>

        <SystemFooter />
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-void-300"><Icon size={12} aria-hidden /> {label}</div>
      <div className="mt-1 font-mono text-[15px] font-semibold text-data-300">{value}</div>
    </div>
  )
}

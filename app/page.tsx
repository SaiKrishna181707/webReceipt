import {
  ShieldCheck,
  FileText,
  ScanSearch,
  GitCompare,
  Wrench,
  ArrowRight,
  Hash,
  Fingerprint,
  Clock,
  Sun,
} from 'lucide-react'
import { ViceStage } from '@/components/three/vice-stage'
import { NeonLink, DecoPanel, Reveal, TubeRail, BoulevardTicker, type ViceTone } from '@/components/vice/vice-ui'

const STEPS = [
  { n: 1, title: 'Observe', body: 'Traverse the public journey and capture every displayed price.', tone: 'aqua' },
  { n: 2, title: 'Compile', body: 'Fold observations into one canonical Deal Contract.', tone: 'gold' },
  { n: 3, title: 'Verify', body: 'Run 11 integrity checks; flag wrong-but-valid drift.', tone: 'mint' },
  { n: 4, title: 'Heal', body: 'Propose a repair, verify the preview, then deploy.', tone: 'neon' },
  { n: 5, title: 'Diff', body: 'Compare contracts over time to expose changed promises.', tone: 'violet' },
] as const

export default function LandingPage() {
  return (
    <div>
      {/* ==================================================================
          HERO — a hotel sign on the boulevard advertises a price, one of its
          tubes burns out, and a verified repair relights it. On a loop.
          ================================================================== */}
      <section className="relative min-h-[94vh] w-full overflow-hidden">
        <ViceStage scene="hero" className="absolute inset-0 h-full w-full" />

        {/* Readability wash: dusk closes in on the left where the type sits */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0a0510] via-[#0a0510]/74 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#0a0510] to-transparent" />

        <div className="pointer-events-none relative z-10 mx-auto flex min-h-[94vh] max-w-7xl flex-col justify-center px-4 py-28 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-7">
            <span
              className="inline-flex items-center gap-2 rounded-[2px] border px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{
                borderColor: '#ffc23c',
                color: '#fff6e0',
                background: 'linear-gradient(180deg,rgba(255,194,60,.24),rgba(255,194,60,.04))',
                boxShadow: 'inset 0 -8px 20px -12px #ffc23c, 0 0 18px -6px rgba(255,194,60,.7)',
                textShadow: '0 0 10px rgba(255,194,60,.8)',
              }}
            >
              <Sun size={13} /> WeMakeDevs · Into the Scrape-Verse
            </span>

            <h1 className="display text-5xl leading-[0.94] sm:text-6xl lg:text-7xl">
              <span className="chrome-text block italic">Proof of Promise,</span>
              <span className="neon-text block italic">sealed in neon.</span>
            </h1>

            <TubeRail count={12} tone="gold" />

            <p className="max-w-xl text-[17px] leading-relaxed text-night-200">
              WebReceipt walks a public purchase journey, wires every price, fee and term into one canonical{' '}
              <span className="font-semibold text-white">Deal Contract</span>, and seals each claim with timestamped,
              tamper-evident evidence. When a site redesign kills a tube, it relights itself — and verifies the repair
              before trusting it.
            </p>

            <div className="pointer-events-auto flex flex-wrap items-center gap-5 pt-2">
              <NeonLink href="/console" tone="neon" size="lg">
                Launch the Console <ArrowRight size={17} />
              </NeonLink>
              <NeonLink href="/docs" tone="chrome" size="lg">
                Read the Docs
              </NeonLink>
            </div>

            <dl className="flex flex-wrap gap-x-10 gap-y-4 pt-6">
              {[
                ['11', 'integrity checks'],
                ['SHA-256', 'per evidence field'],
                ['1', 'canonical contract'],
              ].map(([v, k]) => (
                <div key={k}>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-night-300">{k}</dt>
                  <dd className="display text-2xl italic text-gold-400">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Storefronts sliding past */}
      <div className="border-y border-white/[0.07] bg-night-900/60">
        <BoulevardTicker />
      </div>

      <div className="mx-auto max-w-7xl space-y-28 px-4 py-24 sm:px-6 lg:px-8">
        {/* ================================================================
            PROBLEM
            ================================================================ */}
        <section className="space-y-10">
          <SectionHead
            kicker="The problem"
            title="The web is mutable. Promises are not kept."
            desc="Prices drift, fees appear at checkout, terms change overnight — and the scrapers meant to watch them go dark the moment a page is redesigned."
          />
          <div className="grid gap-8 md:grid-cols-3">
            {[
              ['Silent economic drift', 'An advertised ₹8,499 quietly becomes ₹10,147 by checkout. No record, no diff, no proof.'],
              ['Wrong-but-valid extraction', 'A redesign makes a scraper read ₹8,499 as the total. Every field is populated — and every number is wrong.'],
              ['Screenshots aren’t evidence', 'A PNG can’t prove when it was taken or that it wasn’t edited. Claims need cryptographic provenance.'],
            ].map(([title, body], i) => (
              <Reveal key={title} delay={i * 110}>
                <DecoPanel tone="blood" className="h-full p-6">
                  <div className="mb-3 h-[3px] w-10 rounded-full bg-blood-500 shadow-[0_0_10px_-1px_rgba(255,45,94,.9)]" />
                  <h3 className="display mb-2 text-lg text-white">{title}</h3>
                  <p className="text-sm leading-relaxed text-night-200">{body}</p>
                </DecoPanel>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ================================================================
            CAPABILITIES — one lit sign per engine
            ================================================================ */}
        <section className="space-y-10">
          <SectionHead
            kicker="One strip, six signs"
            title="A self-healing consumer evidence engine"
            desc="Every capability is wired into the same canonical Deal Contract, so extraction, verification and diffing all speak one economic language."
          />
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              [FileText, 'gold', 'Deal Contract', 'One canonical schema compiled from any site — advertised price, checkout breakdown, fees, taxes, and terms.'],
              [ShieldCheck, 'mint', 'Contract Integrity Engine', 'Eleven deterministic checks catch semantic drift like 8499 + 848 + 800 ≠ 8499 — not just null selectors.'],
              [ScanSearch, 'violet', 'Deal Anomalies', 'Surfaces observed price increases and mandatory charges as reported facts — observed, never adjudicated.'],
              [GitCompare, 'aqua', 'Promise Diff', 'git diff for commercial promises: watch “Free cancellation” turn into “Non-refundable” across time.'],
              [Wrench, 'neon', 'Self-Healing', 'When a redesign breaks extraction, an AI repair is proposed — then verified against contract invariants before deploy.'],
              [Fingerprint, 'chrome', 'Tamper-Evident Evidence', 'Every field carries a SHA-256 hash; the whole contract is sealed, so any change is detectable.'],
            ].map(([Icon, tone, title, body], i) => {
              const I = Icon as typeof FileText
              const t = tone as ViceTone
              return (
                <Reveal key={title as string} delay={i * 90}>
                  <DecoPanel tone={t} className="h-full p-6">
                    <div
                      className="mb-4 flex h-11 w-11 items-center justify-center rounded-[2px] border bg-black/40"
                      style={{
                        borderColor: 'var(--deco-accent)',
                        color: 'var(--deco-accent)',
                        boxShadow: 'inset 0 0 18px -8px var(--deco-accent), 0 0 16px -8px var(--deco-accent)',
                      }}
                    >
                      <I size={20} />
                    </div>
                    <h3 className="display mb-2 text-lg text-white">{title as string}</h3>
                    <p className="text-sm leading-relaxed text-night-200">{body as string}</p>
                  </DecoPanel>
                </Reveal>
              )
            })}
          </div>
        </section>
      </div>

      {/* ==================================================================
          THE STRIP — scroll drives the camera down the boulevard and each
          billboard strikes its tubes as you reach it.
          ================================================================== */}
      <section data-scroll-root className="relative h-[260vh] border-y border-white/[0.07]">
        <div className="sticky top-16 h-[calc(100vh-4rem)] w-full overflow-hidden">
          <ViceStage scene="boulevard" className="absolute inset-0 h-full w-full" />

          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-[#0a0510] via-[#0a0510]/85 to-transparent pb-20 pt-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="font-mono text-[11px] uppercase tracking-[0.26em] text-gold-400">How it works</div>
              <h2 className="display mt-2 text-3xl italic text-white sm:text-4xl">Scroll to drive the strip</h2>
              <p className="mt-2 max-w-lg text-sm text-night-200">
                Five billboards, five stages. Each one strikes its tubes as you reach it — and goes dark again on the way
                back up.
              </p>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#0a0510] via-[#0a0510]/88 to-transparent pb-8 pt-24">
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 sm:grid-cols-3 sm:px-6 lg:grid-cols-5 lg:px-8">
              {STEPS.map((s) => (
                <div key={s.n} className="space-y-2">
                  <TubeRail count={4} tone={s.tone} />
                  <div className="display text-lg italic text-white">
                    <span className="mr-1.5 font-mono text-xs not-italic text-gold-400">
                      {String(s.n).padStart(2, '0')}
                    </span>
                    {s.title}
                  </div>
                  <p className="hidden text-xs leading-relaxed text-night-300 sm:block">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-28 px-4 py-24 sm:px-6 lg:px-8">
        {/* ================================================================
            EVIDENCE
            ================================================================ */}
        <section>
          <Reveal>
            <DecoPanel tone="aqua" tilt={false} className="grid items-center gap-8 p-8 md:grid-cols-3 md:p-12">
              <div className="space-y-3 md:col-span-2">
                <div className="font-mono text-[11px] uppercase tracking-[0.26em] text-aqua-400">Provenance</div>
                <h2 className="display text-3xl italic text-white">Evidence you can verify, not just view</h2>
                <p className="max-w-xl text-night-200">
                  Captured text, source URL, DOM path, journey step and timestamp are hashed with SHA-256. The entire
                  Deal Contract is sealed with its own hash, so tampering with any claim is provable — and detectable.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-[2px] border border-mint-400/40 bg-black/55 px-4 py-2.5 font-mono text-[12px] text-mint-300 shadow-[inset_0_0_20px_-10px_rgba(53,243,154,.8)]">
                  <Hash size={13} /> 9f2c1a7e4b…c081 <span className="text-night-400">contract hash</span>
                </div>
              </div>
              <div className="flex gap-8 md:justify-end">
                <Metric icon={Hash} label="Per-field" value="SHA-256" />
                <Metric icon={Clock} label="Every claim" value="Timestamped" />
              </div>
            </DecoPanel>
          </Reveal>
        </section>

        {/* ================================================================
            CTA
            ================================================================ */}
        <section className="space-y-7 pb-8 text-center">
          <h2 className="display text-4xl italic sm:text-5xl">
            <span className="neon-text">See the whole loop</span>{' '}
            <span className="chrome-text">in two minutes</span>
          </h2>
          <p className="mx-auto max-w-lg text-night-200">
            Observe a journey, break the extraction, heal it with a verified repair, and diff the promise — all on live
            engine data.
          </p>
          <div className="flex justify-center pt-2">
            <NeonLink href="/console" tone="gold" size="lg" variant="solid">
              Launch the Console <ArrowRight size={17} />
            </NeonLink>
          </div>
        </section>
      </div>
    </div>
  )
}

function SectionHead({ kicker, title, desc }: { kicker: string; title: string; desc?: string }) {
  return (
    <div className="max-w-2xl space-y-3">
      <div className="font-mono text-[11px] uppercase tracking-[0.26em] text-gold-400">{kicker}</div>
      <h2 className="display text-3xl italic text-white sm:text-4xl">{title}</h2>
      {desc && <p className="text-night-200">{desc}</p>}
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-night-300">
        <Icon size={12} /> {label}
      </div>
      <div className="display mt-1 text-lg italic text-gold-400">{value}</div>
    </div>
  )
}

import Link from 'next/link'
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
  Blocks,
} from 'lucide-react'
import { BrickStage } from '@/components/three/brick-stage'
import { BrickLink, BrickPanel, BrickReveal, StudRail, PartsConveyor, type BrickTone } from '@/components/lego/brick-ui'

const STEPS = [
  { n: 1, title: 'Observe', body: 'Traverse the public journey and capture every displayed price.', tone: 'grey' },
  { n: 2, title: 'Compile', body: 'Fold observations into one canonical Deal Contract.', tone: 'white' },
  { n: 3, title: 'Verify', body: 'Run 11 integrity checks; flag wrong-but-valid drift.', tone: 'yellow' },
  { n: 4, title: 'Heal', body: 'Propose a repair, verify the preview, then deploy.', tone: 'green' },
  { n: 5, title: 'Diff', body: 'Compare contracts over time to expose changed promises.', tone: 'blue' },
] as const

export default function LandingPage() {
  return (
    <div>
      {/* ==================================================================
          HERO — the build assembles itself behind the copy, then a brick
          breaks and a verified repair clutches into the gap, on a loop.
          ================================================================== */}
      <section className="relative min-h-[94vh] w-full overflow-hidden">
        <BrickStage scene="hero" className="absolute inset-0 h-full w-full" />

        {/* Readability wash: dark on the left where the type sits */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0d0e0b] via-[#0d0e0b]/72 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0d0e0b] to-transparent" />

        <div className="pointer-events-none relative z-10 mx-auto flex min-h-[94vh] max-w-7xl flex-col justify-center px-4 py-28 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-7">
            <span
              className="inline-flex items-center gap-2 rounded-[5px] px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{
                background: 'linear-gradient(180deg,#ffe266 0%,#f6c500 46%,#c99f00 100%)',
                color: '#1b1b1b',
                boxShadow: 'inset 0 2px 0 rgba(255,255,255,.45), inset 0 -2px 0 rgba(0,0,0,.28), 0 4px 0 -1px #8f7000',
              }}
            >
              <Blocks size={13} /> WeMakeDevs · Into the Scrape-Verse
            </span>

            <h1 className="display text-5xl leading-[0.94] sm:text-6xl lg:text-7xl">
              <span className="block text-white text-moulded">Proof of Promise,</span>
              <span className="brick-text block">brick by brick.</span>
            </h1>

            <StudRail count={12} tone="yellow" />

            <p className="max-w-xl text-[17px] leading-relaxed text-plate-200">
              WebReceipt walks a public purchase journey, snaps every price, fee and term into one canonical{' '}
              <span className="font-semibold text-white">Deal Contract</span>, and seals each claim with timestamped,
              tamper-evident evidence. When a site redesign snaps a part off, it rebuilds itself — and verifies the
              repair before trusting it.
            </p>

            <div className="pointer-events-auto flex flex-wrap items-center gap-5 pt-2">
              <BrickLink href="/console" tone="red" size="lg">
                Launch the Console <ArrowRight size={17} />
              </BrickLink>
              <BrickLink href="/docs" tone="slate" size="lg">
                Read the Docs
              </BrickLink>
            </div>

            <dl className="flex flex-wrap gap-x-10 gap-y-4 pt-6">
              {[
                ['11', 'integrity checks'],
                ['SHA-256', 'per evidence field'],
                ['1', 'canonical contract'],
              ].map(([v, k]) => (
                <div key={k}>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-plate-300">{k}</dt>
                  <dd className="display text-2xl text-stud-400">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Loose parts conveyor */}
      <div className="border-y border-white/[0.07] bg-plate-900/60">
        <PartsConveyor />
      </div>

      <div className="mx-auto max-w-7xl space-y-28 px-4 py-24 sm:px-6 lg:px-8">
        {/* ================================================================
            PROBLEM
            ================================================================ */}
        <section className="space-y-10">
          <SectionHead
            kicker="The problem"
            title="The web is mutable. Promises are not kept."
            desc="Prices drift, fees appear at checkout, terms change overnight — and the scrapers meant to watch them snap the moment a page is redesigned."
          />
          <div className="grid gap-8 md:grid-cols-3">
            {[
              ['Silent economic drift', 'An advertised ₹8,499 quietly becomes ₹10,147 by checkout. No record, no diff, no proof.'],
              ['Wrong-but-valid extraction', 'A redesign makes a scraper read ₹8,499 as the total. Every field is populated — and every number is wrong.'],
              ['Screenshots aren’t evidence', 'A PNG can’t prove when it was taken or that it wasn’t edited. Claims need cryptographic provenance.'],
            ].map(([title, body], i) => (
              <BrickReveal key={title} delay={i * 110}>
                <BrickPanel tone="red" className="h-full p-6">
                  <div className="mb-3 h-1.5 w-10 rounded-full bg-black/35" />
                  <h3 className="display mb-2 text-lg text-white">{title}</h3>
                  <p className="text-sm leading-relaxed text-white/80">{body}</p>
                </BrickPanel>
              </BrickReveal>
            ))}
          </div>
        </section>

        {/* ================================================================
            CAPABILITIES — one brick per engine, in its own ABS colour
            ================================================================ */}
        <section className="space-y-10">
          <SectionHead
            kicker="One set, six parts"
            title="A self-healing consumer evidence engine"
            desc="Every capability clutches onto the same canonical Deal Contract, so extraction, verification and diffing all speak one economic language."
          />
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              [FileText, 'yellow', 'Deal Contract', 'One canonical schema compiled from any site — advertised price, checkout breakdown, fees, taxes, and terms.'],
              [ShieldCheck, 'green', 'Contract Integrity Engine', 'Eleven deterministic checks catch semantic drift like 8499 + 848 + 800 ≠ 8499 — not just null selectors.'],
              [ScanSearch, 'orange', 'Deal Anomalies', 'Surfaces observed price increases and mandatory charges as reported facts — observed, never adjudicated.'],
              [GitCompare, 'blue', 'Promise Diff', 'git diff for commercial promises: watch “Free cancellation” turn into “Non-refundable” across time.'],
              [Wrench, 'red', 'Self-Healing', 'When a redesign breaks extraction, an AI repair is proposed — then verified against contract invariants before deploy.'],
              [Fingerprint, 'white', 'Tamper-Evident Evidence', 'Every field carries a SHA-256 hash; the whole contract is sealed, so any change is detectable.'],
            ].map(([Icon, tone, title, body], i) => {
              const I = Icon as typeof FileText
              return (
                <BrickReveal key={title as string} delay={i * 90}>
                  <BrickPanel tone={tone as BrickTone} className="h-full p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[6px] bg-black/25 shadow-[inset_0_2px_0_rgba(255,255,255,.16),inset_0_-2px_0_rgba(0,0,0,.3)]">
                      <I size={20} />
                    </div>
                    <h3 className="display mb-2 text-lg">{title as string}</h3>
                    <p className="text-sm leading-relaxed opacity-80">{body as string}</p>
                  </BrickPanel>
                </BrickReveal>
              )
            })}
          </div>
        </section>
      </div>

      {/* ==================================================================
          THE PIPELINE — scroll assembles five stacks and dollies the camera
          along the row. Scroll back up and the model comes apart.
          ================================================================== */}
      <section data-scroll-root className="relative h-[260vh] border-y border-white/[0.07]">
        <div className="sticky top-16 h-[calc(100vh-4rem)] w-full overflow-hidden">
          <BrickStage scene="pipeline" className="absolute inset-0 h-full w-full" />

          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-[#0d0e0b] via-[#0d0e0b]/85 to-transparent pb-20 pt-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-stud-400">How it works</div>
              <h2 className="display mt-2 text-3xl text-white sm:text-4xl">Scroll to build the pipeline</h2>
              <p className="mt-2 max-w-lg text-sm text-plate-200">
                Five stacks, five stages. Every brick is one step of the loop — and the whole model comes apart again on
                the way back up.
              </p>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#0d0e0b] via-[#0d0e0b]/88 to-transparent pb-8 pt-24">
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 sm:grid-cols-3 sm:px-6 lg:grid-cols-5 lg:px-8">
              {STEPS.map((s) => (
                <div key={s.n} className="space-y-2">
                  <StudRail count={4} tone={s.tone} />
                  <div className="display text-lg text-white">
                    <span className="mr-1.5 font-mono text-xs text-stud-400">{String(s.n).padStart(2, '0')}</span>
                    {s.title}
                  </div>
                  <p className="hidden text-xs leading-relaxed text-plate-300 sm:block">{s.body}</p>
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
          <BrickReveal>
            <BrickPanel tone="slate" className="grid items-center gap-8 p-8 md:grid-cols-3 md:p-12">
              <div className="space-y-3 md:col-span-2">
                <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-stud-400">Provenance</div>
                <h2 className="display text-3xl text-white">Evidence you can verify, not just view</h2>
                <p className="max-w-xl text-plate-200">
                  Captured text, source URL, DOM path, journey step and timestamp are hashed with SHA-256. The entire
                  Deal Contract is sealed with its own hash, so tampering with any claim is provable — and detectable.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-[6px] bg-black/45 px-4 py-2.5 font-mono text-[12px] text-lime-300 shadow-[inset_0_2px_0_rgba(255,255,255,.06),inset_0_-2px_0_rgba(0,0,0,.4)]">
                  <Hash size={13} /> 9f2c1a7e4b…c081 <span className="text-plate-400">contract hash</span>
                </div>
              </div>
              <div className="flex gap-8 md:justify-end">
                <Metric icon={Hash} label="Per-field" value="SHA-256" />
                <Metric icon={Clock} label="Every claim" value="Timestamped" />
              </div>
            </BrickPanel>
          </BrickReveal>
        </section>

        {/* ================================================================
            CTA
            ================================================================ */}
        <section className="space-y-7 pb-8 text-center">
          <h2 className="display text-4xl sm:text-5xl">
            <span className="brick-text-red">See the whole loop</span>{' '}
            <span className="text-white text-moulded">in two minutes</span>
          </h2>
          <p className="mx-auto max-w-lg text-plate-200">
            Observe a journey, snap the extraction, heal it with a verified repair, and diff the promise — all on live
            engine data.
          </p>
          <div className="flex justify-center pt-2">
            <BrickLink href="/console" tone="yellow" size="lg">
              Launch the Console <ArrowRight size={17} />
            </BrickLink>
          </div>
        </section>
      </div>
    </div>
  )
}

function SectionHead({ kicker, title, desc }: { kicker: string; title: string; desc?: string }) {
  return (
    <div className="max-w-2xl space-y-3">
      <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-stud-400">{kicker}</div>
      <h2 className="display text-3xl text-white sm:text-4xl">{title}</h2>
      {desc && <p className="text-plate-200">{desc}</p>}
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-plate-300">
        <Icon size={12} /> {label}
      </div>
      <div className="display mt-1 text-lg text-stud-400">{value}</div>
    </div>
  )
}

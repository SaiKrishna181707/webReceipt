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
  Sparkles,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="pt-8 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 text-xs font-mono text-violet-300 bg-violet-500/10 border border-violet-500/30 rounded-full px-3 py-1.5">
            <Sparkles size={13} /> WeMakeDevs · Into the Scrape-Verse
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-[1.1]">
            Proof of Promise for the{' '}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              mutable web
            </span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl">
            WebReceipt walks a public purchase journey, compiles every price, fee and term into one canonical{' '}
            <span className="text-white font-medium">Deal Contract</span>, and seals each claim with timestamped,
            tamper-evident evidence. When a site redesign corrupts extraction, it heals itself — and verifies the repair
            before trusting it.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/console"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium px-6 py-3 transition-colors"
            >
              Launch the Console <ArrowRight size={16} />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 hover:border-white/30 text-gray-200 font-medium px-6 py-3 transition-colors"
            >
              Read the Docs
            </Link>
          </div>
        </div>

        {/* Mini receipt visual */}
        <div className="glass-card rounded-2xl border border-white/10 p-6 glow-violet">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-bold flex items-center gap-1.5">
              <FileText size={12} /> Deal Contract · v1.1.0
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
              <ShieldCheck size={11} /> valid · 11/11
            </span>
          </div>
          <div className="text-sm text-gray-300 font-medium">Ocean House · 1 night · Deluxe Room</div>
          <div className="mt-4 flex items-end gap-4">
            <div>
              <div className="text-[10px] font-mono uppercase text-gray-500">Advertised</div>
              <div className="text-2xl font-bold font-mono text-gray-400">₹8,499</div>
            </div>
            <ArrowRight className="text-gray-600 mb-2" size={18} />
            <div>
              <div className="text-[10px] font-mono uppercase text-gray-500">Observed total</div>
              <div className="text-3xl font-bold font-mono text-white">₹10,147</div>
            </div>
            <span className="mb-2 text-sm font-mono font-bold text-rose-400">+₹1,648</span>
          </div>
          <div className="mt-4 space-y-1.5 text-xs font-mono">
            {[
              ['Base price', '₹8,499'],
              ['Property + service fees', '₹848'],
              ['Taxes', '₹800'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-gray-500">
                <span>{k}</span>
                <span className="text-gray-300">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-emerald-300 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
            <Hash size={12} /> 9f2c1a7e4b…c081 <span className="text-gray-600">contract hash</span>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="space-y-8">
        <SectionHead
          kicker="The problem"
          title="The web is mutable. Promises are not kept."
          desc="Prices drift, fees appear at checkout, terms change overnight, and the scrapers meant to watch them break the moment a page is redesigned."
        />
        <div className="grid md:grid-cols-3 gap-4">
          <Problem
            title="Silent economic drift"
            body="An advertised ₹8,499 quietly becomes ₹10,147 by checkout. No record, no diff, no proof."
          />
          <Problem
            title="Wrong-but-valid extraction"
            body="A redesign makes a scraper read ₹8,499 as the total. Every field is populated — and every number is wrong."
          />
          <Problem
            title="Screenshots aren't evidence"
            body="A PNG can't prove when it was taken or that it wasn't edited. Claims need cryptographic provenance."
          />
        </div>
      </section>

      {/* Engines */}
      <section className="space-y-8">
        <SectionHead
          kicker="One engine, five capabilities"
          title="A self-healing consumer evidence engine"
          desc="Every capability operates on the same canonical Deal Contract, so extraction, verification and diffing all speak one economic language."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Engine icon={FileText} tone="violet" title="Deal Contract" body="One canonical schema compiled from any site — advertised price, checkout breakdown, fees, taxes, and terms." />
          <Engine icon={ShieldCheck} tone="emerald" title="Contract Integrity Engine" body="11 deterministic checks catch semantic drift like 8499 + 848 + 800 ≠ 8499 — not just null selectors." />
          <Engine icon={ScanSearch} tone="amber" title="Deal Anomalies" body="Surfaces observed price increases and mandatory charges as reported facts — observed, never adjudicated." />
          <Engine icon={GitCompare} tone="cyan" title="Promise Diff" body="git diff for commercial promises: watch 'Free cancellation' turn into 'Non-refundable' across time." />
          <Engine icon={Wrench} tone="rose" title="Self-Healing" body="When a redesign breaks extraction, an AI repair is proposed — then verified against contract invariants before deploy." />
          <Engine icon={Fingerprint} tone="violet" title="Tamper-Evident Evidence" body="Every field carries a SHA-256 hash; the whole contract is sealed, so any change is detectable." />
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-8">
        <SectionHead kicker="How it works" title="Observe → Compile → Verify → Heal → Diff" desc="" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Step n={1} title="Observe" body="Traverse the public journey and capture each displayed price." />
          <Step n={2} title="Compile" body="Fold observations into one canonical Deal Contract." />
          <Step n={3} title="Verify" body="Run 11 integrity checks; flag wrong-but-valid drift." />
          <Step n={4} title="Heal" body="Propose a repair, verify the preview, then deploy." />
          <Step n={5} title="Diff" body="Compare contracts over time to expose changed promises." />
        </div>
      </section>

      {/* Trust callout */}
      <section className="glass-card rounded-2xl border border-white/10 p-8 md:p-10 grid md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 space-y-2">
          <h2 className="text-2xl font-bold text-white">Evidence you can verify, not just view</h2>
          <p className="text-gray-400 max-w-xl">
            Captured text, source URL, DOM path, journey step and timestamp are hashed with SHA-256. The entire Deal
            Contract is sealed with its own hash, so tampering with any claim is provable — and detectable.
          </p>
        </div>
        <div className="flex md:justify-end gap-6">
          <Metric icon={Hash} label="Per-field" value="SHA-256" />
          <Metric icon={Clock} label="Every claim" value="Timestamped" />
        </div>
      </section>

      {/* CTA */}
      <section className="text-center space-y-5 pb-8">
        <h2 className="text-3xl font-bold text-white">See the whole loop in two minutes</h2>
        <p className="text-gray-400 max-w-lg mx-auto">
          Observe a journey, break the extraction, heal it with a verified repair, and diff the promise — all on live
          engine data.
        </p>
        <Link
          href="/console"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium px-6 py-3 transition-colors"
        >
          Launch the Console <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  )
}

function SectionHead({ kicker, title, desc }: { kicker: string; title: string; desc: string }) {
  return (
    <div className="space-y-2 max-w-2xl">
      <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-violet-400">{kicker}</div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white">{title}</h2>
      {desc && <p className="text-gray-400">{desc}</p>}
    </div>
  )
}

function Problem({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="w-8 h-1 rounded-full bg-rose-500/60 mb-3" />
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
    </div>
  )
}

const ENGINE_TONE: Record<string, string> = {
  violet: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  rose: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
}

function Engine({ icon: Icon, tone, title, body }: { icon: typeof FileText; tone: string; title: string; body: string }) {
  return (
    <div className="glass-card glass-card-hover rounded-2xl border border-white/10 p-5">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${ENGINE_TONE[tone]}`}>
        <Icon size={18} />
      </div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
    </div>
  )
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="text-2xl font-black font-mono text-violet-400/40">{String(n).padStart(2, '0')}</div>
      <h3 className="text-white font-semibold mt-1">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed mt-1">{body}</p>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
        <Icon size={12} /> {label}
      </div>
      <div className="text-lg font-bold font-mono text-white mt-1">{value}</div>
    </div>
  )
}

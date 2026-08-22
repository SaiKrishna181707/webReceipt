import Link from 'next/link'
import { WebReceiptLogo } from '@/components/brand/webreceipt-logo'
import { SystemStatus } from './matrix-ui'

const ROUTES = [
  { label: 'Console', href: '/console' },
  { label: 'Mutation Lab', href: '/mutation-lab' },
  { label: 'Receipts', href: '/receipts' },
  { label: 'Docs', href: '/docs' },
]

/** The bottom of the home page: wordmark, routes, and runtime status. */
export function SystemFooter() {
  return (
    <footer className="relative !mt-0 border-t border-matrix-400/10 bg-transparent pt-10">
      <div className="mx-auto w-full px-0 pb-5">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <div className="inline-flex items-center rounded-[2px] border border-matrix-400/10 bg-black/30 px-3 py-2">
              <WebReceiptLogo size={32} />
            </div>

            <p className="mt-4 text-[13.5px] leading-relaxed text-void-200">
              A verifiable record of what a checkout promised — compiled into one canonical Deal Contract, checked
              against itself, and sealed field by field with SHA-256.
            </p>

            <p className="mt-4 font-mono text-[10.5px] leading-relaxed tracking-[0.1em] text-void-300">
              This interface runs against the simulated collector. The Bright Data adapter is exercised by the sponsor
              harness and the CLI runbook, not by these routes.
            </p>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:gap-16">
            <div>
              <div className="sys-label">Routes</div>
              <ul className="mt-3 space-y-2">
                {ROUTES.map((r) => (
                  <li key={r.href}>
                    <Link
                      href={r.href}
                      className="group inline-flex items-center font-mono text-[11px] uppercase tracking-[0.16em] text-void-200 transition-colors hover:text-matrix-300"
                    >
                      <span aria-hidden className="mr-1.5 text-matrix-400 opacity-0 transition-opacity group-hover:opacity-100">
                        &gt;
                      </span>
                      {r.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="sys-label">Status</div>
              <div className="mt-3 flex flex-col gap-2">
                <SystemStatus label="Channel" value="Secure" />
                <SystemStatus label="Contract" value="v1.1.0" tone="phosphor" live={false} />
                <SystemStatus label="Collector" value="Simulated" tone="void" live={false} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-matrix-400/10 pt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-void-400 sm:flex-row sm:items-center sm:justify-between">
          <span>WebReceipt · Proof of promise</span>
          <span>Built for WeMakeDevs · Into the Scrape-Verse</span>
        </div>
      </div>
    </footer>
  )
}

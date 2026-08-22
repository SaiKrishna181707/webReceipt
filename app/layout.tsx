import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { Navigation } from '@/components/navigation'
import ClickSpark from '@/components/effects/click-spark'
import { MatrixBackground } from '@/components/matrix/matrix-background'
import { BootIntro } from '@/components/matrix/boot-intro'

/* Both faces are self-hosted and preloaded at build time. They used to arrive
   via an `@import` at the top of globals.css, which is the worst case: an
   import inside a stylesheet is discovered only after that stylesheet parses,
   so first paint waited on a round trip to fonts.googleapis.com.

   Both are variable fonts, so no weight list is needed — the whole 300–800
   range comes down in one file. The CSS variables are what `globals.css` and
   `tailwind.config.ts` read; the generated family names are hashes, which is why
   nothing downstream may write a literal `font-family: Inter`. */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'WebReceipt — Proof of promise, sealed in code',
  description:
    'A self-healing evidence engine for the mutable web. Turn public purchase journeys into timestamped, tamper-evident Deal Contracts, catch semantic extraction drift, and diff commercial promises over time.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="construct-body relative min-h-screen bg-black text-void-100 selection:bg-matrix-500/35 selection:text-white">
        <a href="#main" className="skip-link">
          Skip to content
        </a>

        <MatrixBackground />
        <Navigation />

        {/* `tabIndex={-1}` makes this a focus target rather than a focus stop: the
            skip link above and the opening sequence both hand focus here, and
            neither can without it. `outline-none` because the ring belongs on the
            control that was activated, not on the whole page. */}
        <main id="main" tabIndex={-1} className="relative z-10 min-h-screen pt-16 outline-none">
          {/* Sparks on every click in the content region. The canvas is fixed and
              pointer-transparent, so it changes nothing about the layout or
              hit-testing below it. */}
          <ClickSpark className="min-h-full">{children}</ClickSpark>
        </main>

        <div className="relative z-10">
          <div id="footer-slot" />
        </div>

        <div className="crt-overlay" aria-hidden />
        <div className="crt-vignette" aria-hidden />

        <BootIntro />

        <Toaster
          theme="dark"
          position="bottom-right"
          richColors
          toastOptions={{ className: 'font-mono !rounded-[2px] !text-[12.5px]' }}
        />
      </body>
    </html>
  )
}

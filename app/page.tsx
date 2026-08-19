'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Home() {
  return (
    <main className="relative min-h-screen bg-black text-white selection:bg-theme-2-light selection:text-white">
      {/* Background Lighting Rays */}
      <div className="pointer-events-none absolute top-0 right-0 left-0 -z-10 isolate h-screen overflow-hidden" style={{ '--light-rays-color': 'var(--glow)' } as any}>
        <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black,black_60%,transparent)]">
          <div aria-hidden="true" className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(circle at 20% 15%, color-mix(in srgb, var(--light-rays-color) 45%, transparent), transparent 70%)' }}></div>
          <div aria-hidden="true" className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(circle at 80% 10%, color-mix(in srgb, var(--light-rays-color) 35%, transparent), transparent 75%)' }}></div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="overflow-hidden border-b border-white/10" id="about">
        <div className="box-border mx-auto w-full max-w-[1300px] px-5 lg:px-16 border-x border-white/10 border-dashed relative py-16 md:py-24 min-h-[75vh] flex flex-col justify-center">
          
          {/* Animated Background Cities (Simplified) */}
          <div className="pointer-events-none absolute right-2 top-2 z-20 flex flex-col items-end gap-2.5 sm:right-4 md:right-6 md:top-4">
            <div className="hidden flex-col gap-2.5 font-mono text-xs text-muted-foreground animate-fade-in-up md:flex md:text-sm">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full border-[1.5px] border-[#ec4899] bg-[#ec4899]/15"></span>
                <span>Cities where we host events</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#ec4899]"></span>
                <span>Where our builders are from</span>
              </div>
            </div>
          </div>

          <div className="pointer-events-none relative z-10">
            <div className="flex gap-3 items-start animate-fade-in-up">
              <span className="uppercase text-sm text-[#a855f7] tracking-wider font-mono">Build Cool Stuff. Ship Real Projects. Join the Community.</span>
            </div>
            
            <h1 className="max-w-4xl text-[2rem] sm:text-5xl md:text-[76px] font-bold tracking-tight mt-6 md:mt-8 leading-[1.1] animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              World's Most Engaging <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff4d4d] via-[#a855f7] to-[#ec4899]">Hackathons</span>
            </h1>
            
            <div className="pointer-events-auto flex flex-wrap items-center gap-4 mt-10 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <Link 
                className="group relative inline-flex items-center justify-center rounded-sm text-sm font-medium transition-all overflow-hidden bg-[#a855f7] text-white duration-300 hover:bg-[#9333ea] h-12 px-8"
                href="#hackathons"
              >
                <span className="relative z-10 font-bold uppercase tracking-wider">Events</span>
              </Link>
              <Link 
                className="group relative inline-flex items-center justify-center rounded-sm text-sm font-medium transition-all overflow-hidden bg-white/5 border border-white/10 text-white duration-300 hover:bg-white/10 h-12 px-8"
                href="#partner-with-us"
              >
                <span className="relative z-10 font-bold uppercase tracking-wider">For companies</span>
              </Link>
            </div>
            
            <div className="pointer-events-auto mt-12 flex w-fit items-stretch divide-x divide-[#a855f7]/25 rounded-xl border border-[#a855f7]/40 bg-black/70 backdrop-blur-md animate-fade-in-up" style={{ animationDelay: '450ms' }}>
              <div className="flex flex-col gap-1 px-5 py-3.5">
                <span className="font-mono text-xl font-bold leading-none text-[#a855f7] sm:text-2xl">200K+</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-gray-400 sm:text-xs font-semibold">Members</span>
              </div>
              <div className="flex flex-col gap-1 px-5 py-3.5">
                <span className="font-mono text-xl font-bold leading-none text-[#a855f7] sm:text-2xl">40+</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-gray-400 sm:text-xs font-semibold">Countries</span>
              </div>
              <div className="flex flex-col gap-1 px-5 py-3.5">
                <span className="font-mono text-xl font-bold leading-none text-[#a855f7] sm:text-2xl">11</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-gray-400 sm:text-xs font-semibold">AI Hubs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial / Impact Section */}
      <section className="border-b border-white/10">
        <div className="box-border mx-auto w-full max-w-[1300px] px-5 lg:px-16 border-x border-white/10 border-dashed py-16" aria-label="Partner impact testimonials">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-12">
            <div className="flex gap-3 items-center">
              <span className="uppercase text-sm text-[#a855f7] tracking-wider font-mono">01 / Impact</span>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <span className="whitespace-nowrap font-mono text-sm text-gray-400 tabular-nums">01 / 04</span>
              <div className="flex items-center gap-2">
                <button className="grid place-items-center w-10 h-10 rounded-sm border border-white/10 bg-black text-gray-400 transition-colors duration-200 hover:text-white hover:border-[#a855f7]">
                  <ChevronLeft size={18} />
                </button>
                <button className="grid place-items-center w-10 h-10 rounded-sm border border-white/10 bg-black text-gray-400 transition-colors duration-200 hover:text-white hover:border-[#a855f7]">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid">
            <figure className="flex flex-col gap-10">
              <blockquote className="max-w-4xl text-pretty text-2xl md:text-3xl font-medium leading-relaxed tracking-tight text-gray-100">
                “<span className="font-mono font-bold text-[#a855f7]">5,500+</span> participants and <span className="font-mono font-bold text-[#a855f7]">7,000+</span> API signups in a single hackathon. The energy from the community was unreal, and developers picked up Cerebras tech incredibly fast.”
              </blockquote>
              <figcaption className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10"></div>
                  <div>
                    <p className="text-base font-semibold tracking-tight text-white">Sarah Chieng</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-mono mt-1">Head of DevX, Cerebras Systems</p>
                  </div>
                </div>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="border-b border-white/10 overflow-hidden">
        <div className="box-border mx-auto w-full max-w-[1300px] px-5 lg:px-16 border-x border-white/10 border-dashed relative py-6">
          <p className="text-gray-400 text-sm">Trusted by <span className="font-mono font-bold text-[#a855f7] text-white">100+</span> leading enterprises and high growth startups.</p>
        </div>
        
        <div className="border-t border-white/10 relative bg-white/[0.02]">
          <div className="flex overflow-hidden py-8">
            <div className="flex animate-marquee whitespace-nowrap items-center min-w-full justify-around gap-16 px-8">
              {['GITHUB', 'META', 'AWS', 'OPENAI', 'ANTHROPIC', 'CEREBRAS', 'TOGETHER AI', 'CODERABBIT'].map((partner, i) => (
                <div key={i} className="text-2xl font-black tracking-tighter text-white/20 uppercase font-mono">
                  {partner}
                </div>
              ))}
            </div>
            <div className="flex animate-marquee whitespace-nowrap items-center min-w-full justify-around gap-16 px-8" aria-hidden="true">
              {['GITHUB', 'META', 'AWS', 'OPENAI', 'ANTHROPIC', 'CEREBRAS', 'TOGETHER AI', 'CODERABBIT'].map((partner, i) => (
                <div key={i} className="text-2xl font-black tracking-tighter text-white/20 uppercase font-mono">
                  {partner}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Access to App (Hidden entry for actual use) */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link href="/demo" className="bg-[#a855f7] hover:bg-[#9333ea] text-white px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all uppercase tracking-wider text-xs font-mono border border-white/20">
          Enter WebReceipt Demo
        </Link>
      </div>
    </main>
  )
}

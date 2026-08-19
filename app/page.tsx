'use client'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Zap, Shield, Globe, Clock, Users, BarChart3, Code, Database, Lock, FileText, Settings, Menu, X, Twitter, Linkedin, Github, Mail } from 'lucide-react'
import { useState } from 'react'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e17]/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center font-bold text-lg">
                WR
              </div>
              <span className="text-xl font-bold">WebReceipt</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-gray-300 hover:text-white transition-colors">Features</Link>
              <Link href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How it Works</Link>
              <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link>
              <Link href="#faq" className="text-gray-300 hover:text-white transition-colors">FAQ</Link>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/demo" className="text-gray-300 hover:text-white transition-colors">Demo</Link>
              <Link href="/scrapers/new" className="bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-2 rounded-full font-medium hover:opacity-90 transition-opacity">
                Get Started
              </Link>
            </div>

            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a0e17] border-t border-white/10 px-6 py-4">
            <div className="flex flex-col gap-4">
              <Link href="#features" className="text-gray-300 hover:text-white transition-colors">Features</Link>
              <Link href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How it Works</Link>
              <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link>
              <Link href="#faq" className="text-gray-300 hover:text-white transition-colors">FAQ</Link>
              <Link href="/demo" className="text-gray-300 hover:text-white transition-colors">Demo</Link>
              <Link href="/scrapers/new" className="bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-2 rounded-full font-medium text-center">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-block mb-6 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-medium">
              🚀 Web Evidence Terminal v2.0
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              We Make <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Web Evidence</span>
              <br />
              Simple & Reliable
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              Transform public online purchase journeys into timestamped, evidence-backed Deal Contracts with semantic integrity validation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/scrapers/new" className="bg-gradient-to-r from-purple-500 to-blue-500 px-8 py-4 rounded-full font-medium text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                Start Building <ArrowRight size={20} />
              </Link>
              <Link href="/demo" className="border border-white/20 px-8 py-4 rounded-full font-medium text-lg hover:bg-white/5 transition-colors">
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 px-6 border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-500 mb-8 text-sm uppercase tracking-wider">Trusted by forward-thinking teams</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50">
            <div className="text-2xl font-bold">Stripe</div>
            <div className="text-2xl font-bold">Shopify</div>
            <div className="text-2xl font-bold">Notion</div>
            <div className="text-2xl font-bold">Figma</div>
            <div className="text-2xl font-bold">Linear</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to capture, validate, and monitor web evidence at scale
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6 bg-gradient-to-b from-transparent to-purple-500/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From complexity to clarity in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-purple-500/20 mb-4">0{index + 1}</div>
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 right-0 w-1/2 h-0.5 bg-gradient-to-r from-purple-500 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Choose a plan that fits your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div key={index} className={`bg-white/5 border rounded-2xl p-8 ${plan.popular ? 'border-purple-500 relative' : 'border-white/10'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-400 mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-gray-400">/{plan.period}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle size={20} className="text-green-500" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-full font-medium transition-opacity ${plan.popular ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'border border-white/20 hover:bg-white/5'}`}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent to-blue-500/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Join thousands of teams building trust with WebReceipt
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-5 h-5 bg-yellow-500 rounded-full" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6">{testimonial.quote}</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center font-bold">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <div className="font-bold">{testimonial.name}</div>
                    <div className="text-gray-400 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-400">
              Everything you need to know about WebReceipt
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                  <span className="font-medium">{faq.question}</span>
                  <ChevronDown size={20} />
                </button>
                <div className="px-6 pb-4 text-gray-400">
                  {faq.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Web Evidence?
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Join thousands of teams building trust with WebReceipt
          </p>
          <Link href="/scrapers/new" className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 px-8 py-4 rounded-full font-medium text-lg hover:opacity-90 transition-opacity">
            Get Started Free <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center font-bold text-lg">
                  WR
                </div>
                <span className="text-xl font-bold">WebReceipt</span>
              </div>
              <p className="text-gray-400 text-sm">
                Transform web journeys into timestamped, evidence-backed contracts.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-white transition-colors">Demo</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter size={24} /></a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors"><Linkedin size={24} /></a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors"><Github size={24} /></a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors"><Mail size={24} /></a>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">© 2024 WebReceipt. All rights reserved.</p>
            <div className="flex gap-6 text-gray-400 text-sm">
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: <Shield size={24} className="text-white" />,
    title: "Semantic Integrity",
    description: "Validates contracts against 10+ critical checks including arithmetic, currency consistency, and evidence completeness."
  },
  {
    icon: <Zap size={24} className="text-white" />,
    title: "Real-time Monitoring",
    description: "Continuous monitoring of web journeys with instant alerts when terms change or prices diverge."
  },
  {
    icon: <Database size={24} className="text-white" />,
    title: "Evidence Storage",
    description: "Tamper-evident storage of screenshots, DOM snapshots, and extracted data with SHA-256 hashing."
  },
  {
    icon: <FileText size={24} className="text-white" />,
    title: "Contract Generation",
    description: "Automatically generates comprehensive Deal Contracts from web journey data with full provenance."
  },
  {
    icon: <BarChart3 size={24} className="text-white" />,
    title: "Analytics Dashboard",
    description: "Powerful analytics to track collection performance, validation results, and anomaly detection."
  },
  {
    icon: <Lock size={24} className="text-white" />,
    title: "Enterprise Security",
    description: "Bank-grade security with encryption, access controls, and compliance-ready audit trails."
  }
]

const steps = [
  {
    title: "Capture",
    description: "Our browser workers navigate web journeys, capturing every step, price, and term with full evidence."
  },
  {
    title: "Validate",
    description: "Semantic integrity checks verify that contracts are mathematically sound and evidence-backed."
  },
  {
    title: "Monitor",
    description: "Continuous monitoring detects changes and triggers alerts when promises are broken."
  }
]

const plans = [
  {
    name: "Starter",
    description: "Perfect for individuals and small projects",
    price: "$49",
    period: "month",
    features: [
      "100 contracts/month",
      "Basic validation",
      "7-day evidence retention",
      "Community support",
      "1 user seat"
    ]
  },
  {
    name: "Professional",
    description: "Ideal for growing teams and businesses",
    price: "$199",
    period: "month",
    popular: true,
    features: [
      "1,000 contracts/month",
      "Advanced validation",
      "30-day evidence retention",
      "Priority support",
      "5 user seats",
      "API access"
    ]
  },
  {
    name: "Enterprise",
    description: "For large-scale operations",
    price: "Custom",
    period: "",
    features: [
      "Unlimited contracts",
      "Custom validation rules",
      "Unlimited evidence retention",
      "24/7 dedicated support",
      "Unlimited user seats",
      "Custom integrations",
      "SLA guarantee"
    ]
  }
]

const testimonials = [
  {
    name: "Sarah Chen",
    role: "CTO, TechStart Inc",
    quote: "WebReceipt transformed how we monitor our competitors. The semantic integrity checks have saved us from countless pricing disputes."
  },
  {
    name: "Michael Park",
    role: "Operations Director, RetailFlow",
    quote: "The evidence capture is incredible. We now have indisputable proof of what was promised versus what was delivered."
  },
  {
    name: "Emily Rodriguez",
    role: "Lead Developer, DataDriven Co",
    quote: "Finally, a tool that understands web data needs to be trustworthy. The API is excellent and the documentation is comprehensive."
  }
]

const faqs = [
  {
    question: "What is WebReceipt?",
    answer: "WebReceipt is a web evidence terminal that captures, validates, and monitors online purchase journeys, transforming them into timestamped, evidence-backed Deal Contracts."
  },
  {
    question: "How does semantic integrity validation work?",
    answer: "Our system runs 10+ deterministic checks including arithmetic validation, currency consistency, evidence completeness, and journey monotonicity to ensure contracts are mathematically sound."
  },
  {
    question: "What evidence is captured?",
    answer: "We capture screenshots, DOM snapshots, extracted text, source URLs, timestamps, and generate SHA-256 hashes for tamper detection."
  },
  {
    question: "Can I integrate WebReceipt with my existing systems?",
    answer: "Yes, we provide a comprehensive REST API and webhooks for seamless integration with your existing workflows and systems."
  },
  {
    question: "How secure is my data?",
    answer: "We use bank-grade encryption, role-based access controls, and maintain full audit trails. Your data is stored in secure, compliant data centers."
  },
  {
    question: "Do you offer a free trial?",
    answer: "Yes, we offer a 14-day free trial with full access to all features. No credit card required to start."
  }
]

function ChevronDown({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  )
}
'use client'
import { useState } from 'react'
import { Search, MessageCircle, Book, Code, Settings, ChevronRight, ExternalLink, Star } from 'lucide-react'
import { toast } from 'sonner'

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const categories = [
    { id: 'all', name: 'All', icon: Book },
    { id: 'getting-started', name: 'Getting Started', icon: Star },
    { id: 'contracts', name: 'Contracts', icon: Settings },
    { id: 'evidence', name: 'Evidence', icon: Code },
    { id: 'billing', name: 'Billing', icon: MessageCircle },
  ]

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="text-center py-6 border-b border-white/[0.08]">
        <div className="inline-flex items-center gap-2 text-violet-400 text-xs font-mono tracking-wider uppercase mb-2">
          <span>KNOWLEDGE BASE & SUPPORT</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">How can we help?</h1>
        <p className="text-gray-400 text-sm">Search our self-healing web evidence guides or browse categories below</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search for answers, contract rules, CLI commands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm font-medium"
        />
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === category.id
                  ? 'bg-violet-600/30 text-white border border-violet-500/40 shadow-sm shadow-violet-500/20'
                  : 'bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] border border-transparent'
              }`}
            >
              <Icon size={14} />
              <span>{category.name}</span>
            </button>
          )
        })}
      </div>

      {/* FAQ Results */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-gray-400">Try different keywords or browse our categories</p>
          </div>
        ) : (
          filteredFaqs.map((faq, index) => (
            <div
              key={index}
              className="glass-card border border-white/[0.08] rounded-2xl overflow-hidden transition-all hover:border-violet-500/30"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between"
              >
                <span className="font-medium text-white text-sm">{faq.question}</span>
                <ChevronRight
                  size={18}
                  className={`text-gray-400 transition-transform ${
                    expandedFaq === index ? 'rotate-90 text-violet-400' : ''
                  }`}
                />
              </button>
              {expandedFaq === index && (
                <div className="px-6 pb-4 text-gray-300 text-xs leading-relaxed animate-fade-in-up">
                  {faq.answer}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Quick Links */}
      <div className="mt-12 grid md:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-6 border border-violet-500/30">
          <div className="flex items-center gap-3 mb-3">
            <MessageCircle className="text-violet-400" />
            <h3 className="font-semibold text-white">Still need help?</h3>
          </div>
          <p className="text-gray-400 text-xs mb-4">Our engineering support team is available 24/7 for custom collector integrations.</p>
          <button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition-opacity">
            Contact Support
          </button>
        </div>
        
        <div className="glass-card border border-white/[0.08] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Book className="text-cyan-400" />
            <h3 className="font-semibold text-white">Explore Documentation</h3>
          </div>
          <p className="text-gray-400 text-xs mb-4">Detailed guides, CLI reference, and contract schemas for developers.</p>
          <a
            href="/docs"
            className="w-full border border-white/20 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-white/5 transition-colors inline-flex items-center justify-center gap-2"
          >
            <span>View API Docs</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => toast.info('Support chat is active. Feel free to explore docs or demo self-healing!')}
        className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-violet-600/30 hover:scale-105 transition-transform z-40 text-white"
        aria-label="Support Chat"
      >
        <MessageCircle size={20} />
      </button>
    </div>
  )
}

const faqs = [
  {
    category: 'getting-started',
    question: 'How do I create my first contract?',
    answer: 'To create your first contract, navigate to the Contracts page and click "New Contract". Our browser worker will guide you through capturing a web journey step by step.',
  },
  {
    category: 'getting-started',
    question: 'What is semantic integrity validation?',
    answer: 'Semantic integrity validation runs 10+ deterministic checks to ensure contracts are mathematically sound. This includes arithmetic validation, currency consistency, evidence completeness, and journey monotonicity.',
  },
  {
    category: 'contracts',
    question: 'How are contracts validated?',
    answer: 'Contracts are validated automatically when created. Our system checks that the final total matches the expected calculation (base + fees + taxes - discounts), that all currencies are consistent, and that critical fields have supporting evidence.',
  },
  {
    category: 'contracts',
    question: 'Can I compare contract versions?',
    answer: 'Yes! WebReceipt automatically tracks contract versions. You can compare any two versions to see exactly what changed - prices, fees, terms, or inclusions.',
  },
  {
    category: 'evidence',
    question: 'What evidence is captured?',
    answer: 'We capture screenshots, DOM snapshots, extracted text, source URLs, timestamps, and generate SHA-256 hashes for tamper detection. All evidence is stored securely and can be accessed anytime.',
  },
  {
    category: 'evidence',
    question: 'How long is evidence retained?',
    answer: 'Evidence retention depends on your plan. Starter plans keep evidence for 7 days, Professional for 30 days, and Enterprise plans offer unlimited retention.',
  },
  {
    category: 'billing',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for Enterprise customers.',
  },
  {
    category: 'billing',
    question: 'Can I change my plan later?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we prorate charges for upgrades.',
  },
]
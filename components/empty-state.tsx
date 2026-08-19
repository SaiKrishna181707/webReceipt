'use client'
import { Plus, FileText, Search, Shield, AlertCircle } from 'lucide-react'

interface EmptyStateProps {
  type: 'contracts' | 'evidence' | 'search' | 'error'
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ type, title, description, action }: EmptyStateProps) {
  const configs = {
    contracts: {
      icon: <FileText size={48} className="text-purple-400" />,
      defaultTitle: 'No contracts yet',
      defaultDescription: 'Create your first evidence-backed contract to start tracking web promises.',
      defaultAction: { label: 'Create Contract', onClick: () => {} },
    },
    evidence: {
      icon: <Shield size={48} className="text-blue-400" />,
      defaultTitle: 'No evidence collected',
      defaultDescription: 'Evidence will appear here once you start monitoring web journeys.',
      defaultAction: undefined,
    },
    search: {
      icon: <Search size={48} className="text-gray-400" />,
      defaultTitle: 'No results found',
      defaultDescription: 'Try adjusting your search terms or filters.',
      defaultAction: undefined,
    },
    error: {
      icon: <AlertCircle size={48} className="text-red-400" />,
      defaultTitle: 'Something went wrong',
      defaultDescription: 'An error occurred while loading your data. Please try again.',
      defaultAction: { label: 'Retry', onClick: () => window.location.reload() },
    },
  }

  const config = configs[type]
  const displayTitle = title || config.defaultTitle
  const displayDescription = description || config.defaultDescription
  const displayAction = action || config.defaultAction

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative bg-white/5 rounded-full p-8 border border-white/10">
          {config.icon}
        </div>
      </div>
      
      <h3 className="text-2xl font-bold mb-2">{displayTitle}</h3>
      <p className="text-gray-400 max-w-md mb-8">{displayDescription}</p>
      
      {displayAction && (
        <button
          onClick={displayAction.onClick}
          className="group bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-3 rounded-full font-medium hover:opacity-90 transition-all hover:scale-105 flex items-center gap-2"
        >
          <Plus size={20} />
          {displayAction.label}
        </button>
      )}
    </div>
  )
}
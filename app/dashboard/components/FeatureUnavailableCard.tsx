'use client'

interface FeatureUnavailableCardProps {
  title: string
  description: string
  icon?: string
  upgradeUrl?: string
}

export default function FeatureUnavailableCard({ 
  title, 
  description, 
  icon: _icon = "🔒",
  upgradeUrl = '/dashboard?tab=profile&subtab=plans'
}: FeatureUnavailableCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-4">
        <div className="text-blue-500">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 mb-3">
            {description}
          </p>
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Current plan: <span className="font-medium">Check your plan settings</span>
            </div>
            <button 
              onClick={() => window.location.href = upgradeUrl}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { useUserPlan } from '@/hooks/useUserPlan'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  featureName: string
  currentPlan?: {
    name: string
    type: string
    maxProjects: number
    currentProjects: number
  }
}

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  featureName,
  currentPlan 
}: UpgradeModalProps) {
  useUserPlan() // Get plan info if needed in the future

  if (!isOpen) return null

  const handleUpgrade = () => {
    onClose()
    // Navigate to profile/upgrade page
    window.location.href = '/dashboard?tab=profile'
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-lg  max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black">{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Current Plan Info */}
        {currentPlan && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Current Plan: {currentPlan.name}
                </div>
                <div className="text-xs text-gray-600">
                  {currentPlan.currentProjects} / {currentPlan.maxProjects === -1 ? 'Unlimited' : currentPlan.maxProjects} projects used
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                currentPlan.type === 'Starter' 
                  ? 'bg-green-100 text-green-700' 
                  : currentPlan.type === 'Growth' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {currentPlan.type}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4">
          <div className="space-y-4">
            {/* Feature Description */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">
                {featureName === 'full_site_crawl' ? 'Full Site Crawling Features:' : 'Upgraded Features:'}
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {featureName === 'full_site_crawl' ? (
                  <>
                    <li>• Crawl entire website automatically</li>
                    <li>• Discover all pages and subpages</li>
                    <li>• Comprehensive site-wide analysis</li>
                    <li>• Advanced SEO insights</li>
                  </>
                ) : (
                  <>
                    <li>• Create more projects</li>
                    <li>• Advanced audit features</li>
                    <li>• Priority support</li>
                    <li>• Enhanced analytics</li>
                  </>
                )}
              </ul>
            </div>

            {/* Available Plans */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">G</span>
                  </div>
                  <div>
                    <div className="font-medium text-black">Growth Plan</div>
                    <div className="text-sm text-gray-600">Full site crawling + advanced features</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-black">$29.99/month</div>
                  <div className="text-xs text-gray-500">Up to 5 projects</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">S</span>
                  </div>
                  <div>
                    <div className="font-medium text-black">Scale Plan</div>
                    <div className="text-sm text-gray-600">Unlimited everything + priority support</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-black">$99.99/month</div>
                  <div className="text-xs text-gray-500">Up to 50 projects</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handleUpgrade}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

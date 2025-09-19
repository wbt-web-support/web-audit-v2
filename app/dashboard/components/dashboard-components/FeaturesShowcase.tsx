'use client'

import { motion } from 'framer-motion'

interface Feature {
  id: number
  name: string
  description: string
  icon: string
  category: 'Performance' | 'SEO' | 'Security' | 'Accessibility'
}

interface FeaturesShowcaseProps {
  features: Feature[]
}

export default function FeaturesShowcase({ features }: FeaturesShowcaseProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
    >
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg mr-3">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Audit Features</h2>
              <p className="text-gray-600 text-sm">Comprehensive web audit capabilities</p>
            </div>
          </div>
          <button className="text-gray-600 hover:text-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.slice(0, 6).map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="group bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
            >
              <div className="flex items-start mb-4">
                <div className="p-3 bg-gray-100 rounded-lg mr-4 group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {feature.category === 'Performance' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    )}
                    {feature.category === 'SEO' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    )}
                    {feature.category === 'Security' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    )}
                    {feature.category === 'Accessibility' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    )}
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{feature.name}</h3>
                  <span className="inline-block text-xs px-3 py-1 rounded-full font-medium mt-2 bg-gray-100 text-gray-700">
                    {feature.category}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors group-hover:underline">
                  Learn More →
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg">
              Explore All Features
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

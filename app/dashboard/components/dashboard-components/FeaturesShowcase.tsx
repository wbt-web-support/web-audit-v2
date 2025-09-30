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
      className="bg-white border border-gray-200 rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-black">Audit Features</h2>
            <p className="text-gray-600 text-sm">Comprehensive web audit capabilities</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.slice(0, 6).map((feature, index) => (
            <motion.div
              key={feature.id}
              className="bg-white border border-gray-200 rounded-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1, ease: "easeOut" }}
            >
              <div className="mb-4">
                <h3 className="text-base font-semibold text-black mb-2">{feature.name}</h3>
                <span className="inline-block text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                  {feature.category}
                </span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{feature.description}</p>
              <button className="text-blue-600 text-sm font-medium">
                Learn More →
              </button>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <button className="bg-blue-600 text-white px-6 py-3 rounded font-medium">
              Explore All Features
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

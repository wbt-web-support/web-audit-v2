'use client'

import { useState, useEffect } from 'react'

interface ModernLoaderProps {
  projectName?: string
  totalPages?: number
  currentPage?: number
  isScraping?: boolean
}

export default function ModernLoader({ 
  projectName = 'Website', 
  totalPages = 0, 
  currentPage = 0,
  isScraping = false
}: ModernLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [, setProgress] = useState(0)

  const steps = [
    { id: 'pages', label: 'Scanning Pages', icon: '📄' },
    { id: 'images', label: 'Analyzing Images', icon: '🖼️' },
    { id: 'links', label: 'Checking Links', icon: '🔗' },
    { id: 'technologies', label: 'Detecting Technical', icon: '⚙️' },
    { id: 'performance', label: 'Measuring Performance', icon: '⚡' },
    { id: 'cms', label: 'Identifying CMS', icon: '🏗️' }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [steps.length])

  useEffect(() => {
    if (totalPages > 0 && currentPage > 0) {
      setProgress(Math.min((currentPage / totalPages) * 100, 100))
    }
  }, [totalPages, currentPage])

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Skeleton Background */}
      <div className="absolute inset-0 animate-pulse">
        <div className="space-y-6 p-6">
          {/* Header Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-8 bg-gray-200 rounded w-64"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>

          {/* Filters Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <div className="h-10 bg-gray-200 rounded w-64"></div>
              <div className="h-10 bg-gray-200 rounded w-48"></div>
              <div className="h-10 bg-gray-200 rounded w-48"></div>
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center">
          

          {/* Current Step */}
          <div className="mb-6">
            <div className="text-4xl mb-2 text-gray-700">
              {steps[currentStep].icon}
            </div>
            <div className="text-lg font-semibold text-gray-900 mb-1">
              {steps[currentStep].label}
            </div>
            <div className="text-sm text-gray-600">
              {isScraping ? 'Scraping' : 'Analyzing'} {projectName}...
            </div>
          </div>

         
        

          {/* Animated Dots */}
          <div className="flex justify-center space-x-1 mt-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-gray-600 animate-pulse"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

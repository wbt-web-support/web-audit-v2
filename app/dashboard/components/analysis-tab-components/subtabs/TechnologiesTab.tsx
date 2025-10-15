'use client'

import { useState, useEffect } from 'react'
import { AuditProject } from '@/types/audit'
import Image from 'next/image'
import { detectTechnologiesFromHTML, categorizeTechnologies, getTechnologyStats, DetectedTechnology } from '@/lib/technology-detector'

interface TechnologiesTabProps {
  project: AuditProject
  htmlContent?: string
  headers?: Record<string, string>
  cookies?: string[]
}

interface Technology {
  name: string
  version?: string | null
  category?: string
  confidence?: number
  detection_method?: string
  description?: string | null
  website?: string | null
  icon?: string | null
}

interface TechnologyIconProps {
  tech: Technology | DetectedTechnology
  className?: string
}

// Technology icon fallback component
const TechnologyIcon = ({ tech, className = "w-8 h-8" }: TechnologyIconProps) => {
  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') {
      return '??'
    }
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'javascript': 'bg-blue-100 text-blue-800',
      'css': 'bg-blue-200 text-blue-900',
      'html': 'bg-blue-300 text-blue-900',
      'framework': 'bg-blue-100 text-blue-800',
      'library': 'bg-blue-200 text-blue-900',
      'database': 'bg-blue-300 text-blue-900',
      'server': 'bg-blue-100 text-blue-800',
      'analytics': 'bg-blue-200 text-blue-900',
      'cms': 'bg-blue-300 text-blue-900',
      'ecommerce': 'bg-blue-100 text-blue-800',
      'detected': 'bg-blue-100 text-blue-800',
      'unknown': 'bg-blue-100 text-blue-800'
    }
    return colors[category?.toLowerCase() || 'unknown'] || colors['detected']
  }

  if (tech.icon) {
    return (
      <div className={`${className} rounded-lg flex items-center justify-center bg-white border border-gray-200 `}>
        <Image 
          src={tech.icon} 
          alt={tech.name || 'Technology'}
          width={24}
          height={24}
          className="w-6 h-6 object-contain"
          onError={(e) => {
            // Hide the image and show fallback
            e.currentTarget.style.display = 'none'
            const parent = e.currentTarget.parentElement
            if (parent) {
              parent.innerHTML = `
                <div class="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
                  <span class="text-xs font-semibold text-slate-600">${getInitials(tech.name || 'Unknown')}</span>
                </div>
              `
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className={`${className} rounded-lg flex items-center justify-center bg-white border border-gray-200 `}>
      <div className={`w-6 h-6 rounded flex items-center justify-center ${getCategoryColor(tech.category || 'unknown')}`}>
        <span className="text-xs font-semibold">{getInitials(tech.name || 'Unknown')}</span>
      </div>
    </div>
  )
}

export default function TechnologiesTab({ project, htmlContent, headers, cookies }: TechnologiesTabProps) {
  const [detectedTechnologies, setDetectedTechnologies] = useState<DetectedTechnology[]>([])
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectionError, setDetectionError] = useState<string | null>(null)

  // HTML-based technology detection
  useEffect(() => {
    console.log('TechnologiesTab - htmlContent received:', htmlContent ? `${htmlContent.length} chars` : 'none')
    console.log('TechnologiesTab - headers:', headers)
    console.log('TechnologiesTab - cookies:', cookies)
    
    if (htmlContent && htmlContent.length > 0) {
      console.log('TechnologiesTab - Starting HTML detection...')
      setIsDetecting(true)
      setDetectionError(null)
      
      try {
        const detected = detectTechnologiesFromHTML(htmlContent, headers, cookies)
        console.log('TechnologiesTab - Detected technologies:', detected)
        setDetectedTechnologies(detected)
      } catch (error) {
        console.error('Error detecting technologies:', error)
        setDetectionError('Failed to detect technologies from HTML content')
      } finally {
        setIsDetecting(false)
      }
    } else {
      console.log('TechnologiesTab - No HTML content available for detection')
      // Test with sample HTML if no content is provided
      const testHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test</title>
          <link rel="stylesheet" href="bootstrap.min.css">
          <script src="jquery.min.js"></script>
        </head>
        <body>
          <div class="text-center bg-blue-500">Test</div>
          <script>gtag('config', 'GA_MEASUREMENT_ID');</script>
        </body>
        </html>
      `
      console.log('TechnologiesTab - Testing with sample HTML...')
      try {
        const testDetected = detectTechnologiesFromHTML(testHtml)
        console.log('TechnologiesTab - Test detection result:', testDetected)
        setDetectedTechnologies(testDetected)
      } catch (error) {
        console.error('Test detection failed:', error)
      }
    }
  }, [htmlContent, headers, cookies])

  // Get technologies from the processed project data first, then fallback to raw data
  let technologies = null
  let isSummaryData = false

  // Get technology statistics
  const stats = getTechnologyStats(detectedTechnologies)
  const categorizedTechnologies = categorizeTechnologies(detectedTechnologies)
  const hasDetectedTechnologies = detectedTechnologies.length > 0

  return (
    <div className="space-y-6">
      {/* HTML Detection Status */}
      {htmlContent && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-sm font-medium text-blue-800">HTML Analysis</span>
            </div>
            {isDetecting ? (
              <div className="flex items-center text-blue-600">
                <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">Detecting...</span>
              </div>
            ) : hasDetectedTechnologies ? (
              <span className="text-sm text-blue-600 font-medium">
                {detectedTechnologies.length} technologies detected
              </span>
            ) : detectionError ? (
              <span className="text-sm text-red-600">Detection failed</span>
            ) : (
              <span className="text-sm text-gray-500">No technologies detected</span>
            )}
          </div>
          {detectionError && (
            <p className="text-sm text-red-600 mt-2">{detectionError}</p>
          )}
        </div>
      )}

      {/* Show detected technologies from HTML */}
      {hasDetectedTechnologies && (
        <>
          {/* Technology Statistics */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detection Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalTechnologies}</div>
                <div className="text-sm text-gray-500">Technologies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.categoriesCount}</div>
                <div className="text-sm text-gray-500">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.highConfidenceCount}</div>
                <div className="text-sm text-gray-500">High Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{Math.round(stats.averageConfidence * 100)}%</div>
                <div className="text-sm text-gray-500">Avg Confidence</div>
              </div>
            </div>
          </div>

          {/* Technologies by Category */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Technology Stack</h3>
              <div className="text-sm text-gray-500">
                {Object.keys(categorizedTechnologies).length} categories
              </div>
            </div>
            
            <div className="space-y-6">
              {Object.entries(categorizedTechnologies).map(([category, techs]) => (
                <div key={category} className="bg-white rounded-xl border border-gray-200">
                  <div className="p-6 border-b border-gray-100">
                    <h4 className="text-lg font-semibold text-gray-900 capitalize flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      {category.replace(/_/g, ' ')}
                      <span className="ml-2 text-sm font-normal text-gray-500">({techs.length})</span>
                    </h4>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {techs.map((tech: DetectedTechnology, index: number) => (
                        <div key={index} className="group bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all duration-200">
                          <div className="flex items-center space-x-3">
                            <TechnologyIcon tech={tech} className="w-10 h-10 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-900 truncate">{tech.name}</h5>
                              {tech.version && (
                                <p className="text-sm text-gray-500">v{tech.version}</p>
                              )}
                              <div className="flex items-center mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  tech.confidence >= 0.8 ? 'bg-green-100 text-green-700' :
                                  tech.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {Math.round(tech.confidence * 100)}%
                                </span>
                                <span className="ml-2 text-xs text-gray-500 capitalize">
                                  {tech.detection_method.replace(/_/g, ' ')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Show message if no technologies found */}
      {!hasDetectedTechnologies && !isDetecting && !detectionError && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl text-gray-400">🔍</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No technologies detected</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            We couldn&apos;t identify any technologies in the HTML content. This might be due to the site&apos;s structure or detection limitations.
          </p>
        </div>
      )}
    </div>
  )
}

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
  tech: Technology
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

  // First, try to get processed technologies from the project
  if (project.technologies && Array.isArray(project.technologies)) {
    technologies = project.technologies
    isSummaryData = false
  }
  // If no processed technologies, try to get from summary data
  else if (project.scraping_data?.summary?.technologies && Array.isArray(project.scraping_data.summary.technologies)) {
    const rawTechnologies = project.scraping_data.summary.technologies
    
    // Convert simple string array to technology objects
    technologies = rawTechnologies.map((tech: string | Technology): Technology => {
      if (typeof tech === 'string') {
        return {
          name: tech,
          version: null,
          category: 'detected',
          confidence: 0.9,
          detection_method: 'summary',
          description: null,
          website: null,
          icon: null
        }
      }
      return tech
    })
    isSummaryData = true
  }
  // If no summary data, try extracted data
  else if (project.scraping_data?.extractedData?.technologies && Array.isArray(project.scraping_data.extractedData.technologies)) {
    const rawTechnologies = project.scraping_data.extractedData.technologies
    
    // Convert simple string array to technology objects
    technologies = rawTechnologies.map((tech: string | Technology): Technology => {
      if (typeof tech === 'string') {
        return {
          name: tech,
          version: null,
          category: 'detected',
          confidence: 0.9,
          detection_method: 'extracted_data',
          description: null,
          website: null,
          icon: null
        }
      }
      return tech
    })
    isSummaryData = false
  }

  // Combine existing technologies with newly detected ones
  const allTechnologies = [...(technologies || []), ...detectedTechnologies]
  const hasExistingTechnologies = technologies && technologies.length > 0
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

      {/* Show existing technologies if available */}
      {hasExistingTechnologies ? (
        <>
          {/* Technologies by Category */}
          {project.technologies_metadata?.technologies_by_category ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Technology Stack</h3>
                <div className="text-sm text-gray-500">
                  {Object.keys(project.technologies_metadata.technologies_by_category).length} categories
                </div>
              </div>
              
              <div className="space-y-6">
                {Object.entries(project.technologies_metadata.technologies_by_category).map(([category, techs]) => (
                  <div key={category} className="bg-white rounded-xl border border-gray-200 ">
                    <div className="p-6 border-b border-gray-100">
                      <h4 className="text-lg font-semibold text-gray-900 capitalize flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        {category.replace(/_/g, ' ')}
                        <span className="ml-2 text-sm font-normal text-gray-500">({(techs as Technology[]).length})</span>
                      </h4>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(techs as Technology[]).map((tech: Technology, index: number) => (
                          <div key={index} className="group bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all duration-200">
                            <div className="flex items-center space-x-3">
                              <TechnologyIcon tech={tech} className="w-10 h-10 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-gray-900 truncate">{tech.name || 'Unknown Technology'}</h5>
                                {tech.version && (
                                  <p className="text-sm text-gray-500">v{tech.version}</p>
                                )}
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
          ) : (
            // Fallback: Display raw technologies if no processed metadata
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Detected Technologies</h3>
                  <p className="text-sm text-gray-500 mt-1">{technologies.length} technologies found</p>
                </div>
                {isSummaryData && (
                  <div className="flex items-center text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Basic detection
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {technologies.map((tech: Technology, index: number) => (
                  <div key={index} className="group bg-white rounded-xl border border-gray-200  hover: transition-all duration-200 hover:border-gray-300">
                    <div className="p-6">
                      <div className="flex items-start space-x-4">
                        <TechnologyIcon tech={tech} className="w-12 h-12 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{tech.name || 'Unknown Technology'}</h4>
                          {tech.version && (
                            <p className="text-sm text-gray-500 mt-1">v{tech.version}</p>
                          )}
                          {tech.detection_method === 'summary' && (
                            <span className="inline-flex items-center mt-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Summary
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            (tech.confidence || 0.8) >= 0.8 ? 'bg-blue-500' :
                            (tech.confidence || 0.8) >= 0.5 ? 'bg-blue-400' :
                            'bg-blue-300'
                          }`}></div>
                          <span className="text-xs text-gray-500">Confidence</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (tech.confidence || 0.8) >= 0.8 ? 'bg-blue-100 text-blue-700' :
                          (tech.confidence || 0.8) >= 0.5 ? 'bg-blue-200 text-blue-800' :
                          'bg-blue-300 text-blue-900'
                        }`}>
                          {Math.round((tech.confidence || 0.8) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* Show newly detected technologies from HTML */}
      {hasDetectedTechnologies && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">HTML-Detected Technologies</h3>
              <p className="text-sm text-gray-500 mt-1">{detectedTechnologies.length} technologies found from HTML analysis</p>
            </div>
            <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Live Detection
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {detectedTechnologies.map((tech: DetectedTechnology, index: number) => (
              <div key={`detected-${index}`} className="group bg-white rounded-xl border border-gray-200 hover:transition-all duration-200 hover:border-gray-300">
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <TechnologyIcon tech={tech} className="w-12 h-12 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{tech.name || 'Unknown Technology'}</h4>
                      {tech.version && (
                        <p className="text-sm text-gray-500 mt-1">v{tech.version}</p>
                      )}
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="inline-flex items-center text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {tech.detection_method}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">{tech.category}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        tech.confidence >= 0.8 ? 'bg-green-500' :
                        tech.confidence >= 0.5 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}></div>
                      <span className="text-xs text-gray-500">Confidence</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tech.confidence >= 0.8 ? 'bg-green-100 text-green-700' :
                      tech.confidence >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {Math.round(tech.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show message if no technologies found at all */}
      {!hasExistingTechnologies && !hasDetectedTechnologies && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl text-gray-400">🔍</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sorry, we can&apos;t detect any technologies</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            We couldn&apos;t identify any technologies on this website. This might be due to the site&apos;s structure or detection limitations.
          </p>
        </div>
      )}
    </div>
  )
}

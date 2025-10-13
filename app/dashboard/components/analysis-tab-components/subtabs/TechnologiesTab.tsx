'use client'

import { AuditProject } from '@/types/audit'
import Image from 'next/image'

interface TechnologiesTabProps {
  project: AuditProject
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

export default function TechnologiesTab({ project }: TechnologiesTabProps) {
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

  return (
    <div className="space-y-6">
      {technologies && technologies.length > 0 ? (
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
      ) : (
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

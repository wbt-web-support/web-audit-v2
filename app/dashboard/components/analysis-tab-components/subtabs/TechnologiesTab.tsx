'use client'

import { AuditProject } from '@/types/audit'

interface TechnologiesTabProps {
  project: AuditProject
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
    technologies = rawTechnologies.map((tech: any) => {
      if (typeof tech === 'string') {
        return {
          name: tech,
          version: null,
          category: 'unknown',
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
    technologies = rawTechnologies.map((tech: any) => {
      if (typeof tech === 'string') {
        return {
          name: tech,
          version: null,
          category: 'unknown',
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
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">By Category</h4>
              <div className="space-y-4">
                {Object.entries(project.technologies_metadata.technologies_by_category).map(([category, techs]: [string, any]) => (
                  <div key={category} className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-800 mb-3 capitalize">{category}</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {techs.map((tech: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                          <div className="flex items-center">
                            {tech.icon && (
                              <img 
                                src={tech.icon} 
                                alt={tech.name}
                                className="w-5 h-5 mr-2 rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            )}
                            <div>
                              <span className="font-medium text-gray-900">{tech.name}</span>
                              {tech.version && (
                                <span className="ml-2 text-gray-500 text-sm">v{tech.version}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Fallback: Display raw technologies if no processed metadata
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-700">Detected Technologies ({technologies.length})</h4>
                {isSummaryData && (
                  <div className="text-sm text-gray-500">
                    <span className="inline-flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Basic detection
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {technologies.map((tech: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      {tech.icon && (
                        <img 
                          src={tech.icon} 
                          alt={tech.name}
                          className="w-6 h-6 mr-3 rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      )}
                      <div>
                        <span className="font-medium text-gray-900">{tech.name}</span>
                        {tech.version && (
                          <span className="ml-2 text-gray-500 text-sm">v{tech.version}</span>
                        )}
                        {tech.detection_method === 'summary' && (
                          <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                            Summary
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      (tech.confidence || 0.8) >= 0.8 ? 'bg-green-100 text-green-800' :
                      (tech.confidence || 0.8) >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {Math.round((tech.confidence || 0.8) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-gray-600">No technologies detected</p>
        </div>
      )}
    </div>
  )
}

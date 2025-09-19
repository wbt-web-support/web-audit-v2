'use client'

import { AuditProject } from '@/types/audit'

interface TechnologiesSectionProps {
  project: AuditProject
}

export default function TechnologiesSection({ project }: TechnologiesSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Technologies Analysis</h3>
      {project.technologies && project.technologies.length > 0 ? (
        <div className="space-y-6">
          {/* Technologies by Category */}
          {project.technologies_metadata?.technologies_by_category && (
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">By Category</h4>
              <div className="space-y-4">
                {Object.entries(project.technologies_metadata.technologies_by_category).map(([category, techs]: [string, any]) => (
                  <div key={category} className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3 capitalize">{category} ({techs.length})</h5>
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
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tech.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                            tech.confidence >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {Math.round(tech.confidence * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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

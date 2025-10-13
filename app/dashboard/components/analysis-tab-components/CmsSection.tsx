'use client'

import { AuditProject } from '@/types/audit'

interface CmsSectionProps {
  project: AuditProject
}

export default function CmsSection({ project }: CmsSectionProps) {
  return (
    <div className="bg-white rounded-lg  border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">CMS Analysis</h3>
      {project.cms_detected ? (
        <div className="space-y-6">
          {/* CMS Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{project.cms_type || 'Unknown'}</div>
              <div className="text-sm text-gray-600">Type</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{project.cms_version || 'N/A'}</div>
              <div className="text-sm text-gray-600">Version</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{Math.round((project.cms_confidence || 0) * 100)}%</div>
              <div className="text-sm text-gray-600">Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{project.cms_plugins?.length || 0}</div>
              <div className="text-sm text-gray-600">Plugins</div>
            </div>
          </div>

          {/* CMS Plugins */}
          {project.cms_plugins && project.cms_plugins.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Detected Plugins</h4>
              <div className="space-y-2">
                {project.cms_plugins.map((plugin: { name: string; version?: string; active?: boolean; path?: string; description?: string; author?: string; confidence?: number; detection_method?: string }, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">{plugin.name}</span>
                      {plugin.version && (
                        <span className="ml-2 text-gray-500 text-sm">v{plugin.version}</span>
                      )}
                      {plugin.active && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500 text-sm">{plugin.author || 'Unknown'}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (plugin.confidence || 0) >= 0.8 ? 'bg-green-100 text-green-800' :
                        (plugin.confidence || 0) >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {Math.round((plugin.confidence || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CMS Themes */}
          {project.cms_themes && project.cms_themes.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Detected Themes</h4>
              <div className="space-y-2">
                {project.cms_themes.map((theme: { name: string; version?: string; active?: boolean; path?: string; description?: string; author?: string; confidence?: number; detection_method?: string }, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">{theme.name}</span>
                      {theme.version && (
                        <span className="ml-2 text-gray-500 text-sm">v{theme.version}</span>
                      )}
                      {theme.active && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Active
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (theme.confidence || 0) >= 0.8 ? 'bg-green-100 text-green-800' :
                      (theme.confidence || 0) >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {Math.round((theme.confidence || 0) * 100)}%
                    </span>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-gray-600">No CMS detected</p>
        </div>
      )}
    </div>
  )
}

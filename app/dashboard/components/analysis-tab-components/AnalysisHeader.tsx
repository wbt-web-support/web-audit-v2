'use client'

import { AuditProject } from '@/types/audit'

interface AnalysisHeaderProps {
  project: AuditProject
  activeSection: string
  onSectionChange: (section: string) => void
  onRefresh?: () => void
  isRefreshing?: boolean
  customTabs?: Array<{ id: string; name: string; icon: string }>
  pageTitle?: string
}

export default function AnalysisHeader({ project, activeSection, onSectionChange, onRefresh, isRefreshing, customTabs, pageTitle }: AnalysisHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed'
      case 'in_progress': return 'In Progress'
      case 'pending': return 'Pending'
      case 'failed': return 'Failed'
      default: return status
    }
  }

  const getProjectName = (siteUrl: string) => {
    try {
      const url = new URL(siteUrl)
      return url.hostname.replace('www.', '')
    } catch {
      return siteUrl
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {pageTitle || getProjectName(project.site_url)}
          </h1>
          <p className="text-gray-600">{project.site_url}</p>
        </div>
        <div className="flex items-center space-x-4">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          )}
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(project.status)}`}>
            {getStatusDisplayName(project.status)}
          </span>
          <div className="text-right">
            <div className={`text-2xl font-bold ${project.score >= 80 ? 'text-green-600' : project.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {project.score > 0 ? project.score : 'N/A'}
            </div>
            <div className="text-sm text-gray-500">/100</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
            {(customTabs || [
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'pages', name: 'Pages', icon: '📄' },
              { id: 'technologies', name: 'Technical', icon: '⚙️' },
              { id: 'cms', name: 'CMS', icon: '🏗️' },
              { id: 'performance', name: 'Performance', icon: '⚡' },
              { id: 'seo', name: 'SEO', icon: '🔍' },
              { id: 'images', name: 'Images', icon: '🖼️' },
              { id: 'links', name: 'Links', icon: '🔗' },
              
            ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSectionChange(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

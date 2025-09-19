'use client'

import { AuditProject } from '@/types/audit'

interface AnalysisHeaderProps {
  project: AuditProject
  activeSection: string
  onSectionChange: (section: string) => void
}

export default function AnalysisHeader({ project, activeSection, onSectionChange }: AnalysisHeaderProps) {
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
            {getProjectName(project.site_url)}
          </h1>
          <p className="text-gray-600">{project.site_url}</p>
        </div>
        <div className="flex items-center space-x-4">
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
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'pages', name: 'Pages', icon: '📄' },
              { id: 'technologies', name: 'Technical', icon: '⚙️' },
              { id: 'cms', name: 'CMS', icon: '🏗️' },
              { id: 'performance', name: 'Performance', icon: '⚡' },
              { id: 'seo', name: 'SEO', icon: '🔍' },
              { id: 'images', name: 'Images', icon: '🖼️' },
              { id: 'links', name: 'Links', icon: '🔗' }
            ].map((tab) => (
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

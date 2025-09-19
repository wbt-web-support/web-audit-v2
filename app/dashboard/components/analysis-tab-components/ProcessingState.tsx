'use client'

import { AuditProject } from '@/types/audit'

interface ProcessingStateProps {
  project: AuditProject
}

export default function ProcessingState({ project }: ProcessingStateProps) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {getProjectName(project.site_url)}
            </h1>
            <p className="text-gray-600">{project.site_url}</p>
          </div>
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(project.status)}`}>
            {getStatusDisplayName(project.status)}
          </span>
        </div>
      </div>

      {/* Processing State */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Analysis in Progress</h2>
        <p className="text-gray-600 mb-4">
          We&apos;re currently scraping and analyzing your website. This may take a few minutes.
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500">{project.progress}% complete</p>
      </div>
    </div>
  )
}

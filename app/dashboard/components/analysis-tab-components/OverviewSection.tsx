'use client'

import { AuditProject } from '@/types/audit'

interface OverviewSectionProps {
  project: AuditProject
}

export default function OverviewSection({ project }: OverviewSectionProps) {
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Stats */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{project.total_pages || 0}</div>
              <div className="text-sm text-gray-600">Pages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{project.total_links || 0}</div>
              <div className="text-sm text-gray-600">Links</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{project.total_images || 0}</div>
              <div className="text-sm text-gray-600">Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{project.total_meta_tags || 0}</div>
              <div className="text-sm text-gray-600">Meta Tags</div>
            </div>
          </div>
        </div>

        {/* Technologies Overview */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Technologies Detected</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {project.technologies.slice(0, 6).map((tech: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                    <span className="font-medium text-gray-900">{tech.name}</span>
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
            {project.technologies.length > 6 && (
              <p className="text-sm text-gray-500 mt-3 text-center">
                +{project.technologies.length - 6} more technologies
              </p>
            )}
          </div>
        )}
      </div>

      {/* Sidebar Stats */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {getStatusDisplayName(project.status)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created</span>
              <span className="text-gray-900">{formatDate(project.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated</span>
              <span className="text-gray-900">{formatDate(project.updated_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-900">{project.progress}%</span>
            </div>
          </div>
        </div>

        {/* CMS Info */}
        {project.cms_detected && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">CMS Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Type</span>
                <span className="text-gray-900">{project.cms_type || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Version</span>
                <span className="text-gray-900">{project.cms_version || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Confidence</span>
                <span className="text-gray-900">{Math.round((project.cms_confidence || 0) * 100)}%</span>
              </div>
              {project.cms_plugins && project.cms_plugins.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Plugins</span>
                  <span className="text-gray-900">{project.cms_plugins.length}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

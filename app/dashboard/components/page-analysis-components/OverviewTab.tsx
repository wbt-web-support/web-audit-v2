'use client'

import { AuditProject } from '@/types/audit'

interface OverviewTabProps {
  page: {
    id: string
    url: string
    title: string | null
    description: string | null
    status_code: number | null
    html_content_length: number | null
    links_count: number
    images_count: number
    meta_tags_count: number
    technologies_count: number
    response_time: number | null
    created_at: string
  } | null
  project: AuditProject | null
}

export default function OverviewTab({ page, project }: OverviewTabProps) {
  if (!page) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading page data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{page.title || 'Untitled Page'}</h1>
            <p className="text-gray-600 mt-1">{page.url}</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              page.status_code && page.status_code >= 200 && page.status_code < 300 ? 'bg-green-100 text-green-800' :
              page.status_code && page.status_code >= 300 && page.status_code < 400 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {page.status_code || 'N/A'}
            </span>
            {project && (
              <span className="text-sm text-gray-500">
                From: {project.site_url}
              </span>
            )}
          </div>
        </div>
        
        {page.description && (
          <p className="text-gray-700 mb-4">{page.description}</p>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{page.links_count || 0}</div>
          <div className="text-sm text-gray-600">Links</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{page.images_count || 0}</div>
          <div className="text-sm text-gray-600">Images</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{page.meta_tags_count || 0}</div>
          <div className="text-sm text-gray-600">Meta Tags</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{page.technologies_count || 0}</div>
          <div className="text-sm text-gray-600">Technologies</div>
        </div>
      </div>

      {/* Content Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Content Length:</span>
              <span className="font-medium">{page.html_content_length || 0} characters</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Response Time:</span>
              <span className="font-medium">{page.response_time || 'N/A'}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="font-medium">
                {new Date(page.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${
                page.status_code && page.status_code >= 200 && page.status_code < 300 ? 'text-green-600' :
                page.status_code && page.status_code >= 300 && page.status_code < 400 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {page.status_code && page.status_code >= 200 && page.status_code < 300 ? 'Healthy' :
                 page.status_code && page.status_code >= 300 && page.status_code < 400 ? 'Redirect' : 'Error'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Technologies:</span>
              <span className="font-medium">{page.technologies_count || 0} detected</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Meta Tags:</span>
              <span className="font-medium">{page.meta_tags_count || 0} found</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

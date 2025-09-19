'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { AuditProject } from '@/types/audit'
import { motion } from 'framer-motion'

interface AnalysisTabProps {
  projectId: string
  cachedData?: {
    project: AuditProject | null
    scrapedPages: any[]
    lastFetchTime: number
  } | null
  onDataUpdate?: (project: AuditProject | null, scrapedPages: any[]) => void
}

export default function AnalysisTab({ projectId, cachedData, onDataUpdate }: AnalysisTabProps) {
  const { getAuditProject, getScrapedPages } = useSupabase()
  const [project, setProject] = useState<AuditProject | null>(null)
  const [scrapedPages, setScrapedPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('overview')
  const [dataFetched, setDataFetched] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  console.log('🔍 AnalysisTab rendered for project:', projectId, 'cachedData:', !!cachedData, 'loading:', loading)

  // Main data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return

      // Check if we have cached data first
      if (cachedData) {
        console.log('📋 AnalysisTab: Using cached data from parent')
        setProject(cachedData.project)
        setScrapedPages(cachedData.scrapedPages)
        setLoading(false)
        setError(null)
        setDataFetched(true)
        setLastFetchTime(cachedData.lastFetchTime)
        return
      }

      // If we already have project data and it's not stale, don't fetch again
      if (project && dataFetched) {
        const now = Date.now()
        const timeSinceLastFetch = now - lastFetchTime
        const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

        if (timeSinceLastFetch < CACHE_DURATION) {
          console.log('📋 AnalysisTab: Using local cached data')
          setLoading(false)
          return
        }
      }

      console.log('🚀 AnalysisTab: Fetching data for project:', projectId)
      setLoading(true)
      setError(null)

      try {
        // Fetch project details
        const { data: projectData, error: projectError } = await getAuditProject(projectId)
        
        if (projectError) {
          console.error('Error fetching project:', projectError)
          setError('Failed to load project details')
          return
        }

        if (projectData) {
          console.log('✅ AnalysisTab: Project data fetched:', projectData.id)
          setProject(projectData)
          
          let pagesData: any[] = []
          
          // If project is completed, fetch scraped pages
          if (projectData.status === 'completed') {
            console.log('📄 AnalysisTab: Fetching scraped pages...')
            const { data: pages, error: pagesError } = await getScrapedPages(projectId)
            
            if (pagesError) {
              console.error('Error fetching scraped pages:', pagesError)
            } else if (pages) {
              pagesData = pages
              setScrapedPages(pages)
              console.log('✅ AnalysisTab: Scraped pages fetched:', pages.length)
            }
          }
          
          // Update parent cache
          if (onDataUpdate) {
            console.log('💾 AnalysisTab: Updating parent cache')
            onDataUpdate(projectData, pagesData)
          }
          
          setDataFetched(true)
          setLastFetchTime(Date.now())
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [projectId, cachedData]) // Only depend on projectId and cachedData

  // Handle browser visibility changes to prevent unnecessary refetches
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only refetch if data is stale (older than 2 minutes)
        const now = Date.now()
        const timeSinceLastFetch = now - lastFetchTime
        const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

        if (timeSinceLastFetch > CACHE_DURATION && dataFetched) {
          console.log('🔄 AnalysisTab: Refreshing stale data on visibility change')
          // Trigger a refetch by resetting the cache flags
          setDataFetched(false)
          setLastFetchTime(0)
        }
      }
    }

    const handleFocus = () => {
      // Only refetch if data is stale (older than 2 minutes)
      const now = Date.now()
      const timeSinceLastFetch = now - lastFetchTime
      const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

      if (timeSinceLastFetch > CACHE_DURATION && dataFetched) {
        console.log('🔄 AnalysisTab: Refreshing stale data on window focus')
        // Trigger a refetch by resetting the cache flags
        setDataFetched(false)
        setLastFetchTime(0)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [lastFetchTime, dataFetched])

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

  const getProjectName = (siteUrl: string) => {
    try {
      const url = new URL(siteUrl)
      return url.hostname.replace('www.', '')
    } catch {
      return siteUrl
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Analysis</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Not Found</h3>
        <p className="text-gray-600">The requested project could not be found.</p>
      </div>
    )
  }

  // Show processing state if project is still in progress
  if (project.status === 'in_progress' || project.status === 'pending') {
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
            We're currently scraping and analyzing your website. This may take a few minutes.
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

  return (
    <div className="space-y-6">
      {/* Header */}
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
              { id: 'technologies', name: 'Technologies', icon: '⚙️' },
              { id: 'cms', name: 'CMS', icon: '🏗️' },
              { id: 'performance', name: 'Performance', icon: '⚡' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
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

      {/* Content Sections */}
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeSection === 'overview' && (
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
        )}

        {activeSection === 'pages' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scraped Pages</h3>
            {scrapedPages.length > 0 ? (
              <div className="space-y-4">
                {scrapedPages.map((page, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{page.title || 'Untitled'}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        page.status_code >= 200 && page.status_code < 300 ? 'bg-green-100 text-green-800' :
                        page.status_code >= 300 && page.status_code < 400 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {page.status_code}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{page.url}</p>
                    {page.description && (
                      <p className="text-sm text-gray-700 mb-3">{page.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{page.links_count} links</span>
                      <span>{page.images_count} images</span>
                      <span>{page.meta_tags_count} meta tags</span>
                      <span>{page.technologies_count} technologies</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-600">No scraped pages data available</p>
              </div>
            )}
          </div>
        )}

        {activeSection === 'technologies' && (
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
        )}

        {activeSection === 'cms' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
                      {project.cms_plugins.map((plugin: any, index: number) => (
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
                              plugin.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                              plugin.confidence >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {Math.round(plugin.confidence * 100)}%
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
                      {project.cms_themes.map((theme: any, index: number) => (
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
                            theme.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                            theme.confidence >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {Math.round(theme.confidence * 100)}%
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
        )}

        {activeSection === 'performance' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{project.total_pages || 0}</div>
                <div className="text-sm text-gray-600">Total Pages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{Math.round(project.total_html_content / 1000) || 0}K</div>
                <div className="text-sm text-gray-600">Total HTML Content</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{Math.round(project.average_html_per_page / 1000) || 0}K</div>
                <div className="text-sm text-gray-600">Avg HTML per Page</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{(project as any).pages_per_second || 0}</div>
                <div className="text-sm text-gray-600">Pages per Second</div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}


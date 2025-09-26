'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { AuditProject } from '@/types/audit'
import { ProjectCardSkeleton, StatsCardSkeleton } from '../SkeletonLoader'

interface ProjectsTabProps {
  userProfile: unknown
  projects: AuditProject[]
  projectsLoading: boolean
  projectsError: string | null
  refreshProjects: () => Promise<void>
  onProjectSelect?: (projectId: string) => void
}

export default function ProjectsTab({ 
  projects, 
  projectsLoading, 
  projectsError, 
  refreshProjects,
  onProjectSelect
}: Omit<ProjectsTabProps, 'userProfile'>) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const previousProjectsRef = useRef<AuditProject[]>([])

  // Monitor project status changes and refresh when crawling is successful
  useEffect(() => {
    if (projects.length === 0 || projectsLoading) return

    const previousProjects = previousProjectsRef.current
    const currentProjects = projects

    // Check if any project has transitioned from pending/in_progress to completed
    const hasStatusChanged = currentProjects.some(currentProject => {
      const previousProject = previousProjects.find(p => p.id === currentProject.id)
      
      if (!previousProject) return false
      
      // Check if status changed from pending/in_progress to completed
      const wasProcessing = previousProject.status === 'pending' || previousProject.status === 'in_progress'
      const isNowCompleted = currentProject.status === 'completed'
      
      return wasProcessing && isNowCompleted
    })

    if (hasStatusChanged) {
      console.log('🔄 Project status changed to completed, refreshing projects...')
      refreshProjects()
    }

    // Update the ref with current projects
    previousProjectsRef.current = currentProjects
  }, [projects, refreshProjects, projectsLoading])
  
  // Performance tracking
  useEffect(() => {
    if (projectsLoading) {
      
    } else if (projectsError) {
      
    } else if (projects.length === 0) {
      
    } else {
      const renderStartTime = performance.now()
      
      
      // Use requestAnimationFrame to measure after DOM updates
      requestAnimationFrame(() => {
        const renderEndTime = performance.now()
        
        
        
        // Log performance metrics
        const avgRenderTimePerCard = (renderEndTime - renderStartTime) / projects.length
        
      })
    }
  }, [projectsLoading, projectsError, projects.length])

  const toggleCardExpansion = (projectId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(projectId)) {
        newSet.delete(projectId)
      } else {
        newSet.add(projectId)
      }
      return newSet
    })
  }

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Calculate basic statistics for quick overview
  const totalProjects = projects.length
  const completedProjects = projects.filter(p => p.status === 'completed').length
  const inProgressProjects = projects.filter(p => p.status === 'in_progress').length
  const totalIssues = projects.reduce((sum, p) => sum + p.issues_count, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage and monitor your web audit projects</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button 
            onClick={() => refreshProjects()} 
            className="text-gray-600 hover:text-gray-800 transition-colors relative p-2 rounded-lg hover:bg-gray-100"
            disabled={projectsLoading}
            title="Refresh projects"
          >
            <svg 
              className={`w-5 h-5 ${projectsLoading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {projectsLoading && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            )}
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {projectsLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <StatsCardSkeleton key={index} />
          ))
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Projects</p>
                  <p className="text-xl font-bold text-gray-900">{totalProjects}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-xl font-bold text-gray-900">{completedProjects}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-xl font-bold text-gray-900">{inProgressProjects}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Issues</p>
                  <p className="text-xl font-bold text-gray-900">{totalIssues}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Projects Cards */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">All Projects</h2>
          <div className="text-sm text-gray-500">
            {projectsLoading ? 'Loading...' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        
        {projectsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <ProjectCardSkeleton key={index} />
            ))}
          </div>
        ) : projectsError ? (
          <div className="text-center py-12">
            <div className="text-red-500 mb-2">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{projectsError}</p>
            {projectsError?.includes('Supabase not configured') && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
                <p className="text-sm text-yellow-800">
                  Please create a <code className="bg-yellow-100 px-1 rounded">.env.local</code> file with your Supabase credentials.
                  <br />
                  See <code className="bg-yellow-100 px-1 rounded">env.example</code> for reference.
                </p>
              </div>
            )}
            <button 
              onClick={() => refreshProjects()} 
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No projects yet</p>
            <p className="text-gray-500 text-sm">Create your first audit project to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project, index) => {
              const isExpanded = expandedCards.has(project.id)
              
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                >
                {/* Card Header - Always Visible */}
                <div 
                  className="p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleCardExpansion(project.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getProjectName(project.site_url)}
                        </h3>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                          {getStatusDisplayName(project.status)}
                        </span>
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{project.progress}%</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{project.site_url}</p>
                      
                      {/* Basic Summary - Only show metrics with data */}
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        {project.total_pages > 0 && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            {project.total_pages} pages
                          </div>
                        )}
                        {project.total_links > 0 && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            {project.total_links} links
                          </div>
                        )}
                        {project.issues_count > 0 && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            {project.issues_count} issues
                          </div>
                        )}
                        {project.last_audit_at && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDate(project.last_audit_at)}
                          </div>
                        )}
                        {/* Show technologies count if there are technologies */}
                        {project.technologies && project.technologies.length > 0 && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            {project.technologies.length} tech
                          </div>
                        )}
                        {/* Show CMS info if detected */}
                        {project.cms_detected && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {project.cms_type || 'CMS'} detected
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${project.score >= 80 ? 'text-green-600' : project.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {project.score > 0 ? project.score : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">/100</div>
                      </div>
                      
                      {/* Expand/Collapse Button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <motion.svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </motion.svg>
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Collapsible Detailed Summary */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 bg-gray-50 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Detailed Summary
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-6">
                          {/* Pages & Links */}
                          <div className="space-y-4">
                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Content</h5>
                            <div className="space-y-3">
                              {project.total_pages > 0 && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Pages
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.total_pages}</span>
                                </div>
                              )}
                              {project.total_links > 0 && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    Links
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.total_links}</span>
                                </div>
                              )}
                              {project.total_images > 0 && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Images
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.total_images}</span>
                                </div>
                              )}
                              {project.total_meta_tags > 0 && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    Meta Tags
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.total_meta_tags}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Technical Details */}
                          <div className="space-y-4">
                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Technical</h5>
                            <div className="space-y-3">
                              {project.technologies_found > 0 && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    Technologies
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.technologies_found}</span>
                                </div>
                              )}
                              {project.issues_count > 0 && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    Issues
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.issues_count}</span>
                                </div>
                              )}
                              {project.cms_detected && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    CMS Detected
                                  </div>
                                  <span className="font-semibold text-indigo-600">Yes</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* CMS Information - Only show if CMS is detected and has data */}
                        {project.cms_detected && (project.cms_type || project.cms_version || (project.cms_plugins && project.cms_plugins.length > 0) || (project.cms_themes && project.cms_themes.length > 0) || (project.cms_components && project.cms_components.length > 0)) && (
                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              CMS Information
                            </h5>
                            
                            <div className="grid grid-cols-2 gap-6 mb-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    CMS Type
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.cms_type || 'Unknown'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    Version
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.cms_version || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Confidence
                                  </div>
                                  <span className="font-semibold text-gray-900">{Math.round((project.cms_confidence || 0) * 100)}%</span>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    Plugins
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.cms_plugins?.length || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    Themes
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.cms_themes?.length || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Components
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.cms_components?.length || 0}</span>
                                </div>
                              </div>
                            </div>

                            {/* CMS Plugins List - Only show if there are plugins */}
                            {project.cms_plugins && project.cms_plugins.length > 0 && (
                              <div className="mb-4">
                                <h6 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Detected Plugins</h6>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {project.cms_plugins.slice(0, 5).map((plugin: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between text-xs bg-gray-100 rounded px-2 py-1">
                                      <div className="flex items-center">
                                        <span className="font-medium text-gray-900">{plugin.name}</span>
                                        {plugin.version && (
                                          <span className="ml-2 text-gray-500">v{plugin.version}</span>
                                        )}
                                        {plugin.active && (
                                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Active
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-gray-500">{Math.round(plugin.confidence * 100)}%</span>
                                    </div>
                                  ))}
                                  {project.cms_plugins.length > 5 && (
                                    <div className="text-xs text-gray-500 text-center py-1">
                                      +{project.cms_plugins.length - 5} more plugins
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* CMS Themes List - Only show if there are themes */}
                            {project.cms_themes && project.cms_themes.length > 0 && (
                              <div className="mb-4">
                                <h6 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Detected Themes</h6>
                                <div className="space-y-1">
                                  {project.cms_themes.slice(0, 3).map((theme: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between text-xs bg-gray-100 rounded px-2 py-1">
                                      <div className="flex items-center">
                                        <span className="font-medium text-gray-900">{theme.name}</span>
                                        {theme.version && (
                                          <span className="ml-2 text-gray-500">v{theme.version}</span>
                                        )}
                                        {theme.active && (
                                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            Active
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-gray-500">{Math.round(theme.confidence * 100)}%</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Technologies Information - Only show if there are technologies */}
                        {project.technologies && project.technologies.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              Technical Detected
                            </h5>
                            
                            <div className="grid grid-cols-2 gap-6 mb-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Total Technologies
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.technologies.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Categories
                                  </div>
                                  <span className="font-semibold text-gray-900">
                                    {project.technologies_metadata?.categories?.length || 0}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Confidence
                                  </div>
                                  <span className="font-semibold text-gray-900">
                                    {Math.round((project.technologies_confidence || 0) * 100)}%
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    High Confidence
                                  </div>
                                  <span className="font-semibold text-green-600">
                                    {project.technologies_metadata?.high_confidence_technologies || 0}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    Medium Confidence
                                  </div>
                                  <span className="font-semibold text-yellow-600">
                                    {project.technologies_metadata?.medium_confidence_technologies || 0}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Low Confidence
                                  </div>
                                  <span className="font-semibold text-red-600">
                                    {project.technologies_metadata?.low_confidence_technologies || 0}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Technologies List by Category */}
                            {project.technologies_metadata?.technologies_by_category && (
                              <div className="space-y-4">
                                {Object.entries(project.technologies_metadata.technologies_by_category).map(([category, techs]: [string, any]) => (
                                  <div key={category} className="bg-gray-50 rounded-lg p-4">
                                    <h6 className="text-sm font-semibold text-gray-700 mb-3 capitalize flex items-center">
                                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                      </svg>
                                      {category} ({techs.length})
                                    </h6>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {techs.slice(0, 6).map((tech: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between text-xs bg-white rounded px-3 py-2 border">
                                          <div className="flex items-center">
                                            {tech.icon && (
                                              <img 
                                                src={tech.icon} 
                                                alt={tech.name}
                                                className="w-4 h-4 mr-2 rounded"
                                                onError={(e) => {
                                                  e.currentTarget.style.display = 'none'
                                                }}
                                              />
                                            )}
                                            <span className="font-medium text-gray-900">{tech.name}</span>
                                            {tech.version && (
                                              <span className="ml-2 text-gray-500">v{tech.version}</span>
                                            )}
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                              tech.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                                              tech.confidence >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                                              'bg-red-100 text-red-800'
                                            }`}>
                                              {Math.round(tech.confidence * 100)}%
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                      {techs.length > 6 && (
                                        <div className="text-xs text-gray-500 text-center py-2 col-span-full">
                                          +{techs.length - 6} more technologies
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* HTML Content Details - Only show if there's content data */}
                        {(project.total_html_content > 0 || project.average_html_per_page > 0) && (
                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Content Analysis</h5>
                            <div className="grid grid-cols-2 gap-6">
                              {project.total_html_content > 0 && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Total HTML Content
                                  </div>
                                  <span className="font-semibold text-gray-900">{Math.round(project.total_html_content / 1000)}K</span>
                                </div>
                              )}
                              {project.average_html_per_page > 0 && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Average per Page
                                  </div>
                                  <span className="font-semibold text-gray-900">{Math.round(project.average_html_per_page / 1000)}K</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Card Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Created {formatDate(project.created_at)}
                    </div>
                    <div className="flex space-x-2">
                      {project.status === 'completed' && (
                        <button 
                          onClick={() => onProjectSelect?.(project.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          View Analysis
                        </button>
                      )}
                      {project.status === 'pending' && (
                        <button 
                          onClick={() => onProjectSelect?.(project.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          View Details
                        </button>
                      )}
                      <button className="text-gray-600 hover:text-gray-800 text-sm font-medium px-3 py-1 rounded hover:bg-gray-100 transition-colors">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

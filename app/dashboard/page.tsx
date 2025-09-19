'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { AuditProject } from '@/types/audit'
import DashboardSidebar from './components/DashboardSidebar'
import DashboardHeader from './components/DashboardHeader'
import DashboardContent from './components/DashboardContent'
import AnalysisTab from './components/tabs/AnalysisTab'

export default function DashboardPage() {
  const { user, userProfile, loading, getAuditProjectsOptimized } = useSupabase()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  
  // Projects data state
  const [projects, setProjects] = useState<AuditProject[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState<string | null>(null)
  const [projectsFetched, setProjectsFetched] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  
  // Analysis data cache
  const [analysisCache, setAnalysisCache] = useState<Map<string, {
    project: AuditProject | null
    scrapedPages: any[]
    lastFetchTime: number
  }>>(new Map())

  // Handle URL parameters for tab detection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tabParam = urlParams.get('tab')
    const projectId = urlParams.get('projectId')
    
    if (tabParam && ['dashboard', 'projects', 'profile', 'admin', 'analysis'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
    
    if (projectId) {
      setSelectedProjectId(projectId)
    }
  }, [])

  // Handle browser visibility changes to prevent unnecessary refetches
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only refetch if data is stale (older than 5 minutes)
        const now = Date.now()
        const timeSinceLastFetch = now - lastFetchTime
        const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

        if (timeSinceLastFetch > CACHE_DURATION && projectsFetched) {
          console.log('🔄 Dashboard: Refreshing stale data on visibility change')
          refreshProjects()
        }
      }
    }

    const handleFocus = () => {
      // Only refetch if data is stale (older than 5 minutes)
      const now = Date.now()
      const timeSinceLastFetch = now - lastFetchTime
      const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

      if (timeSinceLastFetch > CACHE_DURATION && projectsFetched) {
        console.log('🔄 Dashboard: Refreshing stale data on window focus')
        refreshProjects()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [lastFetchTime, projectsFetched])

  // Handle tab changes with URL updates
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Update URL without page reload
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    if (tab !== 'analysis') {
      url.searchParams.delete('projectId')
      setSelectedProjectId(null)
    }
    window.history.pushState({}, '', url.toString())
  }

  // Handle project selection for analysis
  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId)
    setActiveTab('analysis')
    // Update URL with both tab and projectId
    const url = new URL(window.location.href)
    url.searchParams.set('tab', 'analysis')
    url.searchParams.set('projectId', projectId)
    window.history.pushState({}, '', url.toString())
  }

  // Analysis cache management
  const getCachedAnalysisData = (projectId: string) => {
    const cached = analysisCache.get(projectId)
    if (!cached) {
      console.log('📋 No cached data for project:', projectId)
      return null
    }
    
    const now = Date.now()
    const timeSinceLastFetch = now - cached.lastFetchTime
    const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes
    
    if (timeSinceLastFetch < CACHE_DURATION) {
      console.log('📋 Using cached data for project:', projectId, 'age:', Math.round(timeSinceLastFetch / 1000), 'seconds')
      return cached
    }
    
    console.log('📋 Cached data expired for project:', projectId, 'age:', Math.round(timeSinceLastFetch / 1000), 'seconds')
    return null
  }

  const setCachedAnalysisData = (projectId: string, project: AuditProject | null, scrapedPages: any[]) => {
    console.log('📋 Caching data for project:', projectId, 'pages:', scrapedPages.length, 'project status:', project?.status)
    setAnalysisCache(prev => {
      const newCache = new Map(prev)
      newCache.set(projectId, {
        project,
        scrapedPages,
        lastFetchTime: Date.now()
      })
      console.log('📋 Cache updated, total entries:', newCache.size)
      return newCache
    })
  }

  // Fetch projects data when user is available
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) {
        setProjectsLoading(false)
        return
      }

      // Prevent unnecessary re-fetches
      const now = Date.now()
      const timeSinceLastFetch = now - lastFetchTime
      const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

      if (projectsFetched && timeSinceLastFetch < CACHE_DURATION) {
        console.log('📋 Dashboard: Using cached projects data')
        setProjectsLoading(false)
        return
      }

      console.log('🚀 Dashboard: Starting projects fetch...')
      setProjectsLoading(true)
      setProjectsError(null)

      try {
        const { data, error } = await getAuditProjectsOptimized()

        if (error) {
          console.error('❌ Dashboard: Error fetching projects:', error)
          setProjectsError('Failed to load projects')
          return
        }

        if (data) {
          console.log(`✅ Dashboard: Total projects loaded: ${data.length}`)
          setProjects(data)
          setProjectsError(null)
          setProjectsFetched(true)
          setLastFetchTime(now)
        }
      } catch (err) {
        console.error('❌ Dashboard: Unexpected error fetching projects:', err)
        setProjectsError('Failed to load projects')
      } finally {
        setProjectsLoading(false)
      }
    }

    fetchProjects()
  }, [user]) // Removed getAuditProjectsOptimized from dependencies

  // Refresh projects function
  const refreshProjects = async () => {
    if (!user) return

    console.log('🔄 Dashboard: Refreshing projects...')
    setProjectsLoading(true)
    setProjectsError(null)

    try {
      const { data, error } = await getAuditProjectsOptimized()

      if (error) {
        console.error('❌ Dashboard: Error refreshing projects:', error)
        setProjectsError('Failed to refresh projects')
        return
      }

      if (data) {
        console.log(`✅ Dashboard: Projects refreshed: ${data.length}`)
        setProjects(data)
        setProjectsError(null)
        setProjectsFetched(true)
        setLastFetchTime(Date.now())
      }
    } catch (err) {
      console.error('❌ Dashboard: Unexpected error refreshing projects:', err)
      setProjectsError('Failed to refresh projects')
    } finally {
      setProjectsLoading(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to access the dashboard.</p>
          <a 
            href="/login" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <DashboardSidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        userProfile={userProfile}
      />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <DashboardHeader 
          onMenuClick={() => setSidebarOpen(true)}
          userProfile={userProfile}
        />

        {/* Content */}
        {activeTab === 'analysis' && selectedProjectId ? (
          <div className="p-6">
            <AnalysisTab 
              key={selectedProjectId} // Prevent unnecessary re-mounting
              projectId={selectedProjectId}
              cachedData={getCachedAnalysisData(selectedProjectId)}
              onDataUpdate={(project, scrapedPages) => setCachedAnalysisData(selectedProjectId, project, scrapedPages)}
            />
          </div>
        ) : (
          <DashboardContent 
            activeTab={activeTab}
            userProfile={userProfile}
            projects={projects}
            projectsLoading={projectsLoading}
            projectsError={projectsError}
            refreshProjects={refreshProjects}
            onProjectSelect={handleProjectSelect}
          />
        )}
      </div>
    </div>
  )
}

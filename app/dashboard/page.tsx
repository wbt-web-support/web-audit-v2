'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSupabase } from '@/contexts/SupabaseContext'
import { AuditProject } from '@/types/audit'
import { useSearchParams } from 'next/navigation'
import { DashboardSidebar, DashboardHeader, DashboardContent } from './components/dashboard-components'
import AnalysisTab from './components/tabs/AnalysisTab'
import PageAnalysisTab from './components/tabs/PageAnalysisTab'
import ConnectionStatus from './components/ConnectionStatus'
import { ScrapedPage } from './components/analysis-tab/types'

function DashboardContentWrapper() {
  const { user, userProfile, loading, isAuthenticated, authChecked } = useAuth()
  const { getAuditProjectsOptimized, deleteAuditProject } = useSupabase()
  const searchParams = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  
  // Projects data state
  const [projects, setProjects] = useState<AuditProject[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState<string | null>(null)
  const [projectsFetched, setProjectsFetched] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  
  // Analysis data cache
  const [analysisCache, setAnalysisCache] = useState<Map<string, {
    project: AuditProject | null
    scrapedPages: ScrapedPage[]
    lastFetchTime: number
  }>>(new Map())

  // Handle authentication and redirect if not authenticated
  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      
      window.location.href = '/login';
    }
  }, [authChecked, isAuthenticated]);

  // Handle URL parameters for tab detection
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    const projectId = searchParams.get('projectId')
    const pageId = searchParams.get('pageId')
    
    
    
    if (tabParam && ['dashboard', 'projects', 'profile', 'admin', 'analysis', 'page-analysis'].includes(tabParam)) {
      
      setActiveTab(tabParam)
    }
    
    if (projectId) {
      
      setSelectedProjectId(projectId)
      
      // If we have a projectId but no tab specified, default to analysis
      if (!tabParam) {
        
        setActiveTab('analysis')
        // Update URL to include the tab parameter
        const url = new URL(window.location.href)
        url.searchParams.set('tab', 'analysis')
        window.history.replaceState({}, '', url.toString())
      }
    }
    
    if (pageId) {
      
      setSelectedPageId(pageId)
      
      // If we have a pageId but no tab specified, default to page-analysis
      if (!tabParam) {
        
        setActiveTab('page-analysis')
        // Update URL to include the tab parameter
        const url = new URL(window.location.href)
        url.searchParams.set('tab', 'page-analysis')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [searchParams])

  // Debug AnalysisTab rendering
  useEffect(() => {
    if (activeTab === 'analysis' && selectedProjectId) {
     
    }
  }, [activeTab, selectedProjectId])

  // Refresh projects function
  const refreshProjects = useCallback(async () => {
    if (!user) return

    
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
  }, [user, getAuditProjectsOptimized])

  // Handle browser visibility changes to prevent unnecessary refetches
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only refetch if data is stale (older than 5 minutes)
        const now = Date.now()
        const timeSinceLastFetch = now - lastFetchTime
        const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

        if (timeSinceLastFetch > CACHE_DURATION && projectsFetched) {
          
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
        
        refreshProjects()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [lastFetchTime, projectsFetched, refreshProjects])

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
    if (tab !== 'page-analysis') {
      url.searchParams.delete('pageId')
      setSelectedPageId(null)
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

  // Handle page selection for page analysis
  const handlePageSelect = (pageId: string) => {
    setSelectedPageId(pageId)
    setActiveTab('page-analysis')
    // Update URL with both tab and pageId
    const url = new URL(window.location.href)
    url.searchParams.set('tab', 'page-analysis')
    url.searchParams.set('pageId', pageId)
    window.history.pushState({}, '', url.toString())
  }

  // CRUD operations for projects
  const handleUpdateProject = async (projectId: string, data: {
    siteUrl: string;
    pageType: 'single' | 'multiple';
    brandConsistency: boolean;
    hiddenUrls: boolean;
    keysCheck: boolean;
    brandData: {
      companyName: string;
      phoneNumber: string;
      emailAddress: string;
      address: string;
      additionalInformation: string;
    };
    hiddenUrlsList: {
      id: string;
      url: string;
    }[];
  }) => {
    console.log('Dashboard: handleUpdateProject called with:', { projectId, data });
    
    try {
      // TODO: Implement actual API call to update project
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the project in local state
      setProjects(prev => prev.map(project => 
        project.id === projectId 
          ? { ...project, site_url: data.siteUrl, updated_at: new Date().toISOString() }
          : project
      ));
      
      console.log('Dashboard: Project updated successfully');
    } catch (error) {
      console.error('Dashboard: Error updating project:', error);
      throw error;
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    console.log('Dashboard: handleDeleteProject called with:', projectId);
    
    try {
      // Call the actual delete API
      const { error } = await deleteAuditProject(projectId);
      
      if (error) {
        console.error('Dashboard: Error deleting project from database:', error);
        throw new Error(`Failed to delete project: ${error.message}`);
      }
      
      // Remove the project from local state
      setProjects(prev => prev.filter(project => project.id !== projectId));
      
      console.log('Dashboard: Project deleted successfully');
    } catch (error) {
      console.error('Dashboard: Error deleting project:', error);
      throw error;
    }
  };

  const handleRecrawlProject = async (projectId: string) => {
    console.log('Dashboard: handleRecrawlProject called with:', projectId);
    
    try {
      // TODO: Implement actual API call to recrawl project
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the project status to pending
      setProjects(prev => prev.map(project => 
        project.id === projectId 
          ? { ...project, status: 'pending', updated_at: new Date().toISOString() }
          : project
      ));
      
      console.log('Dashboard: Project recrawl initiated successfully');
    } catch (error) {
      console.error('Dashboard: Error recrawling project:', error);
      throw error;
    }
  };

  // Analysis cache management
  const getCachedAnalysisData = (projectId: string): {
    project: AuditProject | null
    scrapedPages: ScrapedPage[]
    lastFetchTime: number
  } | null => {
    const cached = analysisCache.get(projectId)
    if (!cached) {
      
      return null
    }
    
    const now = Date.now()
    const timeSinceLastFetch = now - cached.lastFetchTime
    const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes
    
    if (timeSinceLastFetch < CACHE_DURATION) {
      
      return cached
    }
    
    
    return null
  }

  const setCachedAnalysisData = (projectId: string, project: AuditProject | null, scrapedPages: ScrapedPage[]) => {
    
    setAnalysisCache(prev => {
      const newCache = new Map(prev)
      newCache.set(projectId, {
        project,
        scrapedPages,
        lastFetchTime: Date.now()
      })
      
      return newCache
    })
  }

  // Fetch projects data when user is available
  useEffect(() => {
    const fetchProjects = async () => {
      if (!authChecked || !isAuthenticated || !user) {
        setProjectsLoading(false)
        return
      }

      // Prevent unnecessary re-fetches
      const now = Date.now()
      const timeSinceLastFetch = now - lastFetchTime
      const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

      if (projectsFetched && timeSinceLastFetch < CACHE_DURATION) {
        
        setProjectsLoading(false)
        return
      }

      
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
  }, [authChecked, isAuthenticated, user, getAuditProjectsOptimized, lastFetchTime, projectsFetched]) // Enhanced dependencies for better auth checking

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
        selectedProjectId={selectedProjectId}
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
              onPageSelect={handlePageSelect}
            />
          </div>
        ) : activeTab === 'page-analysis' && selectedPageId ? (
          <div className="p-6">
            <PageAnalysisTab 
              key={selectedPageId} // Prevent unnecessary re-mounting
              pageId={selectedPageId}
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
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onRecrawlProject={handleRecrawlProject}
          />
        )}
      </div>
      <ConnectionStatus />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContentWrapper />
    </Suspense>
  )
}

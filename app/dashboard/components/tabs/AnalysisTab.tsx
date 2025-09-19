'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { AuditProject } from '@/types/audit'
import { motion } from 'framer-motion'
import {
  AnalysisHeader,
  OverviewSection,
  PagesSection,
  TechnologiesSection,
  CmsSection,
  PerformanceSection,
  ProcessingState
} from '../analysis-tab-components'

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
    return <ProcessingState project={project} />
  }

  return (
    <div className="space-y-6">
      <AnalysisHeader 
        project={project} 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />

      {/* Content Sections */}
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeSection === 'overview' && <OverviewSection project={project} />}
        {activeSection === 'pages' && <PagesSection scrapedPages={scrapedPages} />}
        {activeSection === 'technologies' && <TechnologiesSection project={project} />}
        {activeSection === 'cms' && <CmsSection project={project} />}
        {activeSection === 'performance' && <PerformanceSection project={project} />}
      </motion.div>
    </div>
  )
}


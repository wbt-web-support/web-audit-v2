'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSupabase } from './SupabaseContext'

interface AuditProject {
  id: string
  site_url: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  progress: number
  last_audit_at: string | null
  issues_count: number
  score: number
  created_at: string
  updated_at: string
  total_pages: number
  total_links: number
  total_images: number
  total_meta_tags: number
  technologies_found: number
  cms_detected: boolean
  cms_type: string | null
  cms_version: string | null
  cms_plugins: CmsPlugin[] | null
  cms_themes: CmsTheme[] | null
  cms_components: CmsComponent[] | null
  cms_confidence: number
  cms_detection_method: string | null
  cms_metadata: any | null
  technologies: Technology[] | null
  technologies_confidence: number
  technologies_detection_method: string | null
  technologies_metadata: any | null
  total_html_content: number
  average_html_per_page: number
}

interface CmsPlugin {
  name: string
  version: string | null
  active: boolean
  path: string | null
  description: string | null
  author: string | null
  confidence: number
  detection_method: string
}

interface CmsTheme {
  name: string
  version: string | null
  active: boolean
  path: string | null
  description: string | null
  author: string | null
  confidence: number
  detection_method: string
}

interface CmsComponent {
  name: string
  type: string
  version: string | null
  active: boolean
  path: string | null
  description: string | null
  confidence: number
  detection_method: string
}

interface Technology {
  name: string
  version: string | null
  category: string
  confidence: number
  detection_method: string
  description: string | null
  website: string | null
  icon: string | null
  first_seen: string | null
  last_seen: string | null
}

interface AuditProjectsContextType {
  projects: AuditProject[]
  loading: boolean
  error: string | null
  refreshProjects: () => Promise<void>
  retryCount: number
  maxRetries: number
  isRefreshing: boolean
}

const AuditProjectsContext = createContext<AuditProjectsContextType | undefined>(undefined)

export function AuditProjectsProvider({ children }: { children: ReactNode }) {
  const { getAuditProjectsOptimized } = useSupabase()
  const [projects, setProjects] = useState<AuditProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const maxRetries = 3

  const refreshProjects = async (isRetry = false, isBackgroundRefresh = false) => {
    const startTime = performance.now()
    console.log('🚀 Starting projects fetch...', isRetry ? `(Retry ${retryCount + 1}/${maxRetries})` : '', isBackgroundRefresh ? '(Background)' : '')

    // Prevent multiple simultaneous requests unless it's a retry or background refresh
    if (loading && !isRetry && !isBackgroundRefresh) {
      console.log('⏸️ Request already in progress, skipping...')
      return
    }

    try {
      // Only set loading to true if we don't have data (first load) or it's not a background refresh
      if (!isBackgroundRefresh || projects.length === 0) {
        setLoading(true)
      } else {
        setIsRefreshing(true)
      }

      if (!isRetry) {
        setError(null)
        setRetryCount(0)
      }

      const fetchStartTime = performance.now()
      const { data, error } = await getAuditProjectsOptimized()
      const fetchEndTime = performance.now()

      console.log(`📡 Database fetch completed in ${(fetchEndTime - fetchStartTime).toFixed(2)}ms`)

      if (error) {
        console.error('❌ Error fetching projects:', error)
        
        if (retryCount < maxRetries) {
          console.log(`🔄 Retrying in 2 seconds... (${retryCount + 1}/${maxRetries})`)
          setRetryCount(prev => prev + 1)
          setTimeout(() => refreshProjects(true, isBackgroundRefresh), 2000)
          return
        } else {
          setError('Failed to load projects after multiple attempts')
          if (!isBackgroundRefresh) {
            setLoading(false)
          } else {
            setIsRefreshing(false)
          }
          return
        }
      }

      if (data) {
        const setDataStartTime = performance.now()
        setProjects(data)
        setRetryCount(0) // Reset retry count on success
        setError(null) // Clear any previous errors
        const setDataEndTime = performance.now()

        console.log(`📊 Set projects data in ${(setDataEndTime - setDataStartTime).toFixed(2)}ms`)
        console.log(`✅ Total projects loaded: ${data.length}`)
      }
    } catch (err) {
      console.error('❌ Unexpected error fetching projects:', err)
      
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying in 2 seconds... (${retryCount + 1}/${maxRetries})`)
        setRetryCount(prev => prev + 1)
        setTimeout(() => refreshProjects(true, isBackgroundRefresh), 2000)
        return
      } else {
        setError('Failed to load projects after multiple attempts')
      }
    } finally {
      const endTime = performance.now()
      const totalTime = endTime - startTime

      console.log(`⏱️ Total projects loading time: ${totalTime.toFixed(2)}ms`)
      console.log('🏁 Projects loading completed')

      if (!isBackgroundRefresh) {
        setLoading(false)
      } else {
        setIsRefreshing(false)
      }
    }
  }

  // Fetch projects data on mount
  useEffect(() => {
    refreshProjects()
  }, [getAuditProjectsOptimized])

  // Handle visibility change - refresh in background when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !loading && !error) {
        console.log('🔄 Tab became visible, refreshing projects in background...')
        refreshProjects(false, true) // Background refresh
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [loading, error, refreshProjects])

  const value = {
    projects,
    loading,
    error,
    refreshProjects,
    retryCount,
    maxRetries,
    isRefreshing
  }

  return (
    <AuditProjectsContext.Provider value={value}>
      {children}
    </AuditProjectsContext.Provider>
  )
}

export function useAuditProjects() {
  const context = useContext(AuditProjectsContext)
  if (context === undefined) {
    throw new Error('useAuditProjects must be used within an AuditProjectsProvider')
  }
  return context
}

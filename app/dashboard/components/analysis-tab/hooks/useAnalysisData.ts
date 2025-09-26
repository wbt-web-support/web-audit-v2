import { useState, useEffect, useRef, useCallback } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { AnalysisTabState, ScrapedPage } from '../types'
import { AuditProject } from '@/types/audit'

interface CachedData {
  project: AuditProject | null
  scrapedPages: ScrapedPage[]
  lastFetchTime: number
}

export function useAnalysisData(projectId: string, cachedData?: CachedData | null) {
  const { getAuditProject, getScrapedPages } = useSupabase()
  
  const [state, setState] = useState<AnalysisTabState>({
    project: null,
    scrapedPages: [],
    loading: true,
    error: null,
    activeSection: 'overview',
    dataFetched: false,
    lastFetchTime: 0,
    isScraping: false,
    scrapingError: null,
    isPageSpeedLoading: false,
    hasAutoStartedPageSpeed: false,
    loadedSections: new Set(['overview']),
    scrapedPagesLoaded: false,
    hasAutoStartedSeoAnalysis: false,
    dataVersion: 0,
    isRefreshing: false
  })

  const isProcessing = useRef(false)

  // Update state helper
  const updateState = useCallback((updates: Partial<AnalysisTabState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  // Fetch project data
  const fetchProjectData = useCallback(async () => {
    if (!projectId) {
      updateState({ error: 'No project ID provided', loading: false })
      return
    }

    // Check cached data first
    if (cachedData) {
      updateState({
        project: cachedData.project,
        scrapedPages: cachedData.scrapedPages,
        loading: false,
        error: null,
        dataFetched: true,
        lastFetchTime: cachedData.lastFetchTime
      })
      return
    }

    updateState({ loading: true, error: null })

    try {
      const { data: projectData, error: projectError } = await getAuditProject(projectId)
      
      if (projectError) {
        console.error('❌ Error fetching project data:', projectError)
        // Don't show error since project exists - just log and continue
        updateState({ loading: false })
        return
      }

      if (!projectData) {
        console.warn('⚠️ No project data received, but project exists - continuing...')
        updateState({ loading: false })
        return
      }

      updateState({
        project: projectData,
        dataFetched: true,
        lastFetchTime: Date.now(),
        loading: false
      })

    } catch (err) {
      console.error('Unexpected error:', err)
      updateState({ error: 'An unexpected error occurred while loading the project.', loading: false })
    }
  }, [projectId, cachedData, getAuditProject, updateState])

  // Fetch scraped pages
  const fetchScrapedPages = async () => {
    if (!projectId || state.scrapedPagesLoaded) return

    try {
      const { data: pages, error: pagesError } = await getScrapedPages(projectId)
      if (pagesError) {
        console.error('Error fetching scraped pages:', pagesError)
        return
      }
      
      if (pages) {
        updateState({ scrapedPages: pages, scrapedPagesLoaded: true })
      }
    } catch (error) {
      console.error('Error loading scraped pages:', error)
    }
  }

  // Refresh data
  const refreshData = async (forceRefresh = false) => {
    if (!projectId || state.isRefreshing) return
    
    const now = Date.now()
    const timeSinceLastFetch = now - state.lastFetchTime
    const REFRESH_THRESHOLD = 10 * 1000 // 10 seconds
    
    if (!forceRefresh && timeSinceLastFetch < REFRESH_THRESHOLD) {
      console.log('✅ Data is fresh, skipping refresh')
      return
    }
    
    updateState({ isRefreshing: true, loading: true, error: null })
    
    try {
      const { data: projectData, error: projectError } = await getAuditProject(projectId)
      
      if (projectError) {
        console.error('❌ Error refreshing project data:', projectError)
        // Don't show error since project exists - just log and continue
        updateState({ isRefreshing: false, loading: false })
        return
      }

      if (projectData) {
        const hasDataChanged = JSON.stringify(state.project) !== JSON.stringify(projectData)
        
        if (hasDataChanged) {
          console.log('📊 Data changed, updating components...')
          updateState({ project: projectData })
          
          if (projectData.status === 'completed') {
            await fetchScrapedPages()
          }
          
          updateState({ dataVersion: state.dataVersion + 1 })
        } else {
          console.log('✅ No data changes detected, skipping update')
        }
        
        updateState({ dataFetched: true, lastFetchTime: Date.now() })
      }
    } catch (err) {
      console.error('Error refreshing data:', err)
      updateState({ error: 'Failed to refresh data', isRefreshing: false, loading: false })
    } finally {
      updateState({ loading: false, isRefreshing: false })
    }
  }

  // Handle section change
  const handleSectionChange = async (section: string) => {
    updateState({ activeSection: section })
    
    if (!state.loadedSections.has(section)) {
      updateState({ 
        loadedSections: new Set([...state.loadedSections, section])
      })
    }
    
    // Load scraped pages if needed
    if ((section === 'pages' || section === 'images' || section === 'links') && 
        !state.scrapedPagesLoaded && 
        state.project?.status === 'completed') {
      await fetchScrapedPages()
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchProjectData()
  }, [fetchProjectData])

  return {
    state,
    updateState,
    fetchProjectData,
    fetchScrapedPages,
    refreshData,
    handleSectionChange,
    isProcessing
  }
}

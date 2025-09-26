'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { AuditProject, PageSpeedInsightsData, SEOAnalysisResult, Technology, CmsPlugin, CmsTheme, CmsComponent } from '@/types/audit'

interface CmsData {
  cms_detected: boolean
  cms_type: string | null
  cms_version: string | null
  cms_plugins: CmsPlugin[] | null
  cms_themes: CmsTheme[] | null
  cms_components: CmsComponent[] | null
  cms_confidence: number
  cms_detection_method: string | null
  cms_metadata: Record<string, unknown> | null
}

interface AnalysisCacheData {
  // Project data
  project: AuditProject | null
  
  // Analysis results
  pagespeedData: PageSpeedInsightsData | null
  seoAnalysis: SEOAnalysisResult | null
  technologiesData: Technology[] | null
  cmsData: CmsData | null
  
  // Loading states
  isPagespeedLoading: boolean
  isSeoLoading: boolean
  isTechnologiesLoading: boolean
  isCmsLoading: boolean
  
  // Error states
  pagespeedError: string | null
  seoError: string | null
  technologiesError: string | null
  cmsError: string | null
}

interface AnalysisCacheContextType {
  data: AnalysisCacheData
  updatePagespeedData: (data: PageSpeedInsightsData) => void
  updateSeoAnalysis: (analysis: SEOAnalysisResult) => void
  updateTechnologiesData: (data: Technology[]) => void
  updateCmsData: (data: CmsData) => void
  setPagespeedLoading: (loading: boolean) => void
  setSeoLoading: (loading: boolean) => void
  setTechnologiesLoading: (loading: boolean) => void
  setCmsLoading: (loading: boolean) => void
  setPagespeedError: (error: string | null) => void
  setSeoError: (error: string | null) => void
  setTechnologiesError: (error: string | null) => void
  setCmsError: (error: string | null) => void
  refreshAnalysis: (type: 'pagespeed' | 'seo' | 'technologies' | 'cms') => Promise<void>
}

const AnalysisCacheContext = createContext<AnalysisCacheContextType | null>(null)

interface AnalysisCacheProviderProps {
  children: ReactNode
  projectId: string
}

export function AnalysisCacheProvider({ children, projectId }: AnalysisCacheProviderProps) {
  const { getAuditProject, updateAuditProject } = useSupabase()
  
  const [data, setData] = useState<AnalysisCacheData>({
    project: null,
    pagespeedData: null,
    seoAnalysis: null,
    technologiesData: null,
    cmsData: null,
    isPagespeedLoading: false,
    isSeoLoading: false,
    isTechnologiesLoading: false,
    isCmsLoading: false,
    pagespeedError: null,
    seoError: null,
    technologiesError: null,
    cmsError: null
  })

  // Track if PageSpeed analysis is already running to prevent duplicates
  const pagespeedRunningRef = useRef(false)

  const refreshAnalysis = useCallback(async (type: 'pagespeed' | 'seo' | 'technologies' | 'cms') => {
    if (!data.project) return

    switch (type) {
      case 'pagespeed':
        // Prevent duplicate PageSpeed analysis
        if (pagespeedRunningRef.current) {
          console.log('PageSpeed analysis already running, skipping...')
          return
        }

        setPagespeedLoading(true)
        setPagespeedError(null)
        pagespeedRunningRef.current = true
        
        // Start PageSpeed analysis in background without blocking UI
        const runPageSpeedAnalysis = async () => {
          try {
            // Update project with loading state
            await updateAuditProject(data.project!.id, {
              pagespeed_insights_loading: true,
              pagespeed_insights_data: null
            })

            // Call PageSpeed API
            const response = await fetch('/api/pagespeed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                projectId: data.project!.id,
                url: data.project!.site_url 
              })
            })

            if (!response.ok) {
              throw new Error(`PageSpeed API error: ${response.status}`)
            }

            const result = await response.json()
            if (result.success) {
              updatePagespeedData(result.analysis)
              // Update database
              await updateAuditProject(data.project!.id, { 
                pagespeed_insights_data: result.analysis,
                pagespeed_insights_loading: false
              })
            } else {
              setPagespeedError(result.error || 'PageSpeed analysis failed')
            }
          } catch (error) {
            console.error('PageSpeed analysis error:', error)
            setPagespeedError('Failed to perform PageSpeed analysis')
          } finally {
            setPagespeedLoading(false)
            pagespeedRunningRef.current = false
          }
        }

        // Run in background without blocking
        runPageSpeedAnalysis()
        break

      case 'seo':
        setSeoLoading(true)
        setSeoError(null)
        try {
          // SEO analysis is typically done client-side
          const { analyzeSEO } = await import('@/lib/seo-analysis')
          const analysis = analyzeSEO(data.project.scraping_data?.html_content || '', data.project.site_url)
          updateSeoAnalysis(analysis)
          await updateAuditProject(data.project.id, { seo_analysis: analysis })
        } catch {
          setSeoError('Failed to perform SEO analysis')
        } finally {
          setSeoLoading(false)
        }
        break

      case 'technologies':
        setTechnologiesLoading(true)
        setTechnologiesError(null)
        try {
          // Technologies analysis would go here
          // For now, just mark as completed
          setTechnologiesLoading(false)
        } catch {
          setTechnologiesError('Failed to perform technologies analysis')
          setTechnologiesLoading(false)
        }
        break

      case 'cms':
        setCmsLoading(true)
        setCmsError(null)
        try {
          // CMS analysis would go here
          // For now, just mark as completed
          setCmsLoading(false)
        } catch {
          setCmsError('Failed to perform CMS analysis')
          setCmsLoading(false)
        }
        break
    }
  }, [data.project, updateAuditProject])

  // Load initial project data
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        const { data: projectData, error: projectError } = await getAuditProject(projectId)
        
        if (projectError) {
          console.error('Error fetching project:', projectError)
          return
        }

        if (!projectData) {
          return
        }

        setData(prev => ({
          ...prev,
          project: projectData,
          pagespeedData: projectData.pagespeed_insights_data || null,
          seoAnalysis: projectData.seo_analysis || null,
          technologiesData: projectData.technologies || null,
          cmsData: {
            cms_detected: projectData.cms_detected,
            cms_type: projectData.cms_type,
            cms_version: projectData.cms_version,
            cms_plugins: projectData.cms_plugins,
            cms_themes: projectData.cms_themes,
            cms_components: projectData.cms_components,
            cms_confidence: projectData.cms_confidence,
            cms_detection_method: projectData.cms_detection_method,
            cms_metadata: projectData.cms_metadata
          }
        }))

        // Auto-trigger analyses if data is missing - start immediately
        const shouldStartPageSpeed = !projectData.pagespeed_insights_data && !projectData.pagespeed_insights_loading
        const shouldStartSEO = !projectData.seo_analysis

        if (shouldStartPageSpeed) {
          console.log('🚀 Auto-triggering PageSpeed analysis in background...')
          // Start analysis in background with longer delay to allow UI to render first
          setTimeout(() => {
            refreshAnalysis('pagespeed').catch(err => {
              console.error('Auto-triggered PageSpeed analysis failed:', err)
            })
          }, 2000) // 2 second delay to allow scraped data to show first
        }

        if (shouldStartSEO) {
          console.log('🚀 Auto-triggering SEO analysis...')
          // Start analysis immediately in background
          setTimeout(() => {
            refreshAnalysis('seo').catch(err => {
              console.error('Auto-triggered SEO analysis failed:', err)
            })
          }, 200) // Small delay to ensure state is updated
        }

      } catch (err) {
        console.error('Error loading project data:', err)
      }
    }

    if (projectId) {
      loadProjectData()
    }
  }, [projectId, getAuditProject, refreshAnalysis])

  const updatePagespeedData = (pagespeedData: PageSpeedInsightsData) => {
    setData(prev => ({ ...prev, pagespeedData }))
  }

  const updateSeoAnalysis = (seoAnalysis: SEOAnalysisResult) => {
    setData(prev => ({ ...prev, seoAnalysis }))
  }

  const updateTechnologiesData = (technologiesData: Technology[]) => {
    setData(prev => ({ ...prev, technologiesData }))
  }

  const updateCmsData = (cmsData: CmsData) => {
    setData(prev => ({ ...prev, cmsData }))
  }

  const setPagespeedLoading = (loading: boolean) => {
    setData(prev => ({ ...prev, isPagespeedLoading: loading }))
  }

  const setSeoLoading = (loading: boolean) => {
    setData(prev => ({ ...prev, isSeoLoading: loading }))
  }

  const setTechnologiesLoading = (loading: boolean) => {
    setData(prev => ({ ...prev, isTechnologiesLoading: loading }))
  }

  const setCmsLoading = (loading: boolean) => {
    setData(prev => ({ ...prev, isCmsLoading: loading }))
  }

  const setPagespeedError = (error: string | null) => {
    setData(prev => ({ ...prev, pagespeedError: error }))
  }

  const setSeoError = (error: string | null) => {
    setData(prev => ({ ...prev, seoError: error }))
  }

  const setTechnologiesError = (error: string | null) => {
    setData(prev => ({ ...prev, technologiesError: error }))
  }

  const setCmsError = (error: string | null) => {
    setData(prev => ({ ...prev, cmsError: error }))
  }

  const contextValue: AnalysisCacheContextType = {
    data,
    updatePagespeedData,
    updateSeoAnalysis,
    updateTechnologiesData,
    updateCmsData,
    setPagespeedLoading,
    setSeoLoading,
    setTechnologiesLoading,
    setCmsLoading,
    setPagespeedError,
    setSeoError,
    setTechnologiesError,
    setCmsError,
    refreshAnalysis
  }

  return (
    <AnalysisCacheContext.Provider value={contextValue}>
      {children}
    </AnalysisCacheContext.Provider>
  )
}

export function useAnalysisCache() {
  const context = useContext(AnalysisCacheContext)
  if (!context) {
    throw new Error('useAnalysisCache must be used within an AnalysisCacheProvider')
  }
  return context
}

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { AuditProject } from '@/types/audit'
import { fetchPageSpeedInsights } from '@/lib/pagespeed'

interface AnalysisCacheData {
  // Project data
  project: AuditProject | null
  
  // Analysis results
  pagespeedData: any
  seoAnalysis: any
  technologiesData: any
  cmsData: any
  
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
  updatePagespeedData: (data: any) => void
  updateSeoAnalysis: (analysis: any) => void
  updateTechnologiesData: (data: any) => void
  updateCmsData: (data: any) => void
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
          console.log('🚀 Auto-triggering PageSpeed analysis...')
          // Start analysis immediately in background
          setTimeout(() => {
            refreshAnalysis('pagespeed').catch(err => {
              console.error('Auto-triggered PageSpeed analysis failed:', err)
            })
          }, 100) // Small delay to ensure state is updated
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
  }, [projectId, getAuditProject])

  const updatePagespeedData = (pagespeedData: any) => {
    setData(prev => ({ ...prev, pagespeedData }))
  }

  const updateSeoAnalysis = (seoAnalysis: any) => {
    setData(prev => ({ ...prev, seoAnalysis }))
  }

  const updateTechnologiesData = (technologiesData: any) => {
    setData(prev => ({ ...prev, technologiesData }))
  }

  const updateCmsData = (cmsData: any) => {
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

  const refreshAnalysis = async (type: 'pagespeed' | 'seo' | 'technologies' | 'cms') => {
    if (!data.project) return

    switch (type) {
      case 'pagespeed':
        setPagespeedLoading(true)
        setPagespeedError(null)
        try {
          // Update project with loading state
          await updateAuditProject(data.project.id, {
            pagespeed_insights_loading: true,
            pagespeed_insights_error: null
          })

          const { data: pagespeedResult, error } = await fetchPageSpeedInsights(data.project.site_url)
          
          if (error) {
            console.error('❌ PageSpeed analysis error:', error)
            setPagespeedError(error)
            await updateAuditProject(data.project.id, {
              pagespeed_insights_loading: false,
              pagespeed_insights_error: error,
              pagespeed_insights_data: null
            })
          } else if (pagespeedResult) {
            updatePagespeedData(pagespeedResult)
            await updateAuditProject(data.project.id, {
              pagespeed_insights_data: pagespeedResult,
              pagespeed_insights_loading: false,
              pagespeed_insights_error: null
            })
          }
        } catch (err) {
          console.error('❌ PageSpeed analysis unexpected error:', err)
          const errorMessage = `Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`
          setPagespeedError(errorMessage)
          await updateAuditProject(data.project.id, {
            pagespeed_insights_loading: false,
            pagespeed_insights_error: errorMessage,
            pagespeed_insights_data: null
          })
        } finally {
          setPagespeedLoading(false)
        }
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
        } catch (err) {
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
        } catch (err) {
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
        } catch (err) {
          setCmsError('Failed to perform CMS analysis')
          setCmsLoading(false)
        }
        break
    }
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

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'

interface PageAnalysisCacheData {
  // Page data
  page: any
  project: any
  
  // Analysis results
  geminiAnalysis: any
  performanceAnalysis: any
  seoAnalysis: any
  
  // Loading states
  isGeminiLoading: boolean
  isPerformanceLoading: boolean
  isSeoLoading: boolean
  
  // Error states
  geminiError: string | null
  performanceError: string | null
  seoError: string | null
}

interface PageAnalysisCacheContextType {
  data: PageAnalysisCacheData
  updateGeminiAnalysis: (analysis: any) => void
  updatePerformanceAnalysis: (analysis: any) => void
  updateSeoAnalysis: (analysis: any) => void
  setGeminiLoading: (loading: boolean) => void
  setPerformanceLoading: (loading: boolean) => void
  setSeoLoading: (loading: boolean) => void
  setGeminiError: (error: string | null) => void
  setPerformanceError: (error: string | null) => void
  setSeoError: (error: string | null) => void
  refreshAnalysis: (type: 'gemini' | 'performance' | 'seo') => Promise<void>
}

const PageAnalysisCacheContext = createContext<PageAnalysisCacheContextType | null>(null)

interface PageAnalysisCacheProviderProps {
  children: ReactNode
  pageId: string
}

export function PageAnalysisCacheProvider({ children, pageId }: PageAnalysisCacheProviderProps) {
  const { getScrapedPage, getAuditProject, updateScrapedPage } = useSupabase()
  
  const [data, setData] = useState<PageAnalysisCacheData>({
    page: null,
    project: null,
    geminiAnalysis: null,
    performanceAnalysis: null,
    seoAnalysis: null,
    isGeminiLoading: false,
    isPerformanceLoading: false,
    isSeoLoading: false,
    geminiError: null,
    performanceError: null,
    seoError: null
  })

  // Load initial page data
  useEffect(() => {
    const loadPageData = async () => {
      try {
        const { data: foundPage, error: pageError } = await getScrapedPage(pageId)
        
        if (pageError) {
          console.error('Error fetching scraped page:', pageError)
          return
        }

        if (!foundPage) {
          return
        }

        setData(prev => ({
          ...prev,
          page: foundPage,
          geminiAnalysis: (foundPage as any).gemini_analysis || null,
          performanceAnalysis: (foundPage as any).performance_analysis || null
        }))

        // Auto-trigger performance analysis if no cached data exists
        if (!(foundPage as any).performance_analysis) {
          console.log('🚀 PageAnalysisCache: No performance analysis found, auto-triggering...')
          setTimeout(() => {
            refreshAnalysis('performance').catch(err => {
              console.error('PageAnalysisCache auto-trigger failed:', err)
            })
          }, 1000) // 1 second delay to allow cache to initialize
        }

        // Get project data if available
        if (foundPage.audit_project_id) {
          const { data: projectData, error: projectError } = await getAuditProject(foundPage.audit_project_id)
          
          if (!projectError && projectData) {
            setData(prev => ({
              ...prev,
              project: projectData,
              seoAnalysis: projectData.seo_analysis || null
            }))
          }
        }
      } catch (err) {
        console.error('Error loading page data:', err)
      }
    }

    if (pageId) {
      loadPageData()
    }
  }, [pageId, getScrapedPage, getAuditProject])

  const updateGeminiAnalysis = (analysis: any) => {
    setData(prev => ({ ...prev, geminiAnalysis: analysis }))
  }

  const updatePerformanceAnalysis = (analysis: any) => {
    setData(prev => ({ ...prev, performanceAnalysis: analysis }))
  }

  const updateSeoAnalysis = (analysis: any) => {
    setData(prev => ({ ...prev, seoAnalysis: analysis }))
  }

  const setGeminiLoading = (loading: boolean) => {
    setData(prev => ({ ...prev, isGeminiLoading: loading }))
  }

  const setPerformanceLoading = (loading: boolean) => {
    setData(prev => ({ ...prev, isPerformanceLoading: loading }))
  }

  const setSeoLoading = (loading: boolean) => {
    setData(prev => ({ ...prev, isSeoLoading: loading }))
  }

  const setGeminiError = (error: string | null) => {
    setData(prev => ({ ...prev, geminiError: error }))
  }

  const setPerformanceError = (error: string | null) => {
    setData(prev => ({ ...prev, performanceError: error }))
  }

  const setSeoError = (error: string | null) => {
    setData(prev => ({ ...prev, seoError: error }))
  }

  const refreshAnalysis = async (type: 'gemini' | 'performance' | 'seo') => {
    if (!data.page) return

    switch (type) {
      case 'gemini':
        setGeminiLoading(true)
        setGeminiError(null)
        try {
          // Trigger Gemini analysis
          const response = await fetch('/api/gemini-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pageId: data.page.id,
              content: data.page.filtered_content || data.page.html_content,
              url: data.page.url
            })
          })
          const result = await response.json()
          if (result.success) {
            updateGeminiAnalysis(result.analysis)
            // Update database
            await updateScrapedPage(data.page.id, { gemini_analysis: result.analysis } as any)
          } else {
            setGeminiError(result.error || 'Analysis failed')
          }
        } catch (err) {
          setGeminiError('Failed to perform analysis')
        } finally {
          setGeminiLoading(false)
        }
        break

      case 'performance':
        setPerformanceLoading(true)
        setPerformanceError(null)
        try {
          const response = await fetch('/api/performance-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pageId: data.page.id,
              url: data.page.url
            })
          })
          const result = await response.json()
          if (result.success) {
            updatePerformanceAnalysis(result.analysis)
            // Update database
            await updateScrapedPage(data.page.id, { performance_analysis: result.analysis } as any)
          } else {
            setPerformanceError(result.error || 'Analysis failed')
          }
        } catch (err) {
          setPerformanceError('Failed to perform analysis')
        } finally {
          setPerformanceLoading(false)
        }
        break

      case 'seo':
        setSeoLoading(true)
        setSeoError(null)
        try {
          // SEO analysis is typically done client-side
          const { analyzeSEO } = await import('@/lib/seo-analysis')
          const analysis = analyzeSEO(data.page.html_content, data.page.url)
          updateSeoAnalysis(analysis)
        } catch (err) {
          setSeoError('Failed to perform SEO analysis')
        } finally {
          setSeoLoading(false)
        }
        break
    }
  }

  const contextValue: PageAnalysisCacheContextType = {
    data,
    updateGeminiAnalysis,
    updatePerformanceAnalysis,
    updateSeoAnalysis,
    setGeminiLoading,
    setPerformanceLoading,
    setSeoLoading,
    setGeminiError,
    setPerformanceError,
    setSeoError,
    refreshAnalysis
  }

  return (
    <PageAnalysisCacheContext.Provider value={contextValue}>
      {children}
    </PageAnalysisCacheContext.Provider>
  )
}

export function usePageAnalysisCache() {
  const context = useContext(PageAnalysisCacheContext)
  if (!context) {
    throw new Error('usePageAnalysisCache must be used within a PageAnalysisCacheProvider')
  }
  return context
}

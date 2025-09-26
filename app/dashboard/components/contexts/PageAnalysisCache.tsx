'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { AuditProject, SEOAnalysisResult } from '@/types/audit'
import { GeminiAnalysisResult } from '@/lib/gemini'

interface PerformanceAnalysisResult {
  score: number
  metrics: {
    firstContentfulPaint: number
    largestContentfulPaint: number
    cumulativeLayoutShift: number
    speedIndex: number
    totalBlockingTime: number
    interactive: number
  }
  recommendations: string[]
  issues: Array<{
    type: string
    severity: 'high' | 'medium' | 'low'
    description: string
    fix: string
  }>
}

interface ScrapedPageData {
  id: string
  audit_project_id: string
  user_id: string
  url: string
  status_code: number | null
  title: string | null
  description: string | null
  html_content: string | null
  filtered_content?: string | null
  html_content_length: number | null
  links_count: number
  images_count: number
  links: Array<{url: string, text: string, isExternal: boolean}> | null
  images: Array<{src: string, alt?: string, title?: string}> | null
  meta_tags_count: number
  technologies_count: number
  technologies: string[] | null
  cms_type: string | null
  cms_version: string | null
  cms_plugins: string[] | null
  social_meta_tags: Record<string, string> | null
  social_meta_tags_count: number
  is_external: boolean
  response_time: number | null
  performance_analysis: Record<string, unknown> | undefined
  gemini_analysis?: GeminiAnalysisResult | null
  created_at: string
  updated_at: string
}

interface PageAnalysisCacheData {
  // Page data
  page: ScrapedPageData | null
  project: AuditProject | null
  
  // Analysis results
  geminiAnalysis: GeminiAnalysisResult | null
  performanceAnalysis: PerformanceAnalysisResult | null
  seoAnalysis: SEOAnalysisResult | null
  
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
  updateGeminiAnalysis: (analysis: GeminiAnalysisResult) => void
  updatePerformanceAnalysis: (analysis: PerformanceAnalysisResult) => void
  updateSeoAnalysis: (analysis: SEOAnalysisResult) => void
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

  const updateGeminiAnalysis = useCallback((analysis: GeminiAnalysisResult) => {
    setData(prev => ({ ...prev, geminiAnalysis: analysis }))
  }, [])

  const updatePerformanceAnalysis = useCallback((analysis: PerformanceAnalysisResult) => {
    setData(prev => ({ ...prev, performanceAnalysis: analysis }))
  }, [])

  const updateSeoAnalysis = useCallback((analysis: SEOAnalysisResult) => {
    setData(prev => ({ ...prev, seoAnalysis: analysis }))
  }, [])

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

  const refreshAnalysis = useCallback(async (type: 'gemini' | 'performance' | 'seo') => {
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
            updateGeminiAnalysis(result.analysis as GeminiAnalysisResult)
            // Update database
            await updateScrapedPage(data.page.id, { gemini_analysis: result.analysis } as Partial<ScrapedPageData>)
          } else {
            setGeminiError(result.error || 'Analysis failed')
          }
        } catch {
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
            updatePerformanceAnalysis(result.analysis as PerformanceAnalysisResult)
            // Update database
            await updateScrapedPage(data.page.id, { performance_analysis: result.analysis } as Partial<ScrapedPageData>)
          } else {
            setPerformanceError(result.error || 'Analysis failed')
          }
        } catch {
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
          const analysis = analyzeSEO(data.page.html_content || '', data.page.url)
          updateSeoAnalysis(analysis)
        } catch {
          setSeoError('Failed to perform SEO analysis')
        } finally {
          setSeoLoading(false)
        }
        break
    }
  }, [data.page, updateGeminiAnalysis, updatePerformanceAnalysis, updateSeoAnalysis, updateScrapedPage])

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

        const pageData = foundPage as ScrapedPageData
        setData(prev => ({
          ...prev,
          page: pageData,
          geminiAnalysis: pageData.gemini_analysis || null,
          performanceAnalysis: pageData.performance_analysis ? (pageData.performance_analysis as unknown as PerformanceAnalysisResult) : null
        }))

        // Auto-trigger performance analysis if no cached data exists
        if (!pageData.performance_analysis) {
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
  }, [pageId, getScrapedPage, getAuditProject, refreshAnalysis])

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

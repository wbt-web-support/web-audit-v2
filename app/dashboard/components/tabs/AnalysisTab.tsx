'use client'

import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { AuditProject } from '@/types/audit'
import { motion } from 'framer-motion'
import { fetchPageSpeedInsights } from '@/lib/pagespeed'
import { analyzeSEO } from '@/lib/seo-analysis'
import {
  AnalysisHeader,
  OverviewSection,
  ModernLoader
} from '../analysis-tab-components'

// Lazy load heavy components
const PagesSection = lazy(() => import('../analysis-tab-components/PagesSection'))
const TechnologiesSection = lazy(() => import('../analysis-tab-components/TechnologiesSection'))
const CmsSection = lazy(() => import('../analysis-tab-components/CmsSection'))
const PerformanceSection = lazy(() => import('../analysis-tab-components/PerformanceSection'))
const ImagesSection = lazy(() => import('../analysis-tab-components/ImagesSection'))
const LinksSection = lazy(() => import('../analysis-tab-components/LinksSection'))
const SEOAnalysisSection = lazy(() => import('../analysis-tab-components/SEOAnalysisSection'))
// const ExtractedKeysSection = lazy(() => import('../analysis-tab-components/ExtractedKeysSection'))

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
  const { getAuditProject, getScrapedPages, createScrapedPages, updateAuditProject } = useSupabase()
  const [project, setProject] = useState<AuditProject | null>(null)
  const [scrapedPages, setScrapedPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('overview')
  const [dataFetched, setDataFetched] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  
  // Scraping states
  const [isScraping, setIsScraping] = useState(false)
  const [scrapingError, setScrapingError] = useState<string | null>(null)
  const isProcessing = useRef(false)
  
  // PageSpeed states
  const [isPageSpeedLoading, setIsPageSpeedLoading] = useState(false)
  const [, setPageSpeedError] = useState<string | null>(null)
  const [hasAutoStartedPageSpeed, setHasAutoStartedPageSpeed] = useState(false)
  const [loadedSections, setLoadedSections] = useState<Set<string>>(new Set(['overview']))
  const [scrapedPagesLoaded, setScrapedPagesLoaded] = useState(false)
  
  // SEO Analysis states
  const [hasAutoStartedSeoAnalysis, setHasAutoStartedSeoAnalysis] = useState(false)

  console.log('🔍 AnalysisTab rendered for project:', projectId, 'cachedData:', !!cachedData, 'loading:', loading)
  
  // Performance monitoring
  useEffect(() => {
    const startTime = performance.now()
    return () => {
      const endTime = performance.now()
      console.log(`⏱️ AnalysisTab render time: ${endTime - startTime}ms`)
    }
  })

  // Function to handle section loading
  const handleSectionChange = async (section: string) => {
    setActiveSection(section)
    if (!loadedSections.has(section)) {
      setLoadedSections(prev => new Set([...prev, section]))
    }
    
    // Load scraped pages if needed for this section
    if ((section === 'pages' || section === 'images' || section === 'links') && !scrapedPagesLoaded && project?.status === 'completed') {
      console.log('📄 Loading scraped pages for section:', section)
      try {
        const { data: pages, error: pagesError } = await getScrapedPages(projectId)
        if (pagesError) {
          console.error('Error fetching scraped pages:', pagesError)
        } else if (pages) {
          setScrapedPages(pages)
          setScrapedPagesLoaded(true)
          console.log('✅ Scraped pages loaded:', pages.length)
        }
      } catch (error) {
        console.error('Error loading scraped pages:', error)
      }
    }
  }

  // Loading skeleton component
  const SectionSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  )

  // Function to process CMS data and remove duplicates
  const processCmsData = (cmsData: any) => {
    if (!cmsData) {
      return {
        cms_type: null,
        cms_version: null,
        cms_plugins: null,
        cms_themes: null,
        cms_components: null,
        cms_confidence: 0,
        cms_detection_method: null,
        cms_metadata: null
      }
    }

    // Process plugins - remove duplicates and add metadata
    const uniquePlugins = cmsData.plugins ? 
      cmsData.plugins.reduce((acc: any[], plugin: any) => {
        const existing = acc.find(p => p.name === plugin.name)
        if (!existing) {
          acc.push({
            name: plugin.name || 'Unknown Plugin',
            version: plugin.version || null,
            active: plugin.active !== false,
            path: plugin.path || null,
            description: plugin.description || null,
            author: plugin.author || null,
            confidence: plugin.confidence || 0.8,
            detection_method: plugin.detection_method || 'unknown'
          })
        } else {
          // Update existing plugin with higher confidence or more info
          if ((plugin.confidence || 0.8) > existing.confidence) {
            Object.assign(existing, {
              version: plugin.version || existing.version,
              active: plugin.active !== false ? plugin.active : existing.active,
              path: plugin.path || existing.path,
              description: plugin.description || existing.description,
              author: plugin.author || existing.author,
              confidence: plugin.confidence || existing.confidence,
              detection_method: plugin.detection_method || existing.detection_method
            })
          }
        }
        return acc
      }, []) : null

    // Process themes - remove duplicates and add metadata
    const uniqueThemes = cmsData.themes ? 
      cmsData.themes.reduce((acc: any[], theme: any) => {
        const existing = acc.find(t => t.name === theme.name)
        if (!existing) {
          acc.push({
            name: theme.name || 'Unknown Theme',
            version: theme.version || null,
            active: theme.active !== false,
            path: theme.path || null,
            description: theme.description || null,
            author: theme.author || null,
            confidence: theme.confidence || 0.8,
            detection_method: theme.detection_method || 'unknown'
          })
        } else {
          // Update existing theme with higher confidence or more info
          if ((theme.confidence || 0.8) > existing.confidence) {
            Object.assign(existing, {
              version: theme.version || existing.version,
              active: theme.active !== false ? theme.active : existing.active,
              path: theme.path || existing.path,
              description: theme.description || existing.description,
              author: theme.author || existing.author,
              confidence: theme.confidence || existing.confidence,
              detection_method: theme.detection_method || existing.detection_method
            })
          }
        }
        return acc
      }, []) : null

    // Process components - remove duplicates and add metadata
    const uniqueComponents = cmsData.components ? 
      cmsData.components.reduce((acc: any[], component: any) => {
        const existing = acc.find(c => c.name === component.name && c.type === component.type)
        if (!existing) {
          acc.push({
            name: component.name || 'Unknown Component',
            type: component.type || 'unknown',
            version: component.version || null,
            active: component.active !== false,
            path: component.path || null,
            description: component.description || null,
            confidence: component.confidence || 0.8,
            detection_method: component.detection_method || 'unknown'
          })
        } else {
          // Update existing component with higher confidence or more info
          if ((component.confidence || 0.8) > existing.confidence) {
            Object.assign(existing, {
              version: component.version || existing.version,
              active: component.active !== false ? component.active : existing.active,
              path: component.path || existing.path,
              description: component.description || existing.description,
              confidence: component.confidence || existing.confidence,
              detection_method: component.detection_method || existing.detection_method
            })
          }
        }
        return acc
      }, []) : null

    return {
      cms_type: cmsData.type || null,
      cms_version: cmsData.version || null,
      cms_plugins: uniquePlugins,
      cms_themes: uniqueThemes,
      cms_components: uniqueComponents,
      cms_confidence: cmsData.confidence || 0,
      cms_detection_method: cmsData.detection_method || null,
      cms_metadata: {
        detection_timestamp: new Date().toISOString(),
        total_plugins: uniquePlugins?.length || 0,
        total_themes: uniqueThemes?.length || 0,
        total_components: uniqueComponents?.length || 0,
        active_plugins: uniquePlugins?.filter((p: any) => p.active).length || 0,
        active_themes: uniqueThemes?.filter((t: any) => t.active).length || 0,
        active_components: uniqueComponents?.filter((c: any) => c.active).length || 0,
        ...cmsData.metadata
      }
    }
  }

  // Function to process technologies data and remove duplicates
  const processTechnologiesData = (technologiesData: any) => {
    if (!technologiesData || !Array.isArray(technologiesData)) {
      return {
        technologies: null,
        technologies_confidence: 0,
        technologies_detection_method: null,
        technologies_metadata: null
      }
    }

    // Process technologies - handle both string arrays and object arrays
    const allTechnologies: any[] = []
    
    technologiesData.forEach(tech => {
      // Check if it's a string (simple technology name) or an object (detailed technology)
      if (typeof tech === 'string') {
        allTechnologies.push({
          name: tech,
          version: null,
          category: 'unknown',
          confidence: 0.9,
          detection_method: 'summary',
          description: null,
          website: null,
          icon: null
        })
      } else if (typeof tech === 'object' && tech !== null) {
        // It's a detailed technology object
        allTechnologies.push(tech)
      }
    })

    // Process technologies - remove duplicates and add metadata
    const uniqueTechnologies = allTechnologies.reduce((acc: any[], tech: any) => {
      const existing = acc.find(t => t.name === tech.name && t.category === (tech.category || 'unknown'))
      
      if (!existing) {
        acc.push({
          name: tech.name || 'Unknown Technology',
          version: tech.version || null,
          category: tech.category || 'unknown',
          confidence: tech.confidence || 0.8,
          detection_method: tech.detection_method || 'unknown',
          description: tech.description || null,
          website: tech.website || null,
          icon: tech.icon || null,
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString()
        })
      } else {
        // Update existing technology with higher confidence or more info
        if ((tech.confidence || 0.8) > existing.confidence) {
          Object.assign(existing, {
            version: tech.version || existing.version,
            confidence: tech.confidence || existing.confidence,
            detection_method: tech.detection_method || existing.detection_method,
            description: tech.description || existing.description,
            website: tech.website || existing.website,
            icon: tech.icon || existing.icon,
            last_seen: new Date().toISOString()
          })
        } else {
          // Update last_seen even if confidence is lower
          existing.last_seen = new Date().toISOString()
        }
      }
      return acc
    }, [])

    // Calculate overall confidence
    const overallConfidence = uniqueTechnologies.length > 0 
      ? uniqueTechnologies.reduce((sum, tech) => sum + tech.confidence, 0) / uniqueTechnologies.length
      : 0

    // Group technologies by category
    const technologiesByCategory = uniqueTechnologies.reduce((acc: any, tech: any) => {
      const category = tech.category || 'unknown'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(tech)
      return acc
    }, {})

    return {
      technologies: uniqueTechnologies,
      technologies_confidence: overallConfidence,
      technologies_detection_method: 'mixed', // Could be more specific based on detection methods
      technologies_metadata: {
        detection_timestamp: new Date().toISOString(),
        total_technologies: uniqueTechnologies.length,
        categories: Object.keys(technologiesByCategory),
        technologies_by_category: technologiesByCategory,
        high_confidence_technologies: uniqueTechnologies.filter((t: any) => t.confidence >= 0.8).length,
        medium_confidence_technologies: uniqueTechnologies.filter((t: any) => t.confidence >= 0.5 && t.confidence < 0.8).length,
        low_confidence_technologies: uniqueTechnologies.filter((t: any) => t.confidence < 0.5).length
      }
    }
  }

  // Function to handle PageSpeed Insights API call
  const handlePageSpeedInsights = async (url: string, projectId: string) => {
    try {
      console.log('🚀 Starting PageSpeed Insights for URL:', url)
      setIsPageSpeedLoading(true)
      setPageSpeedError(null)
      
      // Update project with loading state
      await updateAuditProject(projectId, {
        pagespeed_insights_loading: true,
        pagespeed_insights_error: null
      })
      
      const { data, error } = await fetchPageSpeedInsights(url)
      
      if (error) {
        console.error('❌ PageSpeed Insights error:', error)
        setPageSpeedError(error)
        
        // Update project with error state
        await updateAuditProject(projectId, {
          pagespeed_insights_loading: false,
          pagespeed_insights_error: error,
          pagespeed_insights_data: null
        })
      } else if (data) {
        console.log('✅ PageSpeed Insights data received:', data)
        
        // Update project with PageSpeed data
        await updateAuditProject(projectId, {
          pagespeed_insights_data: data,
          pagespeed_insights_loading: false,
          pagespeed_insights_error: null
        })
        
        // Update local project state
        setProject(prev => prev ? {
          ...prev,
          pagespeed_insights_data: data,
          pagespeed_insights_loading: false,
          pagespeed_insights_error: null
        } : null)
      }
    } catch (error) {
      console.error('❌ PageSpeed Insights unexpected error:', error)
      const errorMessage = `PageSpeed Insights failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      setPageSpeedError(errorMessage)
      
      // Update project with error state
      await updateAuditProject(projectId, {
        pagespeed_insights_loading: false,
        pagespeed_insights_error: errorMessage,
        pagespeed_insights_data: null
      })
    } finally {
      setIsPageSpeedLoading(false)
    }
  }

  // Function to handle SEO Analysis using scraped pages data
  const handleSeoAnalysis = async (projectId: string, scrapedPages: any[]) => {
    try {
      console.log('🚀 Starting SEO Analysis for project:', projectId)
      
      // Get the first page's HTML content from scraped pages
      const firstPage = scrapedPages.find(page => page.audit_project_id === projectId)
      if (!firstPage?.html_content) {
        throw new Error('No HTML content available for SEO analysis')
      }
      
      // Perform SEO analysis
      const seoAnalysis = analyzeSEO(firstPage.html_content, project?.site_url || '')
      
      console.log('✅ SEO Analysis completed:', seoAnalysis)
      
      // Update project with SEO analysis data
      await updateAuditProject(projectId, {
        seo_analysis: seoAnalysis
      })
      
      // Update local project state
      setProject(prev => prev ? {
        ...prev,
        seo_analysis: seoAnalysis
      } : null)
      
    } catch (error) {
      console.error('❌ SEO Analysis error:', error)
    }
  }

  // Function to process scraping data and save to database
  const processScrapingData = async (scrapingData: any, projectId: string) => {
    try {
      console.log('🔍 Processing scraping data...', scrapingData)
      
      if (!scrapingData.pages || !Array.isArray(scrapingData.pages)) {
        console.warn('⚠️ No pages data found in scraping response')
        setScrapingError('No pages data found in scraping response')
        return
      }

      // Prepare scraped pages data
      const scrapedPagesData = scrapingData.pages.map((page: any) => ({
        audit_project_id: projectId,
        url: page.url,
        status_code: page.statusCode,
        title: page.title,
        description: page.metaTags?.find((tag: any) => tag.name === 'description')?.content || null,
        html_content: page.html,
        html_content_length: page.htmlContentLength,
        links_count: page.links?.length || 0,
        images_count: page.images?.length || 0,
        meta_tags_count: page.metaTags?.length || 0,
        technologies_count: page.technologies?.length || 0,
        technologies: page.technologies || null,
        cms_type: scrapingData.extractedData?.cms?.type || null,
        cms_version: scrapingData.extractedData?.cms?.version || null,
        cms_plugins: scrapingData.extractedData?.cms?.plugins || null,
        is_external: false, // Main page is not external
        response_time: scrapingData.responseTime
      }))

      console.log('📊 Prepared scraped pages data:', scrapedPagesData)

      // Save scraped pages to database
      const { data: savedPages, error: pagesError } = await createScrapedPages(scrapedPagesData)
      
      if (pagesError) {
        console.error('❌ Error saving scraped pages:', pagesError)
        setScrapingError('Failed to save scraped pages')
        return
      } else {
        console.log('✅ Scraped pages saved successfully:', savedPages?.length || 0, 'pages')
      }

      // Process CMS data to avoid repetition and extract unique information
      const cmsData = processCmsData(scrapingData.extractedData?.cms)
      
      // Process technologies data to avoid repetition and extract unique information
      const technologiesData = processTechnologiesData(scrapingData.summary?.technologies)
      
      // Update audit project with summary data
      const summaryData = {
        total_pages: scrapingData.summary?.totalPages || 0,
        total_links: scrapingData.summary?.totalLinks || 0,
        total_images: scrapingData.summary?.totalImages || 0,
        total_meta_tags: scrapingData.summary?.totalMetaTags || 0,
        technologies_found: scrapingData.summary?.technologiesFound || 0,
        cms_detected: scrapingData.summary?.cmsDetected || false,
        ...cmsData, // Spread CMS data
        ...technologiesData, // Spread technologies data
        total_html_content: scrapingData.summary?.totalHtmlContent || 0,
        average_html_per_page: scrapingData.summary?.averageHtmlPerPage || 0,
        pages_per_second: scrapingData.performance?.pagesPerSecond || 0,
        total_response_time: scrapingData.performance?.totalTime || 0,
        scraping_completed_at: new Date().toISOString(),
        scraping_data: {
          summary: scrapingData.summary,
          performance: scrapingData.performance,
          extractedData: {
            cms: scrapingData.extractedData?.cms,
            technologies: scrapingData.extractedData?.technologies
          },
          responseTime: scrapingData.responseTime,
          timestamp: new Date().toISOString()
        },
        status: 'completed' as const,
        progress: 100
      }

      console.log('📊 Updating audit project with summary data:', summaryData)
      console.log('📊 Summary data keys:', Object.keys(summaryData))
      console.log('📊 Scraping data size:', JSON.stringify(scrapingData).length, 'characters')

      // Validate that the data can be serialized
      try {
        JSON.stringify(summaryData)
        console.log('✅ Summary data is serializable')
      } catch (serializationError) {
        console.error('❌ Summary data serialization error:', serializationError)
        setScrapingError('Failed to serialize summary data for database update')
        return
      }

      const { error: updateError } = await updateAuditProject(projectId, summaryData)
      
      if (updateError) {
        console.error('❌ Error updating audit project with summary:', updateError)
        console.error('❌ Error details:', JSON.stringify(updateError, null, 2))
        setScrapingError(`Failed to update project with summary data: ${updateError.message || 'Unknown error'}`)
        return
      } else {
        console.log('✅ Audit project updated with summary data successfully')
        
        // Update local state
        setProject(prev => prev ? { ...prev, ...summaryData } : null)
        
        // Start SEO Analysis after scraping is complete
        console.log('🚀 Starting SEO Analysis after scraping completion...')
        handleSeoAnalysis(projectId, scrapedPagesData)
        
        // Update parent cache
        if (onDataUpdate) {
          console.log('💾 AnalysisTab: Updating parent cache with completed data')
          onDataUpdate(project ? { ...project, ...summaryData } : null, scrapedPagesData)
        }
      }

    } catch (error) {
      console.error('❌ Error processing scraping data:', error)
      setScrapingError('Failed to process scraping data')
    }
  }

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
          
          const pagesData: any[] = []
          
          // Skip scraped pages fetch on initial load - load them on demand
          if (projectData.status === 'completed') {
            console.log('📄 AnalysisTab: Skipping initial scraped pages fetch - will load on demand')
            setScrapedPagesLoaded(false)
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

  // Scraping effect - runs when project is pending and we have project data
  useEffect(() => {
    const startScraping = async () => {
      if (!project || project.status !== 'pending' || isScraping || isProcessing.current) {
        return
      }

      console.log('🚀 Starting scraping process for project:', project.id)
      setIsScraping(true)
      setScrapingError(null)
      isProcessing.current = true

      // Start PageSpeed Insights in parallel (don't wait for it)
      console.log('🚀 Starting PageSpeed Insights in parallel...')
      handlePageSpeedInsights(project.site_url, project.id)

      try {
        // Prepare scraping request data
        const scrapeFormData = {
          url: project.site_url,
          mode: (project as any).page_type === 'single' ? 'single' : 'multipage',
          maxPages: 100,
          extractImagesFlag: true,
          extractLinksFlag: true,
          detectTechnologiesFlag: true
        }
        
        console.log('📊 Scraping request data:', scrapeFormData)
        
        const apiEndpoint = process.env.NEXT_PUBLIC_SCRAPER_API_ENDPOINT || 'http://localhost:3001/scrap'
        console.log('🌐 API endpoint:', apiEndpoint)
        
        console.log('⏳ Making fetch request...')
        const scrapeResponse = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(scrapeFormData)
        })
        
        console.log('📊 Scraping response status:', scrapeResponse.status)
        console.log('📊 Scraping response ok:', scrapeResponse.ok)
        
        if (!scrapeResponse.ok) {
          throw new Error(`Scraping API error: ${scrapeResponse.status}`)
        }
        
        console.log('⏳ Parsing JSON response...')
        const scrapeData = await scrapeResponse.json()
        console.log('✅ Scraping API response:', scrapeData)
        
        // Process the scraping data
        await processScrapingData(scrapeData, project.id)
        
      } catch (apiError) {
        console.error('❌ Scraping API error:', apiError)
        setScrapingError(`Scraping failed: ${apiError}`)
      } finally {
        setIsScraping(false)
        isProcessing.current = false
      }
    }

    startScraping()
  }, [project?.id, project?.status, project?.site_url, (project as any)?.page_type]) // Depend on project data

  // Auto-start PageSpeed analysis if no data exists
  useEffect(() => {
    const autoStartPageSpeed = async () => {
      if (
        project && 
        project.status === 'completed' && 
        !project.pagespeed_insights_data && 
        !project.pagespeed_insights_loading && 
        !project.pagespeed_insights_error &&
        !hasAutoStartedPageSpeed &&
        !isPageSpeedLoading
      ) {
        console.log('🚀 Auto-starting PageSpeed analysis for completed project:', project.site_url)
        setHasAutoStartedPageSpeed(true)
        await handlePageSpeedInsights(project.site_url, project.id)
      }
    }

    autoStartPageSpeed()
  }, [project, hasAutoStartedPageSpeed, isPageSpeedLoading])

  // Auto-start SEO analysis if no data exists and we have scraped pages
  useEffect(() => {
    const autoStartSeoAnalysis = async () => {
      if (
        project && 
        project.status === 'completed' && 
        !project.seo_analysis &&
        !hasAutoStartedSeoAnalysis &&
        scrapedPages.length > 0
      ) {
        console.log('🚀 Auto-starting SEO analysis for completed project:', project.site_url)
        setHasAutoStartedSeoAnalysis(true)
        await handleSeoAnalysis(project.id, scrapedPages)
      }
    }

    autoStartSeoAnalysis()
  }, [project, hasAutoStartedSeoAnalysis, scrapedPages])

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


  if (loading || isScraping || (project?.pagespeed_insights_loading && !project?.pagespeed_insights_data)) {
    return (
      <ModernLoader 
        projectName={project?.site_url || 'Website'}
        totalPages={project?.total_pages || 0}
        currentPage={scrapedPages?.length || 0}
        isScraping={isScraping || (project?.pagespeed_insights_loading && !project?.pagespeed_insights_data)}
      />
    )
  }

  if (error || scrapingError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {scrapingError ? 'Scraping Error' : 'Error Loading Analysis'}
        </h3>
        <p className="text-gray-600 mb-4">{scrapingError || error}</p>
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

  // Show processing state if project is still in progress (but not scraping)
  if (project.status === 'in_progress' || (project.status === 'pending' && !isScraping)) {
    return (
      <ModernLoader 
        projectName={project.site_url || 'Website'}
        totalPages={project.total_pages || 0}
        currentPage={scrapedPages?.length || 0}
        isScraping={false}
      />
    )
  }

  return (
    <div className="space-y-6">
      <AnalysisHeader 
        project={project} 
        activeSection={activeSection} 
        onSectionChange={handleSectionChange} 
      />

      {/* Content Sections */}
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeSection === 'overview' && <OverviewSection project={project} scrapedPages={scrapedPages} />}
        
        {activeSection === 'pages' && (
          <Suspense fallback={<SectionSkeleton />}>
            <PagesSection scrapedPages={scrapedPages} />
          </Suspense>
        )}
        
        {activeSection === 'technologies' && (
          <Suspense fallback={<SectionSkeleton />}>
            <TechnologiesSection project={project} />
          </Suspense>
        )}
        
        {activeSection === 'cms' && (
          <Suspense fallback={<SectionSkeleton />}>
            <CmsSection project={project} />
          </Suspense>
        )}
        
        {activeSection === 'performance' && (
          <Suspense fallback={<SectionSkeleton />}>
            <PerformanceSection project={project} onDataUpdate={(updatedProject: AuditProject) => {
              setProject(updatedProject)
              if (onDataUpdate) {
                onDataUpdate(updatedProject, scrapedPages)
              }
            }} />
          </Suspense>
        )}
        
        {activeSection === 'images' && (
          <Suspense fallback={<SectionSkeleton />}>
            <ImagesSection project={project} scrapedPages={scrapedPages} originalScrapingData={project.scraping_data} />
          </Suspense>
        )}
        
        {activeSection === 'links' && (
          <Suspense fallback={<SectionSkeleton />}>
            <LinksSection project={project} scrapedPages={scrapedPages} originalScrapingData={project.scraping_data} />
          </Suspense>
        )}
        
        {activeSection === 'seo' && (
          <Suspense fallback={<SectionSkeleton />}>
            <SEOAnalysisSection project={project} scrapedPages={scrapedPages} />
          </Suspense>
        )}
      </motion.div>
    </div>
  )
}


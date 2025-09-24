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

interface AnalysisTabProps {
  projectId: string
  cachedData?: {
    project: AuditProject | null
    scrapedPages: any[]
    lastFetchTime: number
  } | null
  onDataUpdate?: (project: AuditProject | null, scrapedPages: any[]) => void
  onPageSelect?: (pageId: string) => void
}

export default function AnalysisTab({ projectId, cachedData, onDataUpdate, onPageSelect }: AnalysisTabProps) {
  const { getAuditProject, getScrapedPages, createScrapedPages, updateAuditProject, processMetaTagsData, isConnected, connectionError } = useSupabase()
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
  
  // Data version for forcing re-renders
  const [dataVersion, setDataVersion] = useState(0)
  
  // Debounce mechanism to prevent rapid refreshes
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Function to analyze page content for keys and patterns
  const analyzePageForKeys = (htmlContent: string, pageUrl: string) => {
    if (!htmlContent) {
      return {
        totalKeys: 0,
        keyTypes: {},
        detectedKeys: [],
        patterns: [],
        suspiciousText: []
      }
    }

    const detectedKeys: any[] = []
    const keyTypes: any = {}
    const patterns: any[] = []
    const suspiciousText: any[] = []

    // 1. Google Tag Manager (GTM) patterns
    const gtmScriptPattern = /\(function\(w,d,s,l,i\)\{w\[l\]=w\[l\]\|\|\[\];w\[l\]\.push\(\{'gtm\.start':/g
    const gtmIdPattern = /GTM-[A-Z0-9]+/g
    const gtmJsPattern = /googletagmanager\.com\/gtm\.js/g
    const gtmNoscriptPattern = /<iframe[^>]+src=["']https:\/\/www\.googletagmanager\.com\/ns\.html\?id=GTM-[A-Z0-9]+/gi

    // 2. Google Analytics (gtag.js) patterns
    const gtagJsPattern = /googletagmanager\.com\/gtag\/js/g
    const gaIdPattern = /GA-[A-Z0-9-]+/g
    const gtagIdPattern = /gtag\('config',\s*'[A-Z0-9-]+'/g

    // 3. Facebook Pixel patterns
    const fbPixelPattern = /facebook\.net\/tr\?id=\d+/g
    const fbPixelIdPattern = /fbq\('init',\s*'\d+'/g

    // 4. ClickCease patterns
    const clickceaseScriptPattern = /clickcease\.com\/monitor\/stat\.js/g
    const clickceaseNoscriptImgPattern = /<img[^>]+src=['"]https:\/\/monitor\.clickcease\.com\/stats\/stats\.aspx/gi
    const clickceaseNoscriptAnchorPattern = /<a[^>]+href=['"]https:\/\/www\.clickcease\.com/gi

    // 5. API Keys and tokens patterns
    const apiKeyPattern = /(api[_-]?key|apikey|access[_-]?token|secret[_-]?key|private[_-]?key)\s*[:=]\s*['"]?([A-Za-z0-9_-]{20,})['"]?/gi
    const jwtPattern = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g
    const stripeKeyPattern = /(pk_|sk_)[a-zA-Z0-9]{24,}/g
    const paypalKeyPattern = /(AKIA|ASIA)[A-Z0-9]{16}/g

    // 6. Social media tracking patterns
    const twitterPixelPattern = /pixel\.twitter\.com\/i\/adsct/g
    const linkedinPixelPattern = /snap\.licdn\.com\/li\.lms/g
    const pinterestPixelPattern = /pintrk\.com\/track/g

    // 7. Random long strings (potential keys)
    const randomStringPattern = /\b[A-Za-z0-9_-]{20,}\b/g

    // 8. Email patterns (might contain sensitive info)
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g

    // Analyze patterns
    const patternsToCheck = [
      { name: 'GTM Script', pattern: gtmScriptPattern, type: 'tracking' },
      { name: 'GTM ID', pattern: gtmIdPattern, type: 'tracking' },
      { name: 'GTM JS', pattern: gtmJsPattern, type: 'tracking' },
      { name: 'GTM Noscript', pattern: gtmNoscriptPattern, type: 'tracking' },
      { name: 'Google Analytics', pattern: gtagJsPattern, type: 'analytics' },
      { name: 'GA ID', pattern: gaIdPattern, type: 'analytics' },
      { name: 'Gtag ID', pattern: gtagIdPattern, type: 'analytics' },
      { name: 'Facebook Pixel', pattern: fbPixelPattern, type: 'tracking' },
      { name: 'Facebook Pixel ID', pattern: fbPixelIdPattern, type: 'tracking' },
      { name: 'ClickCease Script', pattern: clickceaseScriptPattern, type: 'security' },
      { name: 'ClickCease Noscript', pattern: clickceaseNoscriptImgPattern, type: 'security' },
      { name: 'API Key', pattern: apiKeyPattern, type: 'api' },
      { name: 'JWT Token', pattern: jwtPattern, type: 'token' },
      { name: 'Stripe Key', pattern: stripeKeyPattern, type: 'payment' },
      { name: 'PayPal Key', pattern: paypalKeyPattern, type: 'payment' },
      { name: 'Twitter Pixel', pattern: twitterPixelPattern, type: 'tracking' },
      { name: 'LinkedIn Pixel', pattern: linkedinPixelPattern, type: 'tracking' },
      { name: 'Pinterest Pixel', pattern: pinterestPixelPattern, type: 'tracking' },
      { name: 'Email', pattern: emailPattern, type: 'contact' }
    ]

    patternsToCheck.forEach(({ name, pattern, type }) => {
      const matches = htmlContent.match(pattern)
      if (matches) {
        matches.forEach(match => {
          detectedKeys.push({
            type: type,
            name: name,
            value: match,
            confidence: 'high'
          })
        })
        
        if (!keyTypes[type]) keyTypes[type] = 0
        keyTypes[type] += matches.length
      }
    })

    // Check for random long strings
    const randomMatches = htmlContent.match(randomStringPattern)
    if (randomMatches) {
      randomMatches.forEach(match => {
        // Filter out common patterns and check if it looks like a key
        if (match.length >= 20 && 
            !match.includes('http') && 
            !match.includes('www') && 
            !match.includes('@') &&
            !match.includes('.') &&
            /[A-Z]/.test(match) && 
            /[a-z]/.test(match) && 
            /[0-9]/.test(match)) {
          
          suspiciousText.push({
            type: 'suspicious',
            name: 'Random String',
            value: match,
            confidence: 'medium'
          })
        }
      })
    }

    return {
      totalKeys: detectedKeys.length + suspiciousText.length,
      keyTypes: keyTypes,
      detectedKeys: detectedKeys,
      patterns: patterns,
      suspiciousText: suspiciousText,
      analysisTimestamp: new Date().toISOString()
    }
  }

  

  // Performance monitoring
  useEffect(() => {
    const startTime = performance.now()
    return () => {
      const endTime = performance.now()
      
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
      
      try {
        const { data: pages, error: pagesError } = await getScrapedPages(projectId)
        if (pagesError) {
          console.error('Error fetching scraped pages:', pagesError)
        } else if (pages) {
          setScrapedPages(pages)
          setScrapedPagesLoaded(true)
          
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
        
        // Provide more user-friendly error messages
        let userFriendlyError = error
        if (error.includes('Lighthouse processing issues')) {
          userFriendlyError = 'PageSpeed Insights is temporarily unavailable due to server issues. Please try again in a few minutes.'
        } else if (error.includes('500')) {
          userFriendlyError = 'PageSpeed Insights server is experiencing issues. Please try again later.'
        } else if (error.includes('Failed to fetch')) {
          userFriendlyError = 'Unable to connect to PageSpeed Insights. Please check your internet connection and try again.'
        }
        
        setPageSpeedError(userFriendlyError)
        
        // Update project with error state
        await updateAuditProject(projectId, {
          pagespeed_insights_loading: false,
          pagespeed_insights_error: userFriendlyError,
          pagespeed_insights_data: null
        })
      } else if (data) {
        
        
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
      
      
      
      
      if (!scrapedPages || scrapedPages.length === 0) {
        console.warn('⚠️ No scraped pages available for SEO analysis')
        return
      }
      
      // Get the first page's HTML content from scraped pages
      const firstPage = scrapedPages.find(page => page.audit_project_id === projectId)
      
      
      if (!firstPage) {
        console.warn('⚠️ No page found with matching project ID for SEO analysis')
        return
      }
      
      if (!firstPage.html_content) {
        console.warn('⚠️ No HTML content available in first page for SEO analysis')
       
        
        // Try to get HTML content from project's scraping_data as fallback
        if (project?.scraping_data?.pages?.[0]?.html) {
          
          const fallbackHtml = project.scraping_data.pages[0].html
          
          
          if (fallbackHtml) {
            // Perform SEO analysis with fallback HTML
            const seoAnalysis = analyzeSEO(fallbackHtml, project?.site_url || '')
            
            
            
            // Update project with SEO analysis data
            await updateAuditProject(projectId, {
              seo_analysis: seoAnalysis
            })
            
            // Update local project state
            setProject(prev => prev ? {
              ...prev,
              seo_analysis: seoAnalysis
            } : null)
            
            return
          }
        }
        
        console.warn('⚠️ No HTML content available for SEO analysis (no fallback)')
        return
      }
      
      // Perform SEO analysis
      const seoAnalysis = analyzeSEO(firstPage.html_content, project?.site_url || '')
      
      
      
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
      
      
      if (!scrapingData.pages || !Array.isArray(scrapingData.pages)) {
        console.warn('⚠️ No pages data found in scraping response')
        setScrapingError('No pages data found in scraping response')
        return
      }

      // Function to extract all social media meta tags from HTML content
      const extractSocialMetaTags = (htmlContent: string) => {
        if (!htmlContent) return { socialMetaTags: [], count: 0 }
        
        const parser = new DOMParser()
        const doc = parser.parseFromString(htmlContent, 'text/html')
        
        // Extract all social media meta tags
        const socialMetaTags = doc.querySelectorAll(`
          meta[property^="og:"],
          meta[name^="twitter:"],
          meta[name^="linkedin:"],
          meta[name^="pinterest:"],
          meta[name^="whatsapp:"],
          meta[name^="telegram:"],
          meta[name^="discord:"],
          meta[name^="slack:"]
        `)
        
        const extractedTags: any[] = []
        socialMetaTags.forEach((tag) => {
          const element = tag as HTMLMetaElement
          extractedTags.push({
            name: element.name || '',
            property: element.getAttribute('property') || '',
            content: element.content || '',
            httpEquiv: element.getAttribute('http-equiv') || undefined
          })
        })
        
        return { socialMetaTags: extractedTags, count: extractedTags.length }
      }

      // Prepare scraped pages data
      const scrapedPagesData = scrapingData.pages.map((page: any) => {
        
        
        const { socialMetaTags, count: socialMetaTagsCount } = extractSocialMetaTags(page.html)
        
        return {
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
          social_meta_tags: socialMetaTags, // Store full social meta tags data
          social_meta_tags_count: socialMetaTagsCount, // Store count as well
          is_external: false, // Main page is not external
          response_time: scrapingData.responseTime
        }
      })

      // Create filtered pages data with key analysis
      console.log('🔍 Creating filtered pages data with key analysis...')
      const allPagesHtml = scrapingData.pages.map((page: any, index: number) => {
        console.log(`📄 Processing page ${index + 1}/${scrapingData.pages.length}:`, {
          url: page.url,
          hasHtml: !!page.html,
          htmlLength: page.html?.length || 0,
          title: page.title,
          statusCode: page.statusCode
        })
        
        // Analyze page for keys and patterns
        const pageAnalysis = analyzePageForKeys(page.html || '', page.url)
        
        // Create simplified page data structure with analysis
        const pageData = {
          pageName: page.title || `Page ${index + 1}`,
          pageUrl: page.url,
          pageHtml: page.html || '',
          detectedKeys: pageAnalysis
        }
        
        console.log(`✅ Page ${index + 1} processed successfully:`, {
          pageName: pageData.pageName,
          pageUrl: pageData.pageUrl,
          htmlLength: pageData.pageHtml?.length || 0,
          keysFound: pageAnalysis.totalKeys,
          keyTypes: Object.keys(pageAnalysis.keyTypes)
        })
        
        return pageData
      })
      
      console.log('🎯 All pages HTML extraction completed!')
      console.log('📈 Final allPagesHtml array:', {
        totalPages: allPagesHtml.length,
        pagesWithHtml: allPagesHtml.filter((p: any) => p.pageHtml).length,
        totalHtmlLength: allPagesHtml.reduce((sum: number, p: any) => sum + (p.pageHtml?.length || 0), 0),
        sampleUrls: allPagesHtml.slice(0, 3).map((p: any) => p.pageUrl)
      })
      
      // Log first page HTML sample for debugging
      if (allPagesHtml.length > 0 && allPagesHtml[0].pageHtml) {
        console.log('🔍 First page HTML sample (first 500 chars):', allPagesHtml[0].pageHtml.substring(0, 500))
      }

      // Save scraped pages to database
      const { data: savedPages, error: pagesError } = await createScrapedPages(scrapedPagesData)
      
      if (pagesError) {
        console.error('❌ Error saving scraped pages:', pagesError)
        setScrapingError('Failed to save scraped pages')
        return
      } else {
        
      }

      // Process meta tags data from homepage
      
      const { data: metaTagsResult, error: metaTagsError } = await processMetaTagsData(projectId)
      if (metaTagsError) {
        console.warn('⚠️ Meta tags processing failed:', metaTagsError)
      } else {
        
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
        all_pages_html: allPagesHtml, // Store filtered pages data in all_pages_html column
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

      console.log('💾 Summary data prepared with allPagesHtml:', {
        hasAllPagesHtml: !!summaryData.all_pages_html,
        allPagesHtmlLength: summaryData.all_pages_html?.length || 0,
        samplePageNames: summaryData.all_pages_html?.slice(0, 3).map((p: any) => p.pageName) || [],
        totalHtmlSize: summaryData.all_pages_html?.reduce((sum: number, p: any) => sum + (p.pageHtml?.length || 0), 0) || 0
      })
      
      

      // Validate that the data can be serialized
      try {
        JSON.stringify(summaryData)
        
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
        
        
        // Update local state
        setProject(prev => prev ? { ...prev, ...summaryData } : null)
        
        // Start SEO Analysis after scraping is complete
        
        handleSeoAnalysis(projectId, scrapedPagesData)
        
        // Update parent cache
        if (onDataUpdate) {
          
          onDataUpdate(project ? { ...project, ...summaryData } : null, scrapedPagesData)
        }
        
        // Force a re-render by updating a timestamp and data version
        setLastFetchTime(Date.now())
        setDataVersion(prev => prev + 1)
      }

    } catch (error) {
      console.error('❌ Error processing scraping data:', error)
      setScrapingError('Failed to process scraping data')
    }
  }

  // Function to refresh data manually
  const refreshData = async (forceRefresh = false) => {
    if (!projectId || isRefreshing) return
    
    // Check if we need to refresh based on data age
    const now = Date.now()
    const timeSinceLastFetch = now - lastFetchTime
    const REFRESH_THRESHOLD = 10 * 1000 // 10 seconds
    
    if (!forceRefresh && timeSinceLastFetch < REFRESH_THRESHOLD) {
      console.log('✅ Data is fresh, skipping refresh')
      return
    }
    
    setIsRefreshing(true)
    setLoading(true)
    setError(null)
    
    try {
      // Fetch fresh project data
      const { data: projectData, error: projectError } = await getAuditProject(projectId)
      
      if (projectError) {
        console.error('Error refreshing project:', projectError)
        setError('Failed to refresh project data')
        return
      }

      if (projectData) {
        // Only update if data actually changed
        const hasDataChanged = JSON.stringify(project) !== JSON.stringify(projectData)
        
        if (hasDataChanged) {
          console.log('📊 Data changed, updating components...')
          setProject(projectData)
          
          // If project is completed, also refresh scraped pages
          if (projectData.status === 'completed') {
            const { data: pages, error: pagesError } = await getScrapedPages(projectId)
            if (!pagesError && pages) {
              setScrapedPages(pages)
              setScrapedPagesLoaded(true)
            }
          }
          
          // Update parent cache
          if (onDataUpdate) {
            onDataUpdate(projectData, scrapedPages)
          }
          
          setDataVersion(prev => prev + 1)
        } else {
          console.log('✅ No data changes detected, skipping update')
        }
        
        setDataFetched(true)
        setLastFetchTime(Date.now())
      }
    } catch (err) {
      console.error('Error refreshing data:', err)
      setError('Failed to refresh data')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  // Main data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      
      
      if (!projectId) {
        
        setError('No project ID provided')
        setLoading(false)
        return
      }

      // Check if we have cached data first
      if (cachedData) {
        
       
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
          
          setLoading(false)
          return
        }
      }

      
      
      setLoading(true)
      setError(null)

      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.error('⏰ AnalysisTab: Request timeout after 30 seconds')
        setError('Request timed out. Please try again.')
        setLoading(false)
      }, 30000)

      try {
        
        // Fetch project details
        const { data: projectData, error: projectError } = await getAuditProject(projectId)
        
        
        clearTimeout(timeoutId)
        
        if (projectError) {
          console.error('Error fetching project:', projectError)
          
          // Handle specific error cases
          if (projectError.message?.includes('No rows found') || projectError.message?.includes('not found')) {
            setError('Project not found. It may have been deleted or you may not have access to it.')
          } else if (projectError.message?.includes('permission denied') || projectError.message?.includes('access denied')) {
            setError('You do not have permission to access this project.')
          } else if (projectError.message?.includes('No user logged in')) {
            setError('Please log in to access this project.')
          } else {
            setError('Failed to load project details. Please try again.')
          }
          return
        }

        if (!projectData) {
          console.error('No project data returned for ID:', projectId)
          setError('Project not found. It may have been deleted or you may not have access to it.')
          return
        }

        
        setProject(projectData)
        
        const pagesData: any[] = []
        
        // Skip scraped pages fetch on initial load - load them on demand
        if (projectData.status === 'completed') {
          
          setScrapedPagesLoaded(false)
        }
        
        // Update parent cache
        if (onDataUpdate) {
          
          onDataUpdate(projectData, pagesData)
        }
        
        setDataFetched(true)
        setLastFetchTime(Date.now())
        setDataVersion(prev => prev + 1)
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('An unexpected error occurred while loading the project.')
      } finally {
        clearTimeout(timeoutId)
        setLoading(false)
      }
    }

    fetchData()
  }, [projectId, cachedData]) // Only depend on projectId and cachedData

  // Auto-refresh effect for completed projects
  useEffect(() => {
    if (!project || project.status !== 'completed') return

    // Set up periodic refresh for completed projects
    const refreshInterval = setInterval(() => {
      // Only refresh if data is older than 5 minutes
      const now = Date.now()
      const timeSinceLastFetch = now - lastFetchTime
      const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes

      if (timeSinceLastFetch > REFRESH_INTERVAL) {
        console.log('🔄 Auto-refreshing project data...')
        refreshData(false) // Don't force refresh for auto-refresh
      }
    }, 60000) // Check every minute

    return () => clearInterval(refreshInterval)
  }, [project, lastFetchTime])

  // Effect to handle scraping completion - only refresh if we don't have fresh data
  useEffect(() => {
    if (project && project.status === 'completed' && !isScraping && !loading) {
      // Only refresh if the data is older than 30 seconds (indicating it just completed)
      const now = Date.now()
      const timeSinceLastFetch = now - lastFetchTime
      const FRESH_DATA_THRESHOLD = 30 * 1000 // 30 seconds
      
      if (timeSinceLastFetch > FRESH_DATA_THRESHOLD) {
        console.log('🔄 Scraping completed, refreshing data...')
        refreshData()
      } else {
        console.log('✅ Data is already fresh, skipping refresh')
      }
    }
  }, [project?.status, isScraping, loading, lastFetchTime])

  // Scraping effect - runs when project is pending and we have project data
  useEffect(() => {
    const startScraping = async () => {
      if (!project || project.status !== 'pending' || isScraping || isProcessing.current) {
        return
      }

      
      setIsScraping(true)
      setScrapingError(null)
      isProcessing.current = true

      // Check database connection before starting
      try {
        
        
        if (connectionError) {
          throw new Error(`Database connection error: ${connectionError}`)
        }
        
        if (!isConnected) {
          console.warn('⚠️ Database not connected, but continuing with scraping...')
        }
      } catch (dbError) {
        console.error('❌ Database connection check failed:', dbError)
        setScrapingError(`Database connection issue: ${dbError}`)
        setIsScraping(false)
        isProcessing.current = false
        return
      }

      // Start PageSpeed Insights in parallel (don't wait for it)
      
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
        
        
        
        // Use HTTPS endpoint for production, fallback to environment variable
        const primaryEndpoint = process.env.NEXT_PUBLIC_SCRAPER_API_ENDPOINT || 'http://rkssksgc48wgkckwsco4swog.81.0.220.43.sslip.io/scrap'
        const fallbackEndpoints = [
          primaryEndpoint,
          'http://rkssksgc48wgkckwsco4swog.81.0.220.43.sslip.io/scrap',
          // Add more fallback endpoints if available
        ]
        
        
        
        
        // Validate that we're using HTTPS in production
        if (typeof window !== 'undefined' && window.location.protocol === 'https:' && !primaryEndpoint.startsWith('https:')) {
          console.error('❌ Mixed Content Error: Cannot use HTTP endpoint on HTTPS site')
          throw new Error('Scraping API endpoint must use HTTPS in production')
        }
        
        // Test basic connectivity to the primary endpoint
        try {
          
            const connectivityTest = await fetch(primaryEndpoint, {
              method: 'HEAD',
              signal: AbortSignal.timeout(180000), // 3 minute timeout
              mode: 'cors'
            })
          
        } catch (connectivityError) {
          console.warn('⚠️ Connectivity test failed:', connectivityError)
          
        }
        
        // Retry logic for scraping request with endpoint fallback
        const makeScrapingRequest = async (retries = 3, delay = 1000): Promise<Response> => {
          for (let i = 0; i < retries; i++) {
            // Try different endpoints
            const endpointsToTry = fallbackEndpoints.slice(0, Math.min(i + 1, fallbackEndpoints.length))
            
            for (const apiEndpoint of endpointsToTry) {
              try {
                
                
                
              
              // Test network connectivity first
              try {
                const testResponse = await fetch(apiEndpoint, { 
                  method: 'HEAD',
                  signal: AbortSignal.timeout(5000) // 5 second timeout for test
                })
                
              } catch (testError) {
                console.warn('⚠️ Network connectivity test failed:', testError)
                // Continue with the actual request anyway
              }
              
              const controller = new AbortController()
              const timeoutId = setTimeout(() => {
                
                controller.abort()
              }, 180000) // 3 minute timeout
              
              
              const scrapeResponse = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'User-Agent': 'WebAudit/1.0'
                },
                body: JSON.stringify(scrapeFormData),
                signal: controller.signal,
                mode: 'cors',
                credentials: 'omit'
              })
              
              clearTimeout(timeoutId)
              
              
              
              
              
              if (!scrapeResponse.ok) {
                const errorText = await scrapeResponse.text().catch(() => 'Unable to read error response')
                console.error('❌ API error response:', errorText)
                throw new Error(`Scraping API error: ${scrapeResponse.status} - ${scrapeResponse.statusText}. Details: ${errorText}`)
              }
              
                return scrapeResponse
              } catch (error) {
                console.error(`❌ Scraping request to ${apiEndpoint} failed:`, error)
                console.error('Error details:', {
                  name: error instanceof Error ? error.name : 'Unknown',
                  message: error instanceof Error ? error.message : String(error),
                  stack: error instanceof Error ? error.stack : undefined,
                  cause: error instanceof Error ? error.cause : undefined
                })
                
                if (error instanceof Error && error.name === 'AbortError') {
                  throw new Error('Scraping request timed out after 3 minutes')
                }
                
                if (error instanceof Error && error.message.includes('Failed to fetch')) {
                  console.error('🔍 Network error details:', {
                    apiEndpoint,
                    isOnline: navigator.onLine,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                  })
                }
                
                // If this is the last endpoint for this attempt, continue to next attempt
                if (apiEndpoint === endpointsToTry[endpointsToTry.length - 1]) {
                  if (i === retries - 1) {
                    // Enhanced error message for the final attempt
                    let enhancedError = error instanceof Error ? error.message : String(error)
                    if (enhancedError.includes('Failed to fetch')) {
                      enhancedError = `Network connection failed. Please check your internet connection and ensure the scraping service is accessible. Tried endpoints: ${fallbackEndpoints.join(', ')}`
                    }
                    throw new Error(enhancedError)
                  }
                  
                  // Wait before retrying with exponential backoff
                  const waitTime = delay * Math.pow(2, i) // Exponential backoff
                  
                  await new Promise(resolve => setTimeout(resolve, waitTime))
                } else {
                  // Try next endpoint immediately
                  
                }
              }
            }
          }
          
          throw new Error('All scraping request attempts failed')
        }
        
        const scrapeResponse = await makeScrapingRequest()
        
        
        const scrapeData = await scrapeResponse.json()
        
        
        // Process the scraping data
        await processScrapingData(scrapeData, project.id)
        
      } catch (apiError) {
        console.error('❌ Scraping API error:', apiError)
        
        let errorMessage = 'Scraping failed: '
        if (apiError instanceof Error) {
          if (apiError.message.includes('Failed to fetch')) {
            errorMessage += 'Network connection lost. Please check your internet connection and try again.'
          } else if (apiError.message.includes('timeout')) {
            errorMessage += 'Request timed out. The scraping service may be overloaded. Please try again.'
          } else if (apiError.message.includes('Mixed Content')) {
            errorMessage += 'Security error. Please contact support.'
          } else {
            errorMessage += apiError.message
          }
        } else {
          errorMessage += 'Unknown error occurred'
        }
        
        setScrapingError(errorMessage)
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


  // Show loader only if we're actually loading project data or scraping
  if (loading || isScraping) {
    
    return (
      <ModernLoader 
        projectName={project?.site_url || 'Website'}
        totalPages={project?.total_pages || 0}
        currentPage={scrapedPages?.length || 0}
        isScraping={isScraping}
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
        <div className="flex gap-3 justify-center">
          {scrapingError && (
            <button 
              onClick={() => {
                setScrapingError(null)
                // Trigger scraping again by updating project status
                if (project) {
                  updateAuditProject(project.id, { status: 'pending' })
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry Scraping
            </button>
          )}
          {!scrapingError && (
            <button 
              onClick={() => {
                setError(null)
                // Retry fetching the project
                window.location.reload()
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry Loading
            </button>
          )}
          <button 
            onClick={() => window.location.href = '/dashboard?tab=projects'} 
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            View All Projects
          </button>
        </div>
      </div>
    )
  }

  if (!project && !loading && !error) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Not Found</h3>
        <p className="text-gray-600 mb-4">The requested project could not be found or you may not have access to it.</p>
        <div className="flex gap-3 justify-center">
          <button 
            onClick={() => window.location.href = '/dashboard?tab=projects'} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Projects
          </button>
          <button 
            onClick={() => window.location.href = '/dashboard'} 
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Show processing state if project is still in progress (but not scraping)
  if (project && (project.status === 'in_progress' || (project.status === 'pending' && !isScraping))) {
    return (
      <ModernLoader 
        projectName={project.site_url || 'Website'}
        totalPages={project.total_pages || 0}
        currentPage={scrapedPages?.length || 0}
        isScraping={false}
      />
    )
  }

  // Ensure project exists before rendering
  if (!project) {
    
    return null
  }

  
  return (
    <div className="space-y-6">
      <AnalysisHeader 
        project={project} 
        activeSection={activeSection} 
        onSectionChange={handleSectionChange}
        onRefresh={() => refreshData(true)}
        isRefreshing={isRefreshing}
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
            <PagesSection scrapedPages={scrapedPages} projectId={projectId} onPageSelect={onPageSelect} />
          </Suspense>
        )}
        
        {activeSection === 'technologies' && (
          <Suspense fallback={<SectionSkeleton />}>
            <TechnologiesSection project={project} scrapedPages={scrapedPages} />
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
            <SEOAnalysisSection project={project} scrapedPages={scrapedPages} dataVersion={dataVersion} />
          </Suspense>
        )}
      </motion.div>
    </div>
  )
}


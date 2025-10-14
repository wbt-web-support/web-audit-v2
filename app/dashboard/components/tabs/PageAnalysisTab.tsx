'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { AuditProject } from '@/types/audit'
import AnalysisHeader from '../analysis-tab-components/AnalysisHeader'
import { useUserPlan } from '@/hooks/useUserPlan'
import FeatureUnavailableCard from '../FeatureUnavailableCard'
import {
  OverviewTab,
  GrammarContentTab,
  UIQualityTab,
  TechnicalTab,
  PerformanceTab,
  AccessibilityTab
} from '../page-analysis-components'
import SEOAnalysisSection from '../analysis-tab-components/SEOAnalysisSection'
import ImagesSection from '../analysis-tab-components/ImagesSection'
import LinksSection from '../analysis-tab-components/LinksSection'

interface PageAnalysisTabProps {
  pageId: string
}

interface PageData {
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
  gemini_analysis?: any | null
  created_at: string
  updated_at: string
}

export default function PageAnalysisTab({ pageId }: PageAnalysisTabProps) {
  const { getScrapedPage, getAuditProject } = useSupabase()
  const { hasFeature } = useUserPlan()
  const [activeTab, setActiveTab] = useState('overview')
  const [page, setPage] = useState<PageData | null>(null)
  const [project, setProject] = useState<AuditProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoize cached analysis to prevent unnecessary re-renders
  const cachedAnalysis = useMemo(() => {
    return page?.gemini_analysis || undefined
  }, [page?.gemini_analysis])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load page data
        const { data: pageData, error: pageError } = await getScrapedPage(pageId)
        if (pageError) throw pageError
        if (!pageData) throw new Error('Page not found')
        
        setPage(pageData as PageData)
        
        // Load project data
        if (pageData.audit_project_id) {
          const { data: projectData, error: projectError } = await getAuditProject(pageData.audit_project_id)
          if (!projectError && projectData) {
            setProject(projectData)
          }
        }
        
      } catch (err) {
        console.error('Error loading page data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load page')
      } finally {
        setLoading(false)
      }
    }

    if (pageId) {
      loadData()
    }
  }, [pageId, getScrapedPage, getAuditProject])

  // Check if user has access to a specific tab
  const hasAccessToTab = (tabId: string): boolean => {
    const featureMap: Record<string, string> = {
      'overview': 'single_page_crawl', // Basic overview is available to all
      'links': 'link_scanner',
      'images': 'image_scan',
      'grammar-content': 'grammar_content_analysis',
      'seo-structure': 'seo_structure',
      'ui-quality': 'ui_ux_quality_check',
      'technical': 'technical_analysis',
      'performance': 'performance_metrics',
      'accessibility': 'accessibility_audit'
    }
    
    const featureId = featureMap[tabId]
    if (!featureId) return true // Show tabs that don't require specific features
    return hasFeature(featureId)
  }

  // Get tab information for unavailable cards
  const getTabInfo = (tabId: string) => {
    const tabInfoMap: Record<string, { title: string; description: string }> = {
      'overview': {
        title: 'Overview Analysis',
        description: 'This feature is not available in your current plan. Upgrade to access comprehensive page overview and insights.'
      },
      'links': {
        title: 'Link Scanner',
        description: 'This feature is not available in your current plan. Upgrade to access link validation and broken link detection.'
      },
      'images': {
        title: 'Image Analysis',
        description: 'This feature is not available in your current plan. Upgrade to access image optimization analysis and recommendations.'
      },
      'grammar-content': {
        title: 'Grammar & Content Analysis',
        description: 'This feature is not available in your current plan. Upgrade to access AI-powered grammar and content analysis.'
      },
      'seo-structure': {
        title: 'SEO & Structure Analysis',
        description: 'This feature is not available in your current plan. Upgrade to access comprehensive SEO structure analysis.'
      },
      'ui-quality': {
        title: 'UI/UX Quality Check',
        description: 'This feature is not available in your current plan. Upgrade to access UI/UX quality analysis and recommendations.'
      },
      'technical': {
        title: 'Technical Analysis',
        description: 'This feature is not available in your current plan. Upgrade to access comprehensive technical audit and recommendations.'
      },
      'performance': {
        title: 'Performance Metrics',
        description: 'This feature is not available in your current plan. Upgrade to access detailed performance analysis and PageSpeed Insights.'
      },
      'accessibility': {
        title: 'Accessibility Audit',
        description: 'This feature is not available in your current plan. Upgrade to access comprehensive accessibility compliance checking.'
      }
    }
    return tabInfoMap[tabId] || {
      title: 'Feature Unavailable',
      description: 'This feature is not available in your current plan. Upgrade to access this functionality.'
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading page analysis...</p>
        </div>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-gray-600">{error || 'Page not found'}</p>
        </div>
      </div>
    )
  }

  // Create a mock project object for the AnalysisHeader
  const mockProject: AuditProject = project ? {
    ...project,
    score: 85, // You can calculate this based on page analysis
    status: 'completed' as const
  } : {
    id: 'mock',
    site_url: page?.url || 'Unknown URL',
    status: 'completed' as const,
    score: 85,
    progress: 100,
    last_audit_at: new Date().toISOString(),
    issues_count: 0,
    total_pages: 1,
    total_links: 0,
    total_images: 0,
    total_meta_tags: 0,
    technologies_found: 0,
    cms_detected: false,
    cms_type: null,
    cms_version: null,
    cms_plugins: null,
    cms_themes: null,
    cms_components: null,
    cms_confidence: 0,
    cms_detection_method: null,
    cms_metadata: null,
    technologies: null,
    technologies_confidence: 0,
    technologies_detection_method: null,
    technologies_metadata: null,
    total_html_content: 0,
    average_html_per_page: 0,
    pagespeed_insights_data: null,
    pagespeed_insights_loading: false,
    pagespeed_insights_error: null,
    scraping_data: null,
    seo_analysis: null,
    meta_tags_data: null,
    social_meta_tags_data: null,
    detected_keys: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const renderActiveTab = () => {
    // Check if user has access to the current tab
    if (!hasAccessToTab(activeTab)) {
      const tabInfo = getTabInfo(activeTab)
      return (
        <FeatureUnavailableCard 
          title={tabInfo.title}
          description={tabInfo.description}
        />
      )
    }

    // Create a mock scrapedPages array with the current page for the sections
    const scrapedPages = page ? [page] : []
    
    switch (activeTab) {
      case 'overview':
        return <OverviewTab page={page} project={project} />
      case 'links':
        return <LinksSection project={mockProject} scrapedPages={scrapedPages} originalScrapingData={undefined} />
      case 'images':
        return <ImagesSection project={mockProject} scrapedPages={scrapedPages} originalScrapingData={undefined} />
      case 'grammar-content':
        return <GrammarContentTab page={page!} cachedAnalysis={cachedAnalysis} />
      case 'seo-structure':
        return <SEOAnalysisSection page={page!} isPageAnalysis={true} cachedAnalysis={null} />
      case 'ui-quality':
        return <UIQualityTab page={page!} />
      case 'technical':
        return <TechnicalTab page={page!} />
      case 'performance':
        return page ? <PerformanceTab page={{...page, html_content: page.html_content || undefined, images: Array.isArray(page.images) ? page.images.map(() => ({ size: 0, loading: 'lazy', format: 'unknown' })) : undefined, response_time: page.response_time || undefined, html_content_length: page.html_content_length || undefined, performance_analysis: undefined}} cachedAnalysis={undefined} /> : null
      case 'accessibility':
        return page ? <AccessibilityTab page={page} /> : null
      default:
        return <OverviewTab page={page} project={project} />
    }
  }

  // Map page analysis tabs to the AnalysisHeader format
  const pageAnalysisTabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'links', name: 'Links', icon: '🔗' },
    { id: 'images', name: 'Images', icon: '🖼️' },
    { id: 'grammar-content', name: 'Grammar & Content', icon: '📝' },
    { id: 'seo-structure', name: 'SEO & Structure', icon: '🔍' },
    { id: 'ui-quality', name: 'UI Quality', icon: '🎨' },
    { id: 'technical', name: 'Technical', icon: '⚙️' },
    { id: 'performance', name: 'Performance', icon: '⚡' },
    { id: 'accessibility', name: 'Accessibility', icon: '♿' }
  ]

  return (
    <div className="space-y-6">
      {/* Use AnalysisHeader for consistent design */}
      <AnalysisHeader 
        project={mockProject}
        activeSection={activeTab}
        onSectionChange={setActiveTab}
        customTabs={pageAnalysisTabs}
        pageTitle={page?.title || 'Untitled Page'}
        showUnavailableContent={false}
      />

      {/* Tab Content */}
      <div className="min-h-96">
        {renderActiveTab()}
      </div>
    </div>
  )
}

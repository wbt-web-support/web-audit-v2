'use client'

import { useState } from 'react'
import { AuditProject } from '@/types/audit'
import AnalysisHeader from '../analysis-tab-components/AnalysisHeader'
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
import { PageAnalysisCacheProvider, usePageAnalysisCache } from '../contexts/PageAnalysisCache'

interface PageAnalysisTabProps {
  pageId: string
}

function PageAnalysisContent({ }: PageAnalysisTabProps) {
  const { data } = usePageAnalysisCache()
  const [activeTab, setActiveTab] = useState('overview')

  // Create a mock project object for the AnalysisHeader
  const mockProject: AuditProject = data.project ? {
    ...data.project,
    score: 85, // You can calculate this based on page analysis
    status: 'completed' as const
  } : {
    id: 'mock',
    site_url: data.page?.url || 'Unknown URL',
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
    seo_analysis: data.seoAnalysis,
    meta_tags_data: null,
    social_meta_tags_data: null,
    all_pages_html: null,
    images: null,
    links: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  if (!data.page) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading page analysis...</p>
        </div>
      </div>
    )
  }

  const renderActiveTab = () => {
    // Create a mock scrapedPages array with the current page for the sections
    const scrapedPages = data.page ? [data.page] : []
    
    switch (activeTab) {
      case 'overview':
        return <OverviewTab page={data.page} project={data.project} />
      case 'links':
        return <LinksSection project={mockProject} scrapedPages={scrapedPages} originalScrapingData={data.page?.scraping_data} />
      case 'images':
        return <ImagesSection project={mockProject} scrapedPages={scrapedPages} originalScrapingData={data.page?.scraping_data} />
      case 'grammar-content':
        return <GrammarContentTab page={data.page} cachedAnalysis={data.geminiAnalysis} />
      case 'seo-structure':
        return <SEOAnalysisSection page={data.page} isPageAnalysis={true} cachedAnalysis={data.seoAnalysis} />
      case 'ui-quality':
        return <UIQualityTab page={data.page} />
      case 'technical':
        return <TechnicalTab page={data.page} />
      case 'performance':
        return <PerformanceTab page={data.page} cachedAnalysis={data.performanceAnalysis} />
      case 'accessibility':
        return <AccessibilityTab page={data.page} />
      default:
        return <OverviewTab page={data.page} project={data.project} />
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
        pageTitle={data.page?.title || 'Untitled Page'}
      />

      {/* Tab Content */}
      <div className="min-h-96">
        {renderActiveTab()}
      </div>
    </div>
  )
}

export default function PageAnalysisTab({ pageId }: PageAnalysisTabProps) {
  return (
    <PageAnalysisCacheProvider pageId={pageId}>
      <PageAnalysisContent pageId={pageId} />
    </PageAnalysisCacheProvider>
  )
}

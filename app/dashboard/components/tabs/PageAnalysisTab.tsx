'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { AuditProject } from '@/types/audit'
import AnalysisHeader from '../analysis-tab-components/AnalysisHeader'
import {
  OverviewTab,
  LinksTab,
  ImagesTab,
  GrammarContentTab,
  SEOStructureTab,
  UIQualityTab,
  TechnicalTab,
  PerformanceTab,
  AccessibilityTab
} from '../page-analysis-components'

interface PageAnalysisTabProps {
  pageId: string
}

export default function PageAnalysisTab({ pageId }: PageAnalysisTabProps) {
  const { getScrapedPage, getAuditProject } = useSupabase()
  const [page, setPage] = useState<any>(null)
  const [project, setProject] = useState<AuditProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

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
    all_pages_html: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get the specific scraped page by ID
        const { data: foundPage, error: pageError } = await getScrapedPage(pageId)
        
        if (pageError) {
          console.error('Error fetching scraped page:', pageError)
          setError('Failed to load page data')
          return
        }

        if (!foundPage) {
          setError('Page not found')
          return
        }

        setPage(foundPage)

        // Get the project data for context
        if (foundPage.audit_project_id) {
          const { data: projectData, error: projectError } = await getAuditProject(foundPage.audit_project_id)
          
          if (projectError) {
            console.error('Error fetching project:', projectError)
          } else {
            setProject(projectData)
          }
        }

      } catch (err) {
        console.error('Unexpected error:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (pageId) {
      fetchPageData()
    }
  }, [pageId])

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
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Page Not Found</h3>
        <p className="text-gray-600 mb-4">{error || 'The requested page could not be found.'}</p>
        <button 
          onClick={() => window.history.back()} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    )
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab page={page} project={project} />
      case 'links':
        return <LinksTab page={page} />
      case 'images':
        return <ImagesTab page={page} />
      case 'grammar-content':
        return <GrammarContentTab page={page} />
      case 'seo-structure':
        return <SEOStructureTab page={page} />
      case 'ui-quality':
        return <UIQualityTab page={page} />
      case 'technical':
        return <TechnicalTab page={page} />
      case 'performance':
        return <PerformanceTab page={page} />
      case 'accessibility':
        return <AccessibilityTab page={page} />
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
      />

      {/* Tab Content */}
      <div className="min-h-96">
        {renderActiveTab()}
      </div>
    </div>
  )
}

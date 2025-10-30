'use client'

import { lazy, Suspense, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useScrapingAnalysis } from './hooks/useScrapingAnalysis'
import ScrapingService from '../ScrapingService'
import { AnalysisTabProps } from './types'
import { AnalysisHeader, OverviewSection, ModernLoader } from '../analysis-tab-components'
import FeedbackModal from '../modals/FeedbackModal'
import ErrorState from './components/ErrorState'
import SectionSkeleton from './components/SectionSkeleton'
import { useUserPlan } from '@/hooks/useUserPlan'
import FeatureUnavailableCard from '../FeatureUnavailableCard'

// Lazy load heavy components
const PagesSection = lazy(() => import('../analysis-tab-components/PagesSection'))
const TechnologiesSection = lazy(() => import('../analysis-tab-components/TechnologiesSection'))
const CmsSection = lazy(() => import('../analysis-tab-components/CmsSection'))
const PerformanceSection = lazy(() => import('../analysis-tab-components/PerformanceSection'))
const ImagesSection = lazy(() => import('../analysis-tab-components/ImagesSection'))
const LinksSection = lazy(() => import('../analysis-tab-components/LinksSection'))
const SEOAnalysisSection = lazy(() => import('../analysis-tab-components/SEOAnalysisSection'))

export default function AnalysisTabContent({ 
  projectId, 
  cachedData, 
  onDataUpdate, 
  onPageSelect 
}: AnalysisTabProps) {
  const { state, updateState, refreshData, handleSectionChange, startScraping, loadScrapedPages, showFeedbackModal, confirmFeedback, laterFeedback } = useScrapingAnalysis(projectId, cachedData)
  const { hasFeature } = useUserPlan()

  // Check if user has access to a specific section
  const hasAccessToSection = (sectionId: string): boolean => {
    const featureMap: Record<string, string> = {
      'overview': 'single_page_crawl', // Basic overview is available to all
      'pages': 'pages_tab',
      'technologies': 'technical_analysis',
      'cms': 'brand_consistency_check',
      'performance': 'performance_metrics',
      'seo': 'seo_structure',
      'images': 'image_scan',
      'links': 'link_scanner'
    }
    
    const featureId = featureMap[sectionId]
    if (!featureId) return true // Show sections that don't require specific features
    return hasFeature(featureId)
  }

  // Get section information for unavailable cards
  const getSectionInfo = (sectionId: string) => {
    const sectionInfoMap: Record<string, { title: string; description: string }> = {
      'overview': {
        title: 'Overview Analysis',
        description: 'This feature is not available in your current plan. Upgrade to access comprehensive website overview and insights.'
      },
      'pages': {
        title: 'Pages Tab',
        description: 'This feature is not available in your current plan. Upgrade to access pages tab functionality.'
      },
      'technologies': {
        title: 'Technical Analysis',
        description: 'This feature is not available in your current plan. Upgrade to access detailed technical analysis and recommendations.'
      },
      // 'cms': {
      //   title: 'CMS Detection',
      //   description: 'This feature is not available in your current plan. Upgrade to access CMS detection and brand consistency checks.'
      // },
      'performance': {
        title: 'Performance Metrics',
        description: 'This feature is not available in your current plan. Upgrade to access detailed performance analysis and PageSpeed Insights.'
      },
      'seo': {
        title: 'SEO & Structure Analysis',
        description: 'This feature is not available in your current plan. Upgrade to access comprehensive SEO analysis and structure validation.'
      },
      'images': {
        title: 'Image Analysis',
        description: 'This feature is not available in your current plan. Upgrade to access image optimization analysis and recommendations.'
      },
      'links': {
        title: 'Link Scanner',
        description: 'This feature is not available in your current plan. Upgrade to access link validation and broken link detection.'
      }
    }
    return sectionInfoMap[sectionId] || {
      title: 'Feature Unavailable',
      description: 'This feature is not available in your current plan. Upgrade to access this functionality.'
    }
  }

  // Ensure data is loaded when component mounts
  useEffect(() => {
    if (state.project && !state.scrapedPagesLoaded && !state.isScraping) {
      loadScrapedPages()
    }
  }, [state.project, state.scrapedPagesLoaded, state.isScraping, loadScrapedPages])

  // Handle retry actions
  const handleRetryScraping = () => {
    updateState({ scrapingError: null })
    if (state.project) {
      startScraping(state.project)
    }
  }

  const handleRetryLoading = () => {
    updateState({ error: null })
    window.location.reload()
  }

  const handleViewProjects = () => {
    window.location.href = '/dashboard?tab=projects'
  }

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard'
  }

  // Show loader if loading or scraping
  if (state.loading || state.isScraping) {
    return (
      <ModernLoader 
        projectName={state.project?.site_url || 'Website'}
        totalPages={state.project?.total_pages || 0}
        currentPage={state.scrapedPages?.length || 0}
        isScraping={state.isScraping}
      />
    )
  }

  // Show error state for any errors
  if (state.error || state.scrapingError) {
    return (
      <ErrorState
        error={state.error}
        scrapingError={state.scrapingError}
        onRetryScraping={handleRetryScraping}
        onRetryLoading={handleRetryLoading}
        onViewProjects={handleViewProjects}
        onGoToDashboard={handleGoToDashboard}
      />
    )
  }

  // Ensure project exists before rendering
  if (!state.project) {
    return null
  }

  // Guard: if CMS not detected and active section is 'cms', switch to 'overview'
  // if (state.activeSection === 'cms' && state.project && !state.project.cms_detected) {
  //   handleSectionChange('overview')
  //   return null
  // }

  return (
    <div className="space-y-6">
      <FeedbackModal open={showFeedbackModal} onConfirm={(text) => confirmFeedback(text)} onLater={laterFeedback} />
      {/* ScrapingService component to handle data processing */}
      {state.project?.scraping_data && (
        <ScrapingService
          key={`scraping-${state.dataVersion}`}
          projectId={projectId}
          scrapingData={state.project.scraping_data}
          forceProcess={true}
          onScrapingComplete={(success) => {
            if (success) {
              // Refresh data after successful processing
              refreshData(true);
            } else {
              updateState({ scrapingError: 'Failed to process scraping data' });
            }
          }}
        />
      )}

      <AnalysisHeader 
        project={state.project} 
        activeSection={state.activeSection} 
        onSectionChange={handleSectionChange}
        onRefresh={() => refreshData(true)}
        isRefreshing={state.isRefreshing}
        showUnavailableContent={false}
      />

      {/* Content Sections */}
      <motion.div
        key={state.activeSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Check access and show unavailable card if needed */}
        {!hasAccessToSection(state.activeSection) ? (
          <FeatureUnavailableCard 
            title={getSectionInfo(state.activeSection).title}
            description={getSectionInfo(state.activeSection).description}
          />
        ) : (
          <>
            {state.activeSection === 'overview' && (
              <OverviewSection project={state.project} scrapedPages={state.scrapedPages} />
            )}
            
            {state.activeSection === 'pages' && (
              <Suspense fallback={<SectionSkeleton />}>
                <PagesSection 
                  key={`pages-${projectId}-${state.scrapedPages?.length || 0}`}
                  scrapedPages={state.scrapedPages} 
                  projectId={projectId} 
                  onPageSelect={onPageSelect}
                  onPagesUpdate={(pages) => {
                    updateState({ scrapedPages: pages })
                    if (onDataUpdate) {
                      onDataUpdate(state.project, pages)
                    }
                  }}
                />
              </Suspense>
            )}
            
            {state.activeSection === 'technologies' && (
              <Suspense fallback={<SectionSkeleton />}>
                <TechnologiesSection 
                  key={`technologies-${projectId}-${state.project?.detected_keys ? 'has-data' : 'no-data'}`}
                  project={state.project} 
                  scrapedPages={state.scrapedPages} 
                />
              </Suspense>
            )}
            
            {state.activeSection === 'cms' && (
              <Suspense fallback={<SectionSkeleton />}>
                <CmsSection project={state.project} />
              </Suspense>
            )}
            
            {state.activeSection === 'performance' && (
              <Suspense fallback={<SectionSkeleton />}>
                <PerformanceSection 
                  key={`performance-${projectId}-${state.project?.pagespeed_insights_data ? 'has-data' : 'no-data'}`}
                  project={state.project} 
                  onDataUpdate={(updatedProject) => {
                    updateState({ project: updatedProject })
                    if (onDataUpdate) {
                      onDataUpdate(updatedProject, state.scrapedPages)
                    }
                  }} 
                />
              </Suspense>
            )}
            
            {state.activeSection === 'images' && (
              <Suspense fallback={<SectionSkeleton />}>
                <ImagesSection 
                  project={state.project} 
                  scrapedPages={state.scrapedPages} 
                  originalScrapingData={state.project.scraping_data} 
                />
              </Suspense>
            )}
            
            {state.activeSection === 'links' && (
              <Suspense fallback={<SectionSkeleton />}>
                <LinksSection 
                  project={state.project} 
                  scrapedPages={state.scrapedPages} 
                  originalScrapingData={state.project.scraping_data} 
                />
              </Suspense>
            )}
            
            {state.activeSection === 'seo' && (
              <Suspense fallback={<SectionSkeleton />}>
                <SEOAnalysisSection 
                  project={state.project} 
                  scrapedPages={state.scrapedPages} 
                  dataVersion={state.dataVersion} 
                />
              </Suspense>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}

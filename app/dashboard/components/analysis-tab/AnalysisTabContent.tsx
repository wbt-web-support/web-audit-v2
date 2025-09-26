'use client'

import { lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useAnalysisData } from './hooks/useAnalysisData'
import { useScraping } from './hooks/useScraping'
import { AnalysisTabProps } from './types'
import { AnalysisHeader, OverviewSection, ModernLoader } from '../analysis-tab-components'
import ErrorState from './components/ErrorState'
import SectionSkeleton from './components/SectionSkeleton'

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
  const { state, updateState, refreshData, handleSectionChange } = useAnalysisData(projectId, cachedData)
  const { isScraping, scrapingError, setScrapingError } = useScraping(state.project, (project, scrapedPages) => {
    // When scraping completes, refresh the data to show the new project state
    console.log('🔄 Scraping completed, refreshing data...')
    refreshData(true) // Force refresh
    if (onDataUpdate) {
      onDataUpdate(project, scrapedPages)
    }
  })

  // Handle retry actions
  const handleRetryScraping = () => {
    setScrapingError(null)
    if (state.project) {
      // Trigger scraping again by updating project status
      // This would need to be implemented in the useScraping hook
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
  if (state.loading || isScraping) {
    return (
      <ModernLoader 
        projectName={state.project?.site_url || 'Website'}
        totalPages={state.project?.total_pages || 0}
        currentPage={state.scrapedPages?.length || 0}
        isScraping={isScraping}
      />
    )
  }

  // Show processing state if project is still in progress
  if (state.project && (state.project.status === 'in_progress' || (state.project.status === 'pending' && !isScraping))) {
    return (
      <ModernLoader 
        projectName={state.project.site_url || 'Website'}
        totalPages={state.project.total_pages || 0}
        currentPage={state.scrapedPages?.length || 0}
        isScraping={false}
      />
    )
  }

  // Show error state only for scraping errors (not project errors since project exists)
  if (scrapingError) {
    return (
      <ErrorState
        error={null}
        scrapingError={scrapingError}
        onRetryScraping={handleRetryScraping}
        onRetryLoading={handleRetryLoading}
        onViewProjects={handleViewProjects}
        onGoToDashboard={handleGoToDashboard}
      />
    )
  }

  // Show processing state if project is still in progress
  if (state.project && (state.project.status === 'in_progress' || (state.project.status === 'pending' && !isScraping))) {
    return (
      <ModernLoader 
        projectName={state.project.site_url || 'Website'}
        totalPages={state.project.total_pages || 0}
        currentPage={state.scrapedPages?.length || 0}
        isScraping={false}
      />
    )
  }

  // Ensure project exists before rendering
  if (!state.project) {
    return null
  }

  return (
    <div className="space-y-6">
      <AnalysisHeader 
        project={state.project} 
        activeSection={state.activeSection} 
        onSectionChange={handleSectionChange}
        onRefresh={() => refreshData(true)}
        isRefreshing={state.isRefreshing}
      />

      {/* Content Sections */}
      <motion.div
        key={state.activeSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {state.activeSection === 'overview' && (
          <OverviewSection project={state.project} scrapedPages={state.scrapedPages} />
        )}
        
        {state.activeSection === 'pages' && (
          <Suspense fallback={<SectionSkeleton />}>
            <PagesSection 
              scrapedPages={state.scrapedPages} 
              projectId={projectId} 
              onPageSelect={onPageSelect} 
            />
          </Suspense>
        )}
        
        {state.activeSection === 'technologies' && (
          <Suspense fallback={<SectionSkeleton />}>
            <TechnologiesSection project={state.project} scrapedPages={state.scrapedPages} />
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
      </motion.div>
    </div>
  )
}

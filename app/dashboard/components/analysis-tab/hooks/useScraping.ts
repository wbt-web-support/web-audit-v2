import { useEffect, useCallback, useRef } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { AuditProject } from '@/types/audit'
import { ScrapedPage } from '../types'
import { useScrapingStore } from '@/lib/stores/scrapingStore'

// Global tracking to prevent multiple instances from starting scraping for the same project
const globalInitializedProjects = new Set<string>()

export function useScraping(project: AuditProject | null, onDataUpdate?: (project: AuditProject | null, scrapedPages: ScrapedPage[]) => void) {
  const { updateAuditProject, createScrapedPage, isConnected, connectionError } = useSupabase()
  
  // Use Zustand store for state management - individual selectors to prevent infinite loops
  const isScraping = useScrapingStore((state) => state.isScraping)
  const scrapingError = useScrapingStore((state) => state.scrapingError)
  const isProcessing = useScrapingStore((state) => state.isProcessing)
  const setScraping = useScrapingStore((state) => state.setScraping)
  const setScrapingError = useScrapingStore((state) => state.setScrapingError)
  const setProcessing = useScrapingStore((state) => state.setProcessing)
  const setCurrentProject = useScrapingStore((state) => state.setCurrentProject)
  const setScrapedPages = useScrapingStore((state) => state.setScrapedPages)
  const addActiveCall = useScrapingStore((state) => state.addActiveCall)
  const removeActiveCall = useScrapingStore((state) => state.removeActiveCall)
  const isCallActive = useScrapingStore((state) => state.isCallActive)

  // Process scraping data
  const processScrapingData = useCallback(async (scrapingData: Record<string, unknown>, projectId: string) => {
    try {
      if (!scrapingData.pages || !Array.isArray(scrapingData.pages)) {
        console.warn('⚠️ No pages data found in scraping response')
        setScrapingError('No pages data found in scraping response')
        return
      }

      console.log('🔄 Processing scraping data...', {
        pagesCount: scrapingData.pages.length,
        hasSummary: !!scrapingData.summary
      })

      // Update project status to 'completed' IMMEDIATELY to show data
      const pages = scrapingData.pages as Array<{
        url: string;
        title?: string;
        statusCode?: number;
        metaDescription?: string;
        htmlContent?: string;
        links?: Array<{ url: string; text: string; isExternal: boolean }>;
        images?: Array<{ src: string; alt?: string; title?: string }>;
        metaTags?: Record<string, string>;
        technologies?: Array<{ name: string; confidence: number }>;
        cmsType?: string;
        cmsVersion?: string;
        cmsPlugins?: Array<{ name: string; confidence: number }>;
        socialMetaTags?: Record<string, string>;
        isExternal?: boolean;
        responseTime?: number;
        performanceAnalysis?: Record<string, unknown>;
      }>
      const summary = scrapingData.summary as Record<string, unknown> | undefined
      
      const immediateUpdate = {
        total_pages: (summary?.totalPages as number) || pages.length,
        total_links: (summary?.totalLinks as number) || 0,
        total_images: (summary?.totalImages as number) || 0,
        status: 'completed' as const,
        progress: 100,
        scraping_completed_at: new Date().toISOString(),
        scraping_data: scrapingData // Store the full scraping data immediately
      }

      console.log('🚀 Updating project status to completed immediately...')
      const { error: immediateUpdateError } = await updateAuditProject(projectId, immediateUpdate)
      
      if (immediateUpdateError) {
        console.error('❌ Error updating project status:', immediateUpdateError)
        setScrapingError(`Failed to update project: ${immediateUpdateError.message || 'Unknown error'}`)
        return
      }

      console.log('✅ Project status updated to completed - UI should show data now')

      // Update Zustand store with the updated project
      const updatedProject = { ...project, ...immediateUpdate } as AuditProject
      setCurrentProject(updatedProject)

      // Notify parent component that data is ready
      if (onDataUpdate) {
        console.log('🔄 Notifying parent component of data update...')
        onDataUpdate(updatedProject, []) // Don't await - let it run in background
      }

      // Save individual pages to database in background (non-blocking)
      console.log(`💾 Saving ${pages.length} pages to database in background...`)
      
      // Start background saving without blocking the UI
      const savePagesInBackground = async () => {
        try {
          const savePromises = pages.map(async (page, index) => {
            try {
              const pageData = {
                audit_project_id: projectId,
                url: page.url || '',
                status_code: page.statusCode || 200,
                title: page.title || '',
                description: page.metaDescription || '',
                html_content: page.htmlContent || '',
                html_content_length: page.htmlContent?.length || 0,
                links_count: page.links?.length || 0,
                images_count: page.images?.length || 0,
                links: page.links || [],
                images: page.images || [],
                meta_tags_count: Number(page.metaTags?.length || 0),
                technologies_count: page.technologies?.length || 0,
                technologies: page.technologies?.map(tech => tech.name) || [],
                cms_type: page.cmsType || null,
                cms_version: page.cmsVersion || null,
                cms_plugins: page.cmsPlugins?.map(plugin => plugin.name) || [],
                social_meta_tags: page.socialMetaTags || {},
                social_meta_tags_count: Object.keys(page.socialMetaTags || {}).length,
                is_external: page.isExternal || false,
                response_time: page.responseTime || null,
                performance_analysis: page.performanceAnalysis || null
              }

              const { error } = await createScrapedPage(pageData)
              if (error) {
                console.error(`❌ Error saving page ${index + 1}:`, error)
              } else {
                console.log(`✅ Saved page ${index + 1}/${pages.length}`)
              }
            } catch (error) {
              console.error(`❌ Error processing page ${index + 1}:`, error)
            }
          })

          // Wait for all pages to be saved
          await Promise.all(savePromises)
          console.log('✅ All pages saved to database in background')
        } catch (error) {
          console.error('❌ Error in background page saving:', error)
        }
      }

      // Start background saving without blocking
      savePagesInBackground()
      
    } catch (error) {
      console.error('❌ Error processing scraping data:', error)
      setScrapingError('Failed to process scraping data')
    }
  }, [updateAuditProject, createScrapedPage, onDataUpdate, project])

  // Start scraping
  const startScraping = useCallback(async () => {
    if (!project || project.status !== 'pending') {
      return
    }

    // Check if scraping is already in progress for this project
    if (isCallActive(project.id)) {
      console.log('⚠️ Scraping already in progress for project:', project.id)
      return
    }

    // Check if already scraping or processing
    if (isScraping || isProcessing) {
      console.log('⚠️ Scraping or processing already in progress')
      return
    }

    // Add this call to active calls
    if (!addActiveCall(project.id)) {
      console.log('⚠️ Failed to add active call - already exists')
      return
    }

    console.log('🚀 Starting scraping for project:', project.id, 'URL:', project.site_url)
    setScraping(true)
    setScrapingError(null)
    setProcessing(true)

    // Check database connection
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
      setScraping(false)
      setProcessing(false)
      removeActiveCall(project.id)
      return
    }

    try {
      // Prepare scraping request data
      const scrapeFormData = {
        url: project.site_url,
        mode: (project as { page_type?: string }).page_type === 'single' ? 'single' : 'multipage',
        maxPages: 100,
        extractImagesFlag: true,
        extractLinksFlag: true,
        detectTechnologiesFlag: true
      }

      // Use secure server-side API route
      const scrapeResponse = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(scrapeFormData)
      })

      if (!scrapeResponse.ok) {
        const errorData = await scrapeResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `Scraping API error: ${scrapeResponse.status} - ${scrapeResponse.statusText}`)
      }

      const scrapeData = await scrapeResponse.json()
      
      console.log('✅ Scraping API completed, processing data...')
      
      // Hide loader immediately after API responds
      setScraping(false)
      setProcessing(false)
      removeActiveCall(project.id)
      // Clear from global initialized projects so it can be re-scraped if needed
      globalInitializedProjects.delete(project.id)
      console.log('✅ Scraping API completed, hiding loader and processing data...')
      
      // Process the scraping data in background (don't await)
      processScrapingData(scrapeData, project.id).catch(error => {
        console.error('❌ Error processing scraping data:', error)
        setScrapingError('Failed to process scraping data')
      })
      
    } catch (apiError) {
      console.error('❌ Scraping API error:', apiError)
      
      let errorMessage = 'Scraping failed: '
      if (apiError instanceof Error) {
        if (apiError.message.includes('Failed to fetch')) {
          errorMessage += 'Network connection lost. Please check your internet connection and try again.'
        } else if (apiError.message.includes('timeout')) {
          errorMessage += 'Request timed out. The scraping service may be overloaded. Please try again.'
        } else {
          errorMessage += apiError.message
        }
      } else {
        errorMessage += 'Unknown error occurred'
      }
      
      setScrapingError(errorMessage)
      setScraping(false)
      setProcessing(false)
      removeActiveCall(project.id)
      // Clear from global initialized projects so it can be retried
      globalInitializedProjects.delete(project.id)
    }
  }, [project, processScrapingData, connectionError, isConnected, isScraping, isProcessing, isCallActive, addActiveCall, removeActiveCall, setScraping, setScrapingError, setProcessing])

  // Auto-start scraping when project is pending
  useEffect(() => {
    if (!project) return
    
    console.log('🔍 useScraping useEffect triggered:', {
      projectId: project.id,
      projectStatus: project.status,
      isScraping,
      isProcessing,
      isCallActive: isCallActive(project.id),
      alreadyInitialized: globalInitializedProjects.has(project.id)
    })
    
    // Only start scraping if:
    // 1. Project is pending
    // 2. Not already scraping or processing
    // 3. Not already initialized globally for this project
    // 4. No active call for this project
    if (project.status === 'pending' && 
        !isScraping && 
        !isProcessing && 
        !globalInitializedProjects.has(project.id) &&
        !isCallActive(project.id)) {
      
      console.log('🚀 Auto-starting scraping for project:', project.id)
      globalInitializedProjects.add(project.id)
      startScraping()
    }
  }, [project, isScraping, isProcessing, startScraping, isCallActive])

  // Cleanup effect to remove active calls when component unmounts
  useEffect(() => {
    return () => {
      if (project) {
        removeActiveCall(project.id)
        // Note: We don't remove from globalInitializedProjects here as other instances might still need it
      }
    }
  }, [project, removeActiveCall])

  return {
    isScraping,
    scrapingError,
    setScrapingError,
    startScraping
  }
}

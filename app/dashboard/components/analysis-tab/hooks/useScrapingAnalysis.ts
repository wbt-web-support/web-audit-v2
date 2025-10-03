import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { AnalysisTabState, ScrapedPage } from '../types';
import { AuditProject } from '@/types/audit';

interface CachedData {
  project: AuditProject | null;
  scrapedPages: ScrapedPage[];
  lastFetchTime: number;
}

export function useScrapingAnalysis(projectId: string, cachedData?: CachedData | null) {
  const {
    getAuditProject,
    getScrapedPages,
    updateAuditProject
  } = useSupabase();
  
  const [state, setState] = useState<AnalysisTabState>({
    project: null,
    scrapedPages: [],
    loading: true,
    error: null,
    activeSection: 'overview',
    dataFetched: false,
    lastFetchTime: 0,
    isScraping: false,
    scrapingError: null,
    isPageSpeedLoading: false,
    hasAutoStartedPageSpeed: false,
    loadedSections: new Set(['overview']),
    scrapedPagesLoaded: false,
    hasAutoStartedSeoAnalysis: false,
    dataVersion: 0,
    isRefreshing: false
  });

  // Track if scraping has been initiated to prevent multiple calls
  const [scrapingInitiated, setScrapingInitiated] = useState(false);
  const initializationRef = useRef(false);

  // Update state helper
  const updateState = useCallback((updates: Partial<AnalysisTabState>) => {
    setState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);


  // Load scraped pages
  const loadScrapedPages = useCallback(async () => {
    if (!projectId) return;
    try {
      const { data: pages, error: pagesError } = await getScrapedPages(projectId);
      if (pagesError) {
        // Handle "Request already in progress" as a non-error case
        if (pagesError.message === 'Request already in progress') {
          console.log('Request already in progress, waiting for existing request to complete');
          return; // Don't treat this as an error
        }
        
        console.error('Error loading scraped pages:', pagesError);
        console.error('Error details:', JSON.stringify(pagesError, null, 2));
        // Don't return early - still try to update state to show error
        updateState({
          error: `Failed to load scraped pages: ${pagesError.message || 'Unknown error'}`
        });
        return;
      }
      if (pages) {
        updateState({
          scrapedPages: pages,
          scrapedPagesLoaded: true,
          error: null // Clear any previous errors
        });
      }
    } catch (error) {
      console.error('Unexpected error loading scraped pages:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      updateState({
        error: `Failed to load scraped pages: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }, [projectId, getScrapedPages, updateState]);

  // Start scraping process
  const startScraping = useCallback(async (project: AuditProject) => {
    // Prevent multiple scraping calls with multiple guards
    if (scrapingInitiated || state.isScraping) {
      return;
    }

    // Additional check to prevent race conditions
    if (initializationRef.current === false) {
      return;
    }
    
    setScrapingInitiated(true);
    updateState({
      isScraping: true,
      scrapingError: null
    });

    try {
      // Call scraping API
      const scrapeResponse = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          url: project.site_url,
          mode: (project as { page_type?: string }).page_type === 'single' ? 'single' : 'multipage',
          maxPages: 100,
          extractImagesFlag: true,
          extractLinksFlag: true,
          detectTechnologiesFlag: true
        })
      });

      if (!scrapeResponse.ok) {
        const errorData = await scrapeResponse.json().catch(() => ({}));
        
        // Handle specific error cases
        if (errorData.code === 'SERVICE_UNAVAILABLE') {
          throw new Error('Scraping service is not running. Please start the scraping service or contact support.');
        }
        throw new Error(errorData.message || errorData.error || `Scraping failed: ${scrapeResponse.status}`);
      }

      const scrapeData = await scrapeResponse.json();
      
      // Update project status to completed FIRST (without large data to avoid timeout)
      const { error: updateError } = await updateAuditProject(project.id, {
        status: 'completed',
        progress: 100,
        scraping_completed_at: new Date().toISOString(),
        total_pages: scrapeData.pages?.length || 0,
        total_links: scrapeData.summary?.totalLinks || 0,
        total_images: scrapeData.summary?.totalImages || 0
      });

      if (updateError) {
        throw new Error(`Failed to update project: ${updateError.message}`);
      }

      // Update the project in state immediately
      const updatedProject = {
        ...project,
        status: 'completed' as const,
        progress: 100,
        scraping_completed_at: new Date().toISOString(),
        total_pages: scrapeData.pages?.length || 0,
        total_links: scrapeData.summary?.totalLinks || 0,
        total_images: scrapeData.summary?.totalImages || 0,
        scraping_data: scrapeData
      };

      updateState({
        project: updatedProject,
        isScraping: false,
        dataVersion: state.dataVersion + 1
      });

    } catch (error) {
      console.error('❌ Scraping error:', error);
      updateState({
        isScraping: false,
        scrapingError: error instanceof Error ? error.message : 'Scraping failed'
      });
    }
  }, [updateState, updateAuditProject, scrapingInitiated, state.isScraping, state.dataVersion]);

  // Load project data from database
  const loadProjectData = useCallback(async (skipAutoScraping = false) => {
    if (!projectId) {
      updateState({
        error: 'No project ID provided',
        loading: false
      });
      return;
    }

    updateState({
      loading: true,
      error: null
    });

    try {
      // Get project data
      const { data: projectData, error: projectError } = await getAuditProject(projectId);
      if (projectError) {
        throw new Error(`Failed to load project: ${projectError.message}`);
      }
      if (!projectData) {
        throw new Error('Project not found');
      }

      updateState({
        project: projectData,
        dataFetched: true,
        lastFetchTime: Date.now(),
        loading: false
      });

      // Always try to load scraped pages if project exists
      if (projectData) {
        await loadScrapedPages();
      }

      // If project is pending and has no data, start scraping
      if (projectData.status === 'pending' && !skipAutoScraping && !scrapingInitiated) {
        await startScraping(projectData);
      }
    } catch (error) {
      console.error('❌ Error loading project data:', error);
      updateState({
        error: error instanceof Error ? error.message : 'Failed to load project',
        loading: false
      });
    }
  }, [projectId, getAuditProject, startScraping, updateState, loadScrapedPages, scrapingInitiated]);

  // Handle section change
  const handleSectionChange = useCallback((section: string) => {
    updateState({
      activeSection: section
    });
  }, [updateState]);

  // Refresh data
  const refreshData = useCallback(async (forceRefresh = false) => {
    if (!projectId || state.isRefreshing) return;
    const now = Date.now();
    const timeSinceLastFetch = now - state.lastFetchTime;
    const REFRESH_THRESHOLD = 10 * 1000; // 10 seconds

    if (!forceRefresh && timeSinceLastFetch < REFRESH_THRESHOLD) {
      return;
    }

    updateState({
      isRefreshing: true
    });
    await loadProjectData(true); // Skip auto-scraping on refresh
    updateState({
      isRefreshing: false
    });
  }, [projectId, state.isRefreshing, state.lastFetchTime, loadProjectData, updateState]);

  // Initial load - prevent double execution in React Strict Mode
  useEffect(() => {
    // Prevent double execution using ref (more reliable than state)
    if (initializationRef.current) {
      return;
    }
    initializationRef.current = true;

    // Use cached data if available
    if (cachedData) {
      updateState({
        project: cachedData.project,
        scrapedPages: cachedData.scrapedPages,
        loading: false,
        error: null,
        dataFetched: true,
        lastFetchTime: cachedData.lastFetchTime
      });
      return;
    }
    loadProjectData();
  }, [projectId, cachedData, loadProjectData, updateState]);

  // Cleanup effect to reset initialization ref when component unmounts
  useEffect(() => {
    return () => {
      initializationRef.current = false;
    };
  }, []);

  return {
    state,
    updateState,
    loadProjectData,
    loadScrapedPages,
    refreshData,
    handleSectionChange,
    startScraping
  };
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { supabase } from '@/lib/supabase-client';
import { AnalysisTabState, ScrapedPage } from '../types';
import { AuditProject } from '@/types/audit';
import { useProjectsStore } from '@/lib/stores/projectsStore';
interface CachedData {
  project: AuditProject | null;
  scrapedPages: ScrapedPage[];
  lastFetchTime: number;
}
export function useScrapingAnalysis(projectId: string, cachedData?: CachedData | null) {
  const {
    getAuditProject,
    getScrapedPages,
    updateAuditProject,
    session
  } = useSupabase();
  
  // Use Zustand store for updating project status
  const { updateProject } = useProjectsStore();
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
      const {
        data: pages,
        error: pagesError
      } = await getScrapedPages(projectId);
      if (pagesError) {
        // Handle "Request already in progress" as a non-error case
        if (pagesError.message === 'Request already in progress') {
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
      // Check if user is authenticated
      if (!session?.access_token) {
        console.error('❌ No session access token available');
        throw new Error('User not authenticated. Please log in again.');
      }
      // Call scraping API
      const scrapeResponse = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          url: project.site_url,
          mode: (project as {
            page_type?: string;
          }).page_type === 'single' ? 'single' : 'multipage',
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

        // Handle plan limit errors
        if (errorData.code === 'PROJECT_LIMIT_REACHED') {
          throw new Error(`Project limit reached: ${errorData.message}`);
        }

        // Handle feature not available errors
        if (errorData.code === 'FEATURE_NOT_AVAILABLE') {
          throw new Error(`Feature not available: ${errorData.message}`);
        }

        // Handle authentication errors
        if (errorData.code === 'MISSING_AUTH' || errorData.code === 'INVALID_AUTH') {
          console.error('❌ Authentication error:', errorData);
          // Try to refresh the session
          try {
            const {
              data: {
                session: newSession
              },
              error: refreshError
            } = await supabase.auth.refreshSession();
            if (refreshError || !newSession) {
              throw new Error('Session refresh failed. Please log in again.');
            }
            // Retry the scraping request with the new token
            const retryResponse = await fetch('/api/scrape', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${newSession.access_token}`
              },
              body: JSON.stringify({
                url: project.site_url,
                mode: (project as {
                  page_type?: string;
                }).page_type === 'single' ? 'single' : 'multipage',
                maxPages: 100,
                extractImagesFlag: true,
                extractLinksFlag: true,
                detectTechnologiesFlag: true
              })
            });
            if (!retryResponse.ok) {
              const retryErrorData = await retryResponse.json().catch(() => ({}));
              throw new Error(retryErrorData.message || retryErrorData.error || `Scraping failed: ${retryResponse.status}`);
            }
            const retryData = await retryResponse.json();

            // Update project status to completed FIRST (without large data to avoid timeout)
            const {
              error: updateError
            } = await updateAuditProject(project.id, {
              status: 'completed',
              progress: 100,
              scraping_completed_at: new Date().toISOString(),
              total_pages: retryData.pages?.length || 0,
              total_links: retryData.summary?.totalLinks || 0,
              total_images: retryData.summary?.totalImages || 0
            });
            if (updateError) {
              throw new Error(`Failed to update project: ${updateError.message}`);
            }

            // Update Zustand store immediately
            updateProject(project.id, {
              status: 'completed',
              progress: 100,
              scraping_completed_at: new Date().toISOString(),
              total_pages: retryData.pages?.length || 0,
              total_links: retryData.summary?.totalLinks || 0,
              total_images: retryData.summary?.totalImages || 0
            } as any);

            // Update the project in state immediately
            const updatedProject = {
              ...project,
              status: 'completed' as const,
              progress: 100,
              scraping_completed_at: new Date().toISOString(),
              total_pages: retryData.pages?.length || 0,
              total_links: retryData.summary?.totalLinks || 0,
              total_images: retryData.summary?.totalImages || 0,
              scraping_data: retryData
            };
            updateState({
              project: updatedProject,
              isScraping: false,
              dataVersion: state.dataVersion + 1
            });
            return; // Success, exit early
          } catch (refreshError) {
            console.error('❌ Session refresh failed:', refreshError);
            throw new Error('Authentication required. Please log in again.');
          }
        }
        throw new Error(errorData.message || errorData.error || `Scraping failed: ${scrapeResponse.status}`);
      }
      const scrapeData = await scrapeResponse.json();

      // Log the scraping data received from API
      console.log('📥 Scraping data received:', {
        hasSummary: !!scrapeData.summary,
        hasFavicons: !!(scrapeData as any).summary?.favicons,
        faviconCount: (scrapeData as any).summary?.favicons?.length || 0,
        firstFavicon: (scrapeData as any).summary?.favicons?.[0]
      });

      // Update project status to completed FIRST (without large data to avoid timeout)
      const {
        error: updateError
      } = await updateAuditProject(project.id, {
        status: 'completed',
        progress: 100,
        scraping_completed_at: new Date().toISOString(),
        total_pages: scrapeData.pages?.length || 0,
        total_links: scrapeData.summary?.totalLinks || 0,
        total_images: scrapeData.summary?.totalImages || 0,
        brand_data: {
          favicons: (scrapeData as any).summary?.favicons || [],
          summary: scrapeData.summary
        } // Store favicon data in brand_data
      });
      if (updateError) {
        throw new Error(`Failed to update project: ${updateError.message}`);
      }

      // Update Zustand store immediately
      updateProject(project.id, {
        status: 'completed',
        progress: 100,
        scraping_completed_at: new Date().toISOString(),
        total_pages: scrapeData.pages?.length || 0,
        total_links: scrapeData.summary?.totalLinks || 0,
        total_images: scrapeData.summary?.totalImages || 0
      } as any);

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

      // Provide more user-friendly error messages
      let errorMessage = 'Scraping failed';
      if (error instanceof Error) {
        if (error.message.includes('Authentication required')) {
          errorMessage = 'Your session has expired. Please refresh the page and try again.';
        } else if (error.message.includes('SERVICE_UNAVAILABLE')) {
          errorMessage = 'The scraping service is currently unavailable. Please try again later.';
        } else if (error.message.includes('PROJECT_LIMIT_REACHED')) {
          errorMessage = 'You have reached your project limit. Please upgrade your plan to create more projects.';
        } else if (error.message.includes('FEATURE_NOT_AVAILABLE')) {
          errorMessage = 'This feature is not available in your current plan. Please upgrade to access this feature.';
        } else {
          errorMessage = error.message;
        }
      }
      updateState({
        isScraping: false,
        scrapingError: errorMessage
      });
    }
  }, [updateState, updateAuditProject, scrapingInitiated, state.isScraping, state.dataVersion, session?.access_token]);

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
      const {
        data: projectData,
        error: projectError
      } = await getAuditProject(projectId);
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
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { AuditProject } from '@/types/audit'
import { ScrapedPage } from '@/app/dashboard/components/analysis-tab/types'

interface ScrapingState {
  // Scraping status
  isScraping: boolean
  scrapingError: string | null
  isProcessing: boolean
  
  // Project data
  currentProject: AuditProject | null
  scrapedPages: ScrapedPage[]
  
  // API call tracking
  activeScrapingCalls: Set<string> // Track active scraping calls by project ID
  
  // Actions
  setScraping: (isScraping: boolean) => void
  setScrapingError: (error: string | null) => void
  setProcessing: (isProcessing: boolean) => void
  setCurrentProject: (project: AuditProject | null) => void
  setScrapedPages: (pages: ScrapedPage[]) => void
  addScrapedPage: (page: ScrapedPage) => void
  
  // API call management
  addActiveCall: (projectId: string) => boolean // Returns true if call was added, false if already exists
  removeActiveCall: (projectId: string) => void
  isCallActive: (projectId: string) => boolean
  
  // Reset functions
  resetScrapingState: () => void
  resetProjectData: () => void
}

export const useScrapingStore = create<ScrapingState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isScraping: false,
      scrapingError: null,
      isProcessing: false,
      currentProject: null,
      scrapedPages: [],
      activeScrapingCalls: new Set(),
      
      // Actions
      setScraping: (isScraping) => set({ isScraping }),
      
      setScrapingError: (scrapingError) => set({ scrapingError }),
      
      setProcessing: (isProcessing) => set({ isProcessing }),
      
      setCurrentProject: (currentProject) => set({ currentProject }),
      
      setScrapedPages: (scrapedPages) => set({ scrapedPages }),
      
      addScrapedPage: (page) => set((state) => ({
        scrapedPages: [...state.scrapedPages, page]
      })),
      
      // API call management
      addActiveCall: (projectId) => {
        const { activeScrapingCalls } = get()
        if (activeScrapingCalls.has(projectId)) {
          return false // Call already active
        }
        set((state) => ({
          activeScrapingCalls: new Set([...state.activeScrapingCalls, projectId])
        }))
        return true
      },
      
      removeActiveCall: (projectId) => set((state) => {
        const newCalls = new Set(state.activeScrapingCalls)
        newCalls.delete(projectId)
        return { activeScrapingCalls: newCalls }
      }),
      
      isCallActive: (projectId) => {
        const { activeScrapingCalls } = get()
        return activeScrapingCalls.has(projectId)
      },
      
      // Reset functions
      resetScrapingState: () => set({
        isScraping: false,
        scrapingError: null,
        isProcessing: false,
        activeScrapingCalls: new Set()
      }),
      
      resetProjectData: () => set({
        currentProject: null,
        scrapedPages: []
      })
    }),
    {
      name: 'scraping-store',
    }
  )
)

// Export the store for direct use with individual selectors
// This prevents infinite loops by avoiding object recreation in selectors

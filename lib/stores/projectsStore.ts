import { create } from 'zustand';
import { AuditProject } from '@/types/audit';

interface ProjectsState {
  projects: AuditProject[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  fetchFunction: (() => Promise<AuditProject[]>) | null;
  
  // Actions
  setProjects: (projects: AuditProject[]) => void;
  updateProject: (projectId: string, updates: Partial<AuditProject>) => void;
  addProject: (project: AuditProject) => void;
  removeProject: (projectId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFetchFunction: (fetchFn: () => Promise<AuditProject[]>) => void;
  refreshProjects: () => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  loading: false,
  error: null,
  lastUpdated: 0,
  fetchFunction: null,

  setProjects: (projects) => set({ 
    projects, 
    lastUpdated: Date.now(),
    loading: false,
    error: null 
  }),

  updateProject: (projectId, updates) => set((state) => ({
    projects: state.projects.map(project =>
      project.id === projectId
        ? { ...project, ...updates }
        : project
    ),
    lastUpdated: Date.now()
  })),

  addProject: (project) => set((state) => ({
    projects: [project, ...state.projects],
    lastUpdated: Date.now()
  })),

  removeProject: (projectId) => set((state) => ({
    projects: state.projects.filter(project => project.id !== projectId),
    lastUpdated: Date.now()
  })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),

  setFetchFunction: (fetchFn) => set({ fetchFunction: fetchFn }),

  refreshProjects: async () => {
    const { fetchFunction } = get();
    if (!fetchFunction) {
      // Silently return if fetch function not set yet (will be set by component)
      return;
    }
    
    set({ loading: true, error: null });
    try {
      const projects = await fetchFunction();
      set({ 
        projects, 
        lastUpdated: Date.now(),
        loading: false,
        error: null 
      });
    } catch {
      set({ error: 'Failed to fetch projects', loading: false });
    }
  }
}));

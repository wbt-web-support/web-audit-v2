'use client';

import { useState } from 'react';
import ProjectsTab from '../tabs/ProjectsTab';
import { AuditProject } from '@/types/audit';

// Example implementation showing how to use the CRUD operations
export default function ProjectsTabExample() {
  const [projects, setProjects] = useState<AuditProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Mock data for demonstration
  const mockProjects: AuditProject[] = [
    {
      id: '1',
      site_url: 'https://example.com',
      status: 'completed',
      progress: 100,
      last_audit_at: '2024-01-15T10:30:00Z',
      issues_count: 5,
      score: 85,
      created_at: '2024-01-15T09:00:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      total_pages: 10,
      total_links: 25,
      total_images: 15,
      total_meta_tags: 8,
      technologies_found: 3,
      cms_detected: true,
      cms_type: 'WordPress',
      cms_version: '6.4',
      cms_plugins: [],
      cms_themes: [],
      cms_components: [],
      cms_confidence: 0.95,
      cms_detection_method: 'meta_generator',
      cms_metadata: null,
      technologies: [],
      technologies_confidence: 0.8,
      technologies_detection_method: 'script_analysis',
      technologies_metadata: null,
      total_html_content: 50000,
      average_html_per_page: 5000,
      pagespeed_insights_data: null,
      pagespeed_insights_loading: false,
      pagespeed_insights_error: null,
      scraping_data: null,
      seo_analysis: null,
      meta_tags_data: null,
      social_meta_tags_data: null,
      all_pages_html: null,
      images: null,
      links: null
    }
  ];

  const refreshProjects = async () => {
    setProjectsLoading(true);
    setProjectsError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProjects(mockProjects);
    } catch (error) {
      setProjectsError('Failed to load projects');
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleProjectSelect = (projectId: string) => {
    console.log('Selected project:', projectId);
    // Navigate to analysis page
  };

  const handleUpdateProject = async (projectId: string, data: {
    siteUrl: string;
    pageType: 'single' | 'multiple';
    brandConsistency: boolean;
    hiddenUrls: boolean;
    keysCheck: boolean;
    brandData: any;
    hiddenUrlsList: any[];
  }) => {
    console.log('ProjectsTabExample: handleUpdateProject called with:', { projectId, data });
    
    try {
      // Simulate API call
      console.log('ProjectsTabExample: Simulating API call...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the project in the local state
      console.log('ProjectsTabExample: Updating project in state...');
      setProjects(prev => prev.map(project => 
        project.id === projectId 
          ? { ...project, site_url: data.siteUrl, updated_at: new Date().toISOString() }
          : project
      ));
      
      console.log('ProjectsTabExample: Project updated successfully');
    } catch (error) {
      console.error('ProjectsTabExample: Error updating project:', error);
      throw error;
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    console.log('Deleting project:', projectId);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove the project from local state
      setProjects(prev => prev.filter(project => project.id !== projectId));
      
      console.log('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  const handleRecrawlProject = async (projectId: string) => {
    console.log('Recrawling project:', projectId);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update project status to pending
      setProjects(prev => prev.map(project => 
        project.id === projectId 
          ? { 
              ...project, 
              status: 'pending' as const, 
              progress: 0,
              updated_at: new Date().toISOString() 
            }
          : project
      ));
      
      console.log('Project recrawl initiated');
    } catch (error) {
      console.error('Error recrawling project:', error);
      throw error;
    }
  };

  return (
    <div className="p-6">
      <ProjectsTab
        projects={projects}
        projectsLoading={projectsLoading}
        projectsError={projectsError}
        refreshProjects={refreshProjects}
        onProjectSelect={handleProjectSelect}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        onRecrawlProject={handleRecrawlProject}
      />
    </div>
  );
}

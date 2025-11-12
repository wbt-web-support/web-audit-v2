'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { AuditProject } from '@/types/audit';
import { ProjectCardSkeleton, StatsCardSkeleton } from '../SkeletonLoader';
import EditProjectModal from '../modals/EditProjectModal';
import { useProjectsStore } from '@/lib/stores/projectsStore';
import FaviconDisplay from '../FaviconDisplay';
interface BrandConsistencyData {
  companyName: string;
  phoneNumber: string;
  emailAddress: string;
  address: string;
  additionalInformation: string;
}
interface HiddenUrl {
  id: string;
  url: string;
}
interface ProjectsTabProps {
  userProfile: unknown;
  onProjectSelect?: (projectId: string) => void;
  onUpdateProject?: (projectId: string, data: {
    siteUrl: string;
    pageType: 'single' | 'multiple';
    brandConsistency: boolean;
    hiddenUrls: boolean;
    keysCheck: boolean;
    brandData: BrandConsistencyData;
    hiddenUrlsList: HiddenUrl[];
  }) => Promise<void>;
  onDeleteProject?: (projectId: string) => Promise<void>;
  onRecrawlProject?: (projectId: string) => Promise<void>;
}
export default function ProjectsTab({
  onProjectSelect,
  onUpdateProject,
  onDeleteProject,
  onRecrawlProject
}: Omit<ProjectsTabProps, 'userProfile'>) {
  // Use Zustand store for projects data
  const { projects, loading: projectsLoading, error: projectsError, refreshProjects } = useProjectsStore();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const previousProjectsRef = useRef<AuditProject[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<AuditProject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // Load projects when component mounts
  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  // Zustand store automatically handles status updates - no need for manual monitoring

  // Performance tracking
  useEffect(() => {
    if (projectsLoading) {} else if (projectsError) {} else if (projects.length === 0) {} else {
      // Use requestAnimationFrame to measure after DOM updates
      requestAnimationFrame(() => {
        // Performance tracking logic can be added here if needed
      });
    }
  }, [projectsLoading, projectsError, projects.length]);
  const toggleCardExpansion = (projectId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };
  const handleEditProject = (project: AuditProject) => {
    setSelectedProject(project);
    setEditModalOpen(true);
  };
  const handleSaveProject = async (projectId: string, data: {
    siteUrl: string;
    pageType: 'single' | 'multiple';
    brandConsistency: boolean;
    hiddenUrls: boolean;
    keysCheck: boolean;
    brandData: BrandConsistencyData;
    hiddenUrlsList: HiddenUrl[];
  }) => {
    if (!onUpdateProject) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onUpdateProject(projectId, data);
      setEditModalOpen(false);
      setSelectedProject(null);
      await refreshProjects();
    } catch (error) {
      console.error('ProjectsTab: Error updating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Removed unused handleRecrawlProject function

  const handleDeleteProject = (projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteConfirmOpen(true);
  };
  const confirmDeleteProject = async () => {
    if (!onDeleteProject || !projectToDelete) return;
    try {
      await onDeleteProject(projectToDelete);
      await refreshProjects();
      setDeleteConfirmOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };
  const cancelDeleteProject = () => {
    setDeleteConfirmOpen(false);
    setProjectToDelete(null);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-[#ff4b01]/10 text-[#ff4b01] border border-[#ff4b01]/30';
      case 'in_progress':
        return 'bg-[#ff4b01]/10 text-[#ff4b01] border border-[#ff4b01]/30';
      case 'pending':
        return 'bg-gray-50 text-gray-700 border border-gray-200';
      case 'failed':
        return 'bg-gray-50 text-gray-700 border border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };
  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };
  const getProjectName = (siteUrl: string) => {
    try {
      const url = new URL(siteUrl);
      return url.hostname.replace('www.', '');
    } catch {
      return siteUrl;
    }
  };
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Calculate basic statistics for quick overview
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const inProgressProjects = projects.filter(p => p.status === 'in_progress').length;
  const totalIssues = projects.reduce((sum, p) => sum + p.issues_count, 0);
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.4,
    ease: "easeOut"
  }} className="space-y-8 lg:px-8">
      {/* Header */}
      <motion.div initial={{
      opacity: 0,
      y: -20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.3,
      ease: "easeOut"
    }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between  lg:pt-8">
        <div>
          <h1 className="text-2xl font-semibold text-black mb-2">Projects</h1>
          <p className="text-gray-600">Manage and monitor your web audit projects</p>
        </div>
       
      </motion.div>

      {/* Quick Stats Summary */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.3,
      ease: "easeOut"
    }} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {projectsLoading ? Array.from({
        length: 4
      }).map((_, index) => <StatsCardSkeleton key={index} />) : <>
            <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.3,
          delay: 0 * 0.1,
          ease: "easeOut"
        }} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-[#ff4b01]/10 rounded-lg">
                  <svg className="w-6 h-6 text-[#ff4b01]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Projects</p>
                  <p className="text-2xl font-bold text-black">{totalProjects}</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.3,
          delay: 1 * 0.1,
          ease: "easeOut"
        }} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-[#ff4b01]/10 rounded-lg">
                  <svg className="w-6 h-6 text-[#ff4b01]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-black">{completedProjects}</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.3,
          delay: 2 * 0.1,
          ease: "easeOut"
        }} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-[#ff4b01]/10 rounded-lg">
                  <svg className="w-6 h-6 text-[#ff4b01]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">In Progress</p>
                  <p className="text-2xl font-bold text-black">{inProgressProjects}</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.3,
          delay: 3 * 0.1,
          ease: "easeOut"
        }} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-[#ff4b01]/10 rounded-lg">
                  <svg className="w-6 h-6 text-[#ff4b01]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Issues</p>
                  <p className="text-2xl font-bold text-black">{totalIssues}</p>
                </div>
              </div>
            </motion.div>
          </>}
      </motion.div>

      {/* Projects Cards */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.3,
      ease: "easeOut"
    }} className="space-y-8">
        <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.3,
        ease: "easeOut"
      }} className="flex items-center justify-between ">
          <h2 className="text-xl font-semibold text-black">All Projects</h2>
          <div className="text-sm text-gray-500">
            {projectsLoading ? 'Loading...' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
          </div>
        </motion.div>
        
        {projectsLoading ? <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.3,
        ease: "easeOut"
      }} className="space-y-6">
            {Array.from({
          length: 3
        }).map((_, index) => <ProjectCardSkeleton key={index} />)}
          </motion.div> : projectsError ? <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.3,
        ease: "easeOut"
      }} className="text-center py-16 ">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium text-lg mb-2">{projectsError}</p>
            {projectsError?.includes('Supabase not configured') && <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-lg max-w-md mx-auto">
                <p className="text-sm text-gray-600">
                  Please create a <code className="bg-gray-100 px-2 py-1 rounded text-sm">.env.local</code> file with your Supabase credentials.
                  <br />
                  See <code className="bg-gray-100 px-2 py-1 rounded text-sm">env.example</code> for reference.
                </p>
              </div>}
            <button onClick={() => refreshProjects()} className="mt-6 text-[#ff4b01] text-sm font-medium px-6 py-3 bg-[#ff4b01]/10 border border-[#ff4b01]/30 rounded-lg cursor-pointer">
              Try again
            </button>
          </motion.div> : projects.length === 0 ? <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.3,
        ease: "easeOut"
      }} className="text-center py-16 ">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium text-lg mb-2">No projects yet</p>
            <p className="text-gray-500">Create your first audit project to get started</p>
          </motion.div> : <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.3,
        ease: "easeOut"
      }} className="space-y-6">
            {projects.map((project, index) => {
          const isExpanded = expandedCards.has(project.id);
          return <motion.div key={project.id} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.3,
            delay: index * 0.1,
            ease: "easeOut"
          }} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Card Header - Always Visible */}
                <div className="p-4 border-b border-gray-200 cursor-pointer" onClick={() => toggleCardExpansion(project.id)}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <FaviconDisplay 
                            projectId={project.id}
                            size="sm"
                            className="flex-shrink-0"
                          />
                          <h3 className="text-lg font-semibold text-black truncate">
                            {getProjectName(project.site_url)}
                          </h3>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded flex-shrink-0 ${getStatusColor(project.status)}`}>
                            {getStatusDisplayName(project.status)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mb-2 break-all">{project.site_url}</p>
                      
                      {/* Basic Summary - Only show metrics with data */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-6 text-sm text-gray-600">
                        {project.total_pages > 0 && <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            {project.total_pages} pages
                          </div>}
                        {project.total_links > 0 && <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            {project.total_links} links
                          </div>}
                        {project.issues_count > 0 && <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            {project.issues_count} issues
                          </div>}
                        {project.last_audit_at && <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDate(project.last_audit_at)}
                          </div>}
                        {/* Show technologies count if there are technologies */}
                        {project.technologies && project.technologies.length > 0 && <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            {project.technologies.length} tech
                          </div>}
                        {/* Show CMS info if detected */}
                        {project.cms_detected && <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {project.cms_type || 'CMS'} detected
                          </div>}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                     
                      
                      {/* Expand/Collapse Button */}
                      <motion.button className="p-2 rounded  bg-white cursor-pointer">
                        <motion.svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" animate={{
                      rotate: isExpanded ? 180 : 0
                    }} transition={{
                      duration: 0.2
                    }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </motion.svg>
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Collapsible Detailed Summary */}
                <AnimatePresence>
                  {isExpanded && <motion.div initial={{
                height: 0,
                opacity: 0
              }} animate={{
                height: 'auto',
                opacity: 1
              }} exit={{
                height: 0,
                opacity: 0
              }} transition={{
                duration: 0.3,
                ease: 'easeInOut'
              }} className="overflow-hidden">
                      <div className="p-4 bg-gray-50 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-black mb-3 flex items-center">
                          <FaviconDisplay 
                            projectId={project.id}
                            size="sm"
                            className="mr-2"
                          />
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Detailed Summary
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {/* Pages & Links */}
                          <div className="space-y-3">
                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Content</h5>
                            <div className="space-y-2">
                              {project.total_pages > 0 && <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Pages
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.total_pages}</span>
                                </div>}
                              {project.total_links > 0 && <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    Links
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.total_links}</span>
                                </div>}
                              {project.total_images > 0 && <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Images
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.total_images}</span>
                                </div>}
                              {project.total_meta_tags > 0 && <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    Meta Tags
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.total_meta_tags}</span>
                                </div>}
                            </div>
                          </div>

                          {/* Technical Details */}
                          <div className="space-y-3">
                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Technical</h5>
                            <div className="space-y-2">
                              {project.technologies_found > 0 && <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    Technologies
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.technologies_found}</span>
                                </div>}
                              {project.issues_count > 0 && <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    Issues
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.issues_count}</span>
                                </div>}
                              {project.cms_detected && <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    CMS Detected
                                  </div>
                                  <span className="font-semibold text-[#ff4b01]">Yes</span>
                                </div>}
                            </div>
                          </div>
                        </div>

                        {/* CMS Information - Only show if CMS is detected and has data */}
                        {project.cms_detected && (project.cms_type || project.cms_version || project.cms_plugins && project.cms_plugins.length > 0 || project.cms_themes && project.cms_themes.length > 0 || project.cms_components && project.cms_components.length > 0) && <div className="mt-6 pt-4 border-t border-gray-200">
                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                              <FaviconDisplay 
                                projectId={project.id}
                                size="sm"
                                className="mr-2"
                              />
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              CMS Information
                            </h5>
                            
                            <div className="grid grid-cols-2 gap-6 mb-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    CMS Type
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.cms_type || 'Unknown'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    Version
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.cms_version || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Confidence
                                  </div>
                                  <span className="font-semibold text-gray-900">{Math.round((project.cms_confidence || 0) * 100)}%</span>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    Plugins
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.cms_plugins?.length || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    Themes
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.cms_themes?.length || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Components
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.cms_components?.length || 0}</span>
                                </div>
                              </div>
                            </div>

                            {/* CMS Plugins List - Only show if there are plugins */}
                            {project.cms_plugins && project.cms_plugins.length > 0 && <div className="mb-4">
                                <h6 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Detected Plugins</h6>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {project.cms_plugins.slice(0, 5).map((plugin: {
                          name: string;
                          version?: string;
                          active?: boolean;
                          confidence: number;
                        }, index: number) => <div key={index} className="flex items-center justify-between text-xs bg-gray-100 rounded px-2 py-1">
                                      <div className="flex items-center">
                                        <span className="font-medium text-gray-900">{plugin.name}</span>
                                        {plugin.version && <span className="ml-2 text-gray-500">v{plugin.version}</span>}
                                        {plugin.active && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-[#ff4b01]/20 text-[#ff4b01]">
                                            Active
                                          </span>}
                                      </div>
                                      <span className="text-gray-500">{Math.round(plugin.confidence * 100)}%</span>
                                    </div>)}
                                  {project.cms_plugins.length > 5 && <div className="text-xs text-gray-500 text-center py-1">
                                      +{project.cms_plugins.length - 5} more plugins
                                    </div>}
                                </div>
                              </div>}

                            {/* CMS Themes List - Only show if there are themes */}
                            {project.cms_themes && project.cms_themes.length > 0 && <div className="mb-4">
                                <h6 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Detected Themes</h6>
                                <div className="space-y-1">
                                  {project.cms_themes.slice(0, 3).map((theme: {
                          name: string;
                          version?: string;
                          active?: boolean;
                          confidence: number;
                        }, index: number) => <div key={index} className="flex items-center justify-between text-xs bg-gray-100 rounded px-2 py-1">
                                      <div className="flex items-center">
                                        <span className="font-medium text-gray-900">{theme.name}</span>
                                        {theme.version && <span className="ml-2 text-gray-500">v{theme.version}</span>}
                                        {theme.active && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-[#ff4b01]/20 text-[#ff4b01]">
                                            Active
                                          </span>}
                                      </div>
                                      <span className="text-gray-500">{Math.round(theme.confidence * 100)}%</span>
                                    </div>)}
                                </div>
                              </div>}
                          </div>}

                        {/* Technologies Information - Only show if there are technologies */}
                        {project.technologies && project.technologies.length > 0 && <div className="mt-6 pt-4 border-t border-gray-200">
                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                              <FaviconDisplay 
                                projectId={project.id}
                                size="sm"
                                className="mr-2"
                              />
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              Technical Detected
                            </h5>
                            
                            <div className="grid grid-cols-2 gap-6 mb-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Total Technologies
                                  </div>
                                  <span className="font-semibold text-gray-900">{project.technologies.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Categories
                                  </div>
                                  <span className="font-semibold text-gray-900">
                                    {project.technologies_metadata?.categories?.length || 0}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Confidence
                                  </div>
                                  <span className="font-semibold text-gray-900">
                                    {Math.round((project.technologies_confidence || 0) * 100)}%
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    High Confidence
                                  </div>
                                  <span className="font-semibold text-[#ff4b01]">
                                    {project.technologies_metadata?.high_confidence_technologies || 0}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    Medium Confidence
                                  </div>
                                  <span className="font-semibold text-[#ff4b01]">
                                    {project.technologies_metadata?.medium_confidence_technologies || 0}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Low Confidence
                                  </div>
                                  <span className="font-semibold text-gray-600">
                                    {project.technologies_metadata?.low_confidence_technologies || 0}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Technologies List by Category */}
                            {project.technologies_metadata?.technologies_by_category && <div className="space-y-4">
                                {Object.entries(project.technologies_metadata.technologies_by_category).map(([category, techs]) => {
                        const techsArray = techs as Array<{
                          name: string;
                          version?: string;
                          confidence: number;
                          icon?: string;
                        }>;
                        return <div key={category} className="bg-gray-50 rounded-lg p-4">
                                    <h6 className="text-sm font-semibold text-gray-700 mb-3 capitalize flex items-center">
                                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                      </svg>
                                      {category} ({techsArray.length})
                                    </h6>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {techsArray.slice(0, 6).map((tech, index: number) => <div key={index} className="flex items-center justify-between text-xs bg-white rounded px-3 py-2 border">
                                          <div className="flex items-center">
                                            {tech.icon && <Image src={tech.icon} alt={tech.name} width={16} height={16} className="w-4 h-4 mr-2 rounded" onError={e => {
                                  e.currentTarget.style.display = 'none';
                                }} />}
                                            <span className="font-medium text-gray-900">{tech.name}</span>
                                            {tech.version && <span className="ml-2 text-gray-500">v{tech.version}</span>}
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${tech.confidence >= 0.8 ? 'bg-[#ff4b01]/20 text-[#ff4b01]' : tech.confidence >= 0.5 ? 'bg-[#ff4b01]/10 text-[#ff4b01]' : 'bg-gray-100 text-gray-700'}`}>
                                              {Math.round(tech.confidence * 100)}%
                                            </span>
                                          </div>
                                        </div>)}
                                      {techsArray.length > 6 && <div className="text-xs text-gray-500 text-center py-2 col-span-full">
                                          +{techsArray.length - 6} more technologies
                                        </div>}
                                    </div>
                                  </div>;
                      })}
                              </div>}
                          </div>}

                        {/* HTML Content Details - Only show if there's content data */}
                        {(project.total_html_content > 0 || project.average_html_per_page > 0) && <div className="mt-6 pt-4 border-t border-gray-200">
                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Content Analysis</h5>
                            <div className="grid grid-cols-2 gap-6">
                              {project.total_html_content > 0 && <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Total HTML Content
                                  </div>
                                  <span className="font-semibold text-gray-900">{Math.round(project.total_html_content / 1000)}K</span>
                                </div>}
                              {project.average_html_per_page > 0 && <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Average per Page
                                  </div>
                                  <span className="font-semibold text-gray-900">{Math.round(project.average_html_per_page / 1000)}K</span>
                                </div>}
                            </div>
                          </div>}
                      </div>
                    </motion.div>}
                </AnimatePresence>

                {/* Card Footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Created {formatDate(project.created_at)}
                    </div>
                    <div className="flex space-x-2">
                      {project.status === 'completed' && <button onClick={() => onProjectSelect?.(project.id)} className="text-[#ff4b01] text-xs font-medium px-3 py-2 bg-[#ff4b01]/10 border border-[#ff4b01]/30 rounded cursor-pointer">
                          View Analysis
                        </button>}
                      {project.status === 'pending' && <button onClick={() => onProjectSelect?.(project.id)} className="text-[#ff4b01] text-xs font-medium px-3 py-2 bg-[#ff4b01]/10 border border-[#ff4b01]/30 rounded cursor-pointer">
                          View Details
                        </button>}
                      <button onClick={() => handleEditProject(project)} className="text-gray-600 text-xs font-medium px-3 py-1 bg-white border border-gray-200 rounded cursor-pointer">
                        Edit
                      </button>
                      <button onClick={() => handleDeleteProject(project.id)} className="text-red-600 text-xs font-medium px-3 py-1 bg-red-50 border border-red-200 rounded cursor-pointer">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>;
        })}
          </motion.div>}
      </motion.div>

      {/* Edit Project Modal */}
      <EditProjectModal isOpen={editModalOpen} onClose={() => {
      setEditModalOpen(false);
      setSelectedProject(null);
    }} project={selectedProject} onSave={handleSaveProject} onDelete={handleDeleteProject} isSubmitting={isSubmitting} />

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full border border-gray-300 ">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">Delete Project</h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete this project? This action cannot be undone and will permanently remove all project data including:
                </p>
                <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                  <li>Project configuration</li>
                  <li>Scraped pages and data</li>
                  <li>Analysis results</li>
                  <li>All associated files</li>
                </ul>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button onClick={cancelDeleteProject} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={confirmDeleteProject} className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 transition-colors">
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>}
    </motion.div>;
}
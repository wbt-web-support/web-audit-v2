'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AuditProject } from '@/types/audit';
import { RecentProjectSkeleton } from '../SkeletonLoader';
import { useProjectsStore } from '@/lib/stores/projectsStore';
import FaviconDisplay from '../FaviconDisplay';
interface RecentProjectsProps {
  onProjectSelect?: (projectId: string) => void;
}
export default function RecentProjects({
  onProjectSelect
}: RecentProjectsProps) {
  const router = useRouter();
  // Use Zustand store for projects data
  const { projects, loading: projectsLoading, error: projectsError, refreshProjects } = useProjectsStore();
  // const previousProjectsRef = useRef<AuditProject[]>([]);



  // Load projects when component mounts
  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const getProjectName = (siteUrl: string) => {
    try {
      const url = new URL(siteUrl);
      return url.hostname.replace('www.', '');
    } catch {
      return siteUrl;
    }
  };
  return <motion.div 
      className="bg-white border border-gray-200 rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-black">Recent Projects</h2>
            <p className="text-gray-600 text-sm">Your latest audit activities</p>
          </div>
          <button onClick={() => refreshProjects()} className="text-gray-600 relative" disabled={projectsLoading}>
            <svg className={`w-5 h-5 ${projectsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {projectsLoading && <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#ff4b01] rounded-full animate-pulse"></div>}
          </button>
        </div>
      </div>
        
      <div className="p-4 sm:p-6">
        {projectsLoading ? <div className="space-y-4">
            {Array.from({
          length: 3
        }).map((_, index) => <RecentProjectSkeleton key={index} />)}
          </div> : projectsError ? <div className="text-center py-8">
            <div className="text-red-500 mb-2">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{projectsError}</p>
            {projectsError.includes('Supabase not configured') && <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Please create a <code className="bg-yellow-100 px-1 rounded">.env.local</code> file with your Supabase credentials.
                  <br />
                  See <code className="bg-yellow-100 px-1 rounded">env.example</code> for reference.
                </p>
              </div>}
            <button onClick={() => refreshProjects()} className="mt-2 text-[#ff4b01] text-sm font-medium px-4 py-2 bg-[#ff4b01]/10 rounded-lg hover:bg-[#ff4b01]/20 transition-colors">
              Try again
            </button>
          </div> : projects.length === 0 ? <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No projects yet</p>
            <p className="text-gray-500 text-sm">Create your first audit project to get started</p>
          </div> : <div className="space-y-4">
            {projects.slice(0, 3).map((project, index) => <motion.div 
              key={project.id} 
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1, ease: "easeOut" }}
            >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-2 gap-2">
                    <FaviconDisplay 
                      projectId={project.id}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <h3 className="font-semibold text-black truncate">
                      {getProjectName(project.site_url)}
                    </h3>
                  </div>
                 
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600">
                    {project.issues_count > 0 && <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        {project.issues_count} issues
                      </span>}
                    {project.score > 0 && <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Score: {project.score}/100
                      </span>}
                    {project.total_pages > 0 && <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        {project.total_pages} pages
                      </span>}
                    {project.technologies && project.technologies.length > 0 && <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        {project.technologies.length} tech
                      </span>}
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end space-y-2 w-full sm:w-auto">
                  {project.status === 'completed' ? <button onClick={() => onProjectSelect?.(project.id)} className="text-[#ff4b01] text-sm font-medium hover:text-[#ff4b01]/80 transition-colors">
                      View Analysis →
                    </button> : project.status === 'pending' ? <button onClick={() => onProjectSelect?.(project.id)} className="text-[#ff4b01] text-sm font-medium hover:text-[#ff4b01]/80 transition-colors">
                      View Details →
                    </button> : <button className="text-gray-500 text-sm font-medium">
                      {project.status === 'in_progress' ? 'Processing...' : 'Pending'}
                    </button>}
                </div>
              </motion.div>)}
          </div>}
          
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('tab', 'projects');
              router.push(url.toString());
            }}
            className="w-full text-center text-[#ff4b01] font-medium hover:text-[#ff4b01]/80 transition-colors"
          >
            View All Projects
          </button>
        </div>
      </div>
    </motion.div>
}
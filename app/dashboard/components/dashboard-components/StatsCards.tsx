'use client'

import { AuditProject } from '@/types/audit'

interface StatsCardsProps {
  projects: AuditProject[]
  projectsLoading: boolean
}

export default function StatsCards({ projects, projectsLoading }: StatsCardsProps) {

  // Calculate stats
  const totalProjects = projects.length
  const activeProjects = projects.filter(p => p.status === 'in_progress').length
  const completedProjects = projects.filter(p => p.status === 'completed').length
  const successRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Projects</p>
            <p className="text-2xl font-bold text-black mt-1">
              {projectsLoading ? '...' : totalProjects}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {projectsLoading ? 'Loading...' : totalProjects > 0 ? 'Active projects' : 'No projects yet'}
            </p>
          </div>
          <div className="p-3 rounded bg-blue-100 text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Active Projects</p>
            <p className="text-2xl font-bold text-black mt-1">
              {projectsLoading ? '...' : activeProjects}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {projectsLoading ? 'Loading...' : activeProjects > 0 ? 'Currently running' : 'None active'}
            </p>
          </div>
          <div className="p-3 rounded bg-blue-100 text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Completed Projects</p>
            <p className="text-2xl font-bold text-black mt-1">
              {projectsLoading ? '...' : completedProjects}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {projectsLoading ? 'Loading...' : completedProjects > 0 ? 'Successfully finished' : 'None completed'}
            </p>
          </div>
          <div className="p-3 rounded bg-blue-100 text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Success Rate</p>
            <p className="text-2xl font-bold text-black mt-1">
              {projectsLoading ? '...' : `${successRate}%`}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {projectsLoading ? 'Loading...' : successRate > 0 ? 'Based on completed projects' : 'No data yet'}
            </p>
          </div>
          <div className="p-3 rounded bg-blue-100 text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

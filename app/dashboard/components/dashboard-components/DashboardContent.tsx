'use client'

import { AuditProject } from '@/types/audit'
import DashboardOverview from '../tabs/DashboardOverview'
import ProjectsTab from '../tabs/ProjectsTab'
import ProfileTab from '../tabs/ProfileTab'
import AdminTab from '../tabs/AdminTab'

interface DashboardContentProps {
  activeTab: string
  userProfile: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: 'user' | 'admin' | 'moderator';
    email_confirmed: boolean;
    created_at: string;
    updated_at?: string;
  } | null
  projects: AuditProject[]
  projectsLoading: boolean
  projectsError: string | null
  refreshProjects: () => Promise<void>
  onProjectSelect?: (projectId: string) => void
}

export default function DashboardContent({ 
  activeTab, 
  userProfile, 
  projects, 
  projectsLoading, 
  projectsError, 
  refreshProjects,
  onProjectSelect
}: DashboardContentProps) {
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview 
            userProfile={userProfile} 
            projects={projects}
            projectsLoading={projectsLoading}
            projectsError={projectsError}
            refreshProjects={refreshProjects}
            onProjectSelect={onProjectSelect}
          />
        )
      case 'projects':
        return (
          <ProjectsTab
            projects={projects}
            projectsLoading={projectsLoading}
            projectsError={projectsError}
            refreshProjects={refreshProjects}
            onProjectSelect={onProjectSelect}
          />
        )
      case 'profile':
        return userProfile ? <ProfileTab userProfile={userProfile} /> : null
      case 'admin':
        return userProfile ? <AdminTab userProfile={userProfile} /> : null
      default:
        return (
          <DashboardOverview 
            userProfile={userProfile} 
            projects={projects}
            projectsLoading={projectsLoading}
            projectsError={projectsError}
            refreshProjects={refreshProjects}
          />
        )
    }
  }

  return (
    <main className="p-6">
      {renderContent()}
    </main>
  )
}

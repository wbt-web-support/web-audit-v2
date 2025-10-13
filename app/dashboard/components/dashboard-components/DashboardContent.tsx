'use client'

import { motion } from 'framer-motion'
import { AuditProject } from '@/types/audit'
import DashboardOverview from '../tabs/DashboardOverview'
import ProjectsTab from '../tabs/ProjectsTab'
import ProfileTab from '../tabs/ProfileTab'
import AdminTab from '../tabs/AdminTab'
import UserAlerts from '../UserAlerts'

interface DashboardContentProps {
  activeTab: string
  userProfile: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: 'user' | 'admin';
    email_confirmed: boolean;
    created_at: string;
    updated_at?: string;
  } | null
  projects: AuditProject[]
  projectsLoading: boolean
  projectsError: string | null
  refreshProjects: () => Promise<void>
  onProjectSelect?: (projectId: string) => void
  onUpdateProject?: (projectId: string, data: {
    siteUrl: string;
    pageType: 'single' | 'multiple';
    brandConsistency: boolean;
    hiddenUrls: boolean;
    keysCheck: boolean;
    brandData: {
      companyName: string;
      phoneNumber: string;
      emailAddress: string;
      address: string;
      additionalInformation: string;
    };
    hiddenUrlsList: {
      id: string;
      url: string;
    }[];
  }) => Promise<void>
  onDeleteProject?: (projectId: string) => Promise<void>
  onRecrawlProject?: (projectId: string) => Promise<void>
}

export default function DashboardContent({ 
  activeTab, 
  userProfile, 
  projects, 
  projectsLoading, 
  projectsError, 
  refreshProjects,
  onProjectSelect,
  onUpdateProject,
  onDeleteProject,
  onRecrawlProject
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
            onUpdateProject={onUpdateProject}
            onDeleteProject={onDeleteProject}
            onRecrawlProject={onRecrawlProject}
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
    <motion.main 
      className="p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* User Alerts - Show on all tabs except admin */}
      {activeTab !== 'admin' && userProfile && (
        <UserAlerts userPlan={userProfile.role === 'admin' ? 'enterprise' : 'free'} />
      )}
      
      {renderContent()}
    </motion.main>
  )
}

'use client'

import { motion } from 'framer-motion'
import { AuditProject } from '@/types/audit'
import DashboardOverview from './tabs/DashboardOverview'
import ProjectsTab from './tabs/ProjectsTab'
import ProfileTab from './tabs/ProfileTab'
import AdminTab from './tabs/AdminTab'

interface DashboardContentProps {
  activeTab: string
  userProfile: any
  projects: AuditProject[]
  projectsLoading: boolean
  projectsError: string | null
  refreshProjects: () => Promise<void>
}

export default function DashboardContent({ 
  activeTab, 
  userProfile, 
  projects, 
  projectsLoading, 
  projectsError, 
  refreshProjects 
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
          />
        )
      case 'projects':
        return (
          <ProjectsTab 
            userProfile={userProfile} 
            projects={projects}
            projectsLoading={projectsLoading}
            projectsError={projectsError}
            refreshProjects={refreshProjects}
          />
        )
      case 'profile':
        return <ProfileTab userProfile={userProfile} />
      case 'admin':
        return <AdminTab userProfile={userProfile} />
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
      key={activeTab}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 lg:p-6"
    >
      {renderContent()}
    </motion.main>
  )
}

'use client'

import { motion } from 'framer-motion'
import DashboardOverview from './tabs/DashboardOverview'
import ProjectsTab from './tabs/ProjectsTab'
import ProfileTab from './tabs/ProfileTab'
import AdminTab from './tabs/AdminTab'

interface DashboardContentProps {
  activeTab: string
  userProfile: any
}

export default function DashboardContent({ activeTab, userProfile }: DashboardContentProps) {
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview userProfile={userProfile} />
      case 'projects':
        return <ProjectsTab userProfile={userProfile} />
      case 'profile':
        return <ProfileTab userProfile={userProfile} />
      case 'admin':
        return <AdminTab userProfile={userProfile} />
      default:
        return <DashboardOverview userProfile={userProfile} />
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

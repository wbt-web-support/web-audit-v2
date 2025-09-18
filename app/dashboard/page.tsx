'use client'

import { useState } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { AuditProjectsProvider } from '@/contexts/AuditProjectsContext'
import DashboardSidebar from './components/DashboardSidebar'
import DashboardHeader from './components/DashboardHeader'
import DashboardContent from './components/DashboardContent'

export default function DashboardPage() {
  const { user, userProfile, loading } = useSupabase()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to access the dashboard.</p>
          <a 
            href="/login" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <AuditProjectsProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <DashboardSidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userProfile={userProfile}
        />

        {/* Main Content */}
        <div className="lg:pl-64">
          {/* Header */}
          <DashboardHeader 
            onMenuClick={() => setSidebarOpen(true)}
            userProfile={userProfile}
          />

          {/* Content */}
          <DashboardContent 
            activeTab={activeTab}
            userProfile={userProfile}
          />
        </div>
      </div>
    </AuditProjectsProvider>
  )
}

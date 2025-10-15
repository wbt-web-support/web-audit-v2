'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import { roleVerifier, roleTester, RoleVerificationResult } from '@/lib/role-utils'
import AdminOverview from './admin-subtabs/AdminOverview'
import AdminUsers from './admin-subtabs/AdminUsers'
import AdminPlans from './admin-subtabs/AdminPlans'
import AdminFeatureManagement from './admin-subtabs/AdminFeatureManagement'
import AdminSubscription from './admin-subtabs/AdminSubscription'
import AdminAlerts from './admin-subtabs/AdminAlerts'
import AdminSupport from './admin-subtabs/AdminSupport'
import AdminEmailManagement from './admin-subtabs/AdminEmailManagement'

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: 'user' | 'admin'
  email_confirmed: boolean
  created_at: string
}

interface AdminTabProps {
  userProfile: UserProfile
}

type AdminTabType = 'overview' | 'users' | 'plans' | 'features' | 'subscription' | 'revenue' | 'alerts' | 'support' | 'email'

export default function AdminTab({ userProfile }: AdminTabProps) {
  const [isAdminVerified, setIsAdminVerified] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [roleVerificationResult, setRoleVerificationResult] = useState<RoleVerificationResult | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<AdminTabType>('overview')

  // Enhanced admin role verification
  useEffect(() => {
    const verifyAdminRole = async () => {
      try {
        setIsLoading(true)
        setVerificationError(null)

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          console.error('Auth user error:', userError)
          setVerificationError('Authentication failed')
          setIsAdminVerified(false)
          return
        }

        // Use the enhanced role verification system
        const result = await roleVerifier.verifyUserRole(user.id, true)
        setRoleVerificationResult(result)
        if (!result.verified) {
          console.error('Role verification failed:', result.error)
          setVerificationError(result.error || 'Role verification failed')
          setIsAdminVerified(false)
          return
        }

        // Test admin access specifically
        const adminTest = await roleTester.testAdminAccess(user.id)
        setIsAdminVerified(adminTest.hasAccess)
        if (!adminTest.hasAccess) {
          setVerificationError(`Access denied. User role: ${result.role}`)
        }
      } catch (error) {
        console.error('Error verifying admin role:', error)
        setVerificationError(`Unexpected error: ${error}`)
        setIsAdminVerified(false)
      } finally {
        setIsLoading(false)
      }
    }
    verifyAdminRole()
  }, [])

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'plans', label: 'Plans & Usage' },
    { id: 'features', label: 'Feature Management' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'support', label: 'Support' },
    { id: 'email', label: 'Email Management' }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview userProfile={userProfile} />
      case 'users':
        return <AdminUsers userProfile={userProfile} />
      case 'plans':
        return <AdminPlans userProfile={userProfile} />
      case 'features':
        return <AdminFeatureManagement userProfile={userProfile} />
      case 'subscription':
        return <AdminSubscription userProfile={userProfile} />
     
      case 'alerts':
        return <AdminAlerts userProfile={userProfile} />
      case 'support':
        return <AdminSupport userProfile={userProfile} />
      case 'email':
        return <AdminEmailManagement userProfile={userProfile} />
      default:
        return <AdminOverview userProfile={userProfile} />
    }
    }

  // Show loading state while verifying admin role
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-black mb-2">Verifying Access</h2>
        <p className="text-gray-600">Checking your admin permissions...</p>
      </div>
    )
  }

  // Check if user is admin (database verified)
  if (!isAdminVerified) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-black mb-2">Access Denied</h2>
        <p className="text-gray-600">You don&apos;t have admin permissions to access this panel.</p>
        <p className="text-sm text-gray-500 mt-2">Database verification failed.</p>
        {verificationError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">Error: {verificationError}</p>
      </div>
        )}
            </div>
    )
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
    

      {/* Tab Navigation */}
      <motion.div
        className=" "
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
         {/* Welcome Section */}
      <motion.div
        className="pb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h1 className="text-2xl font-bold text-black mb-2">
          Welcome back, {userProfile?.first_name || 'Admin'}!
        </h1>
        <p className="text-gray-600">
          Here&apos;s an overview of your system performance and recent activity.
        </p>
      </motion.div>
        <div className="overflow-x-auto ">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTabType)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {tab.label}
              </motion.button>
            ))}
          </nav>
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderTabContent()}
      </motion.div>
    </motion.div>
  )
}
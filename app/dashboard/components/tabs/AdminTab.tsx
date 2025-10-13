'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { roleVerifier, roleTester, RoleVerificationResult } from '@/lib/role-utils'
import AdminOverview from './admin-subtabs/AdminOverview'
import AdminUsers from './admin-subtabs/AdminUsers'
import AdminPlans from './admin-subtabs/AdminPlans'
import AdminFeatureManagement from './admin-subtabs/AdminFeatureManagement'
import AdminSubscription from './admin-subtabs/AdminSubscription'
import AdminRevenue from './admin-subtabs/AdminRevenue'
import AdminAlerts from './admin-subtabs/AdminAlerts'
import AdminSupport from './admin-subtabs/AdminSupport'

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

type AdminTabType = 'overview' | 'users' | 'plans' | 'features' | 'subscription' | 'revenue' | 'alerts' | 'support'

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
    { id: 'revenue', label: 'Revenue' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'support', label: 'Support' }
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
      case 'revenue':
        return <AdminRevenue userProfile={userProfile} />
      case 'alerts':
        return <AdminAlerts userProfile={userProfile} />
      case 'support':
        return <AdminSupport userProfile={userProfile} />
      default:
        return <AdminOverview userProfile={userProfile} />
    }
    }

  // Show loading state while verifying admin role
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600"></i>
        </div>
        <h2 className="text-2xl font-semibold text-blue-900 mb-2">Verifying Access</h2>
        <p className="text-blue-600">Checking your admin permissions...</p>
      </div>
    )
  }

  // Check if user is admin (database verified)
  if (!isAdminVerified) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <i className="fas fa-ban text-4xl text-red-600"></i>
        </div>
        <h2 className="text-2xl font-semibold text-red-900 mb-2">Access Denied</h2>
        <p className="text-red-600">You don&apos;t have admin permissions to access this panel.</p>
        <p className="text-sm text-red-500 mt-2">Database verification failed.</p>
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
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTabType)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-blue-500 hover:text-blue-700 hover:border-blue-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <i className={`fas ${
                tab.id === 'overview' ? 'fa-chart-pie' :
                tab.id === 'users' ? 'fa-users' :
                tab.id === 'plans' ? 'fa-credit-card' :
                tab.id === 'features' ? 'fa-cogs' :
                tab.id === 'subscription' ? 'fa-sync' :
                tab.id === 'revenue' ? 'fa-dollar-sign' :
                tab.id === 'alerts' ? 'fa-bell' :
                tab.id === 'support' ? 'fa-life-ring' : 'fa-circle'
              } mr-2`}></i>
              {tab.label}
            </motion.button>
          ))}
        </nav>
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
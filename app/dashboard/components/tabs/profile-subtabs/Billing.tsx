'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import PricingSection from '@/app/home-page-components/PricingSection'
import { useUserPlan } from '@/hooks/useUserPlan'

interface BillingProps {
  userProfile: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    full_name?: string
    avatar_url?: string
    role: 'user' | 'admin'
    email_confirmed: boolean
    created_at: string
    updated_at?: string
  }
}

export default function Billing({ userProfile }: BillingProps) {
  const { planInfo, loading: planLoading } = useUserPlan()
  const [isUpgrading, setIsUpgrading] = useState(false)

  // Mock subscription data for usage display
  const subscription = {
    plan: planInfo?.plan_name || 'Free',
    status: 'active',
    nextBilling: null,
    usage: {
      projects: planInfo?.current_projects || 0,
      maxProjects: planInfo?.max_projects || 1,
      audits: 8,
      maxAudits: 100
    }
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Current Plan Usage */}
      <motion.div 
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-black">Current Plan</h2>
          <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
            {subscription.status}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-2xl font-bold text-black">{subscription.plan}</h3>
            <p className="text-gray-600">
              {planInfo?.plan_type === 'Starter' ? 'Free' : 'Paid Plan'}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h4 className="font-medium text-black mb-2">Usage</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Projects: {subscription.usage.projects}/{subscription.usage.maxProjects === -1 ? '∞' : subscription.usage.maxProjects}</span>
                <div className="w-20 bg-gray-200 rounded h-2">
                  <motion.div 
                    className="bg-blue-600 h-2 rounded" 
                    initial={{ width: 0 }}
                    animate={{ width: subscription.usage.maxProjects === -1 ? '100%' : `${Math.min((subscription.usage.projects / subscription.usage.maxProjects) * 100, 100)}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  ></motion.div>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span>Audits: {subscription.usage.audits}/{subscription.usage.maxAudits}</span>
                <div className="w-20 bg-gray-200 rounded h-2">
                  <motion.div 
                    className="bg-blue-600 h-2 rounded" 
                    initial={{ width: 0 }}
                    animate={{ width: `${(subscription.usage.audits / subscription.usage.maxAudits) * 100}%` }}
                    transition={{ duration: 1, delay: 0.7 }}
                  ></motion.div>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h4 className="font-medium text-black mb-2">Next Billing</h4>
            <p className="text-gray-600">
              {subscription.nextBilling || 'No billing date (Free plan)'}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Pricing Plans */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <PricingSection 
          currentPlanType={planInfo?.plan_type}
          showBillingToggle={true}
          showCurrentPlanHighlight={true}
          className="py-8"
        />
      </motion.div>

      {/* Billing History */}
      <motion.div 
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-black mb-4">Billing History</h2>
        <motion.div 
          className="text-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <motion.svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </motion.svg>
          <h3 className="mt-2 text-sm font-medium text-black">No billing history</h3>
          <p className="mt-1 text-sm text-gray-500">You&apos;re currently on the free plan.</p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

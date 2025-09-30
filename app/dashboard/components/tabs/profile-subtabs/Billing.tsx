'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

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
  const [isUpgrading, setIsUpgrading] = useState(false)

  // Mock subscription data
  const subscription = {
    plan: 'Free',
    status: 'active',
    nextBilling: null,
    usage: {
      projects: 12,
      maxProjects: 50,
      audits: 8,
      maxAudits: 100
    }
  }

  const plans = [
    {
      name: 'Free',
      price: 0,
      features: ['Up to 5 projects', 'Basic audits', 'Email support'],
      current: true
    },
    {
      name: 'Pro',
      price: 29,
      features: ['Unlimited projects', 'Advanced audits', 'Priority support', 'API access'],
      current: false
    },
    {
      name: 'Enterprise',
      price: 99,
      features: ['Everything in Pro', 'Custom integrations', 'Dedicated support', 'SLA guarantee'],
      current: false
    }
  ]

  const handleUpgrade = (planName: string) => {
    setIsUpgrading(true)
    // Simulate upgrade process
    setTimeout(() => {
      setIsUpgrading(false)
      alert(`Upgrading to ${planName} plan...`)
    }, 1000)
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Current Plan */}
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
            <h3 className="text-2xl font-bold text-black">{subscription.plan} Plan</h3>
            <p className="text-gray-600">${subscription.plan === 'Free' ? '0' : '29'}/month</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h4 className="font-medium text-black mb-2">Usage</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Projects: {subscription.usage.projects}/{subscription.usage.maxProjects}</span>
                <div className="w-20 bg-gray-200 rounded h-2">
                  <motion.div 
                    className="bg-blue-600 h-2 rounded" 
                    initial={{ width: 0 }}
                    animate={{ width: `${(subscription.usage.projects / subscription.usage.maxProjects) * 100}%` }}
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

      {/* Available Plans */}
      <motion.div 
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-black mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative rounded border-2 p-6 ${
                plan.current
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
              {plan.current && (
                <motion.div 
                  className="absolute -top-3 left-6"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium">
                    Current Plan
                  </span>
                </motion.div>
              )}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-black">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-black">${plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <motion.li 
                    key={featureIndex} 
                    className="flex items-center"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + featureIndex * 0.1 }}
                  >
                    <svg className="w-5 h-5 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-6">
                {plan.current ? (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.name)}
                    disabled={isUpgrading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpgrading ? 'Processing...' : 'Upgrade'}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
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
          <p className="mt-1 text-sm text-gray-500">You're currently on the free plan.</p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

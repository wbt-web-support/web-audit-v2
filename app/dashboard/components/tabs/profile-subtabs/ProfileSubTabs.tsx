'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Profile from './Profile'
import Billing from './Billing'
import Security from './Security'
import Support from './Support'

interface ProfileSubTabsProps {
  userProfile: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    full_name?: string
    avatar_url?: string
    role: 'user' | 'admin' | 'moderator'
    email_confirmed: boolean
    created_at: string
    updated_at?: string
  }
}

type TabType = 'profile' | 'billing' | 'security' | 'support'

const tabs = [
  { id: 'profile' as TabType, name: 'Profile', icon: '👤' },
  { id: 'billing' as TabType, name: 'Billing', icon: '💳' },
  { id: 'security' as TabType, name: 'Security', icon: '🔒' },
  { id: 'support' as TabType, name: 'Support', icon: '🎫' }
]

export default function ProfileSubTabs({ userProfile }: ProfileSubTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('profile')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <Profile userProfile={userProfile} />
      case 'billing':
        return <Billing userProfile={userProfile} />
      case 'security':
        return <Security userProfile={userProfile} />
      case 'support':
        return <Support userProfile={userProfile} />
      default:
        return <Profile userProfile={userProfile} />
    }
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <h1 className="text-2xl font-bold text-black">Account Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div 
        className="border-b border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <nav className="-mb-px flex space-x-6">
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-1.5 px-2 border-b-2 font-medium text-sm transition-all duration-300 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="mr-1.5 text-sm">{tab.icon}</span>
              {tab.name}
            </motion.button>
          ))}
        </nav>
      </motion.div>

      {/* Tab Content */}
      <motion.div 
        className="mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

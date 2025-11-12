'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Profile from './Profile'
import Billing from './Billing'
import Security from './Security'
import Support from './Support'

interface ProfileSubTabsProps {
  userProfile: any
}

type TabType = 'profile' | 'billing' | 'security' | 'support'

const tabs = [
  { id: 'profile' as TabType, name: 'Profile' },
  { id: 'billing' as TabType, name: 'Billing' },
  { id: 'security' as TabType, name: 'Security' },
  { id: 'support' as TabType, name: 'Support' }
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
      className="space-y-6 px-6" 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        className=" p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h1 className="text-2xl font-bold text-black mb-2">
          Account Settings
        </h1>
        <p className="text-gray-600">
          Manage your account information and preferences
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div 
        className="border-b border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <nav className="-mb-px flex space-x-6">
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-1.5 px-2 border-b-2 font-medium text-sm transition-colors duration-300 ${
                activeTab === tab.id
                  ? 'border-[#ff4b01] text-[#ff4b01] bg-[#ff4b01]/10'
                  : 'border-transparent text-gray-500 hover:text-[#ff4b01] hover:border-[#ff4b01]/30'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
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
        {renderTabContent()}
      </motion.div>
    </motion.div>
  )
}

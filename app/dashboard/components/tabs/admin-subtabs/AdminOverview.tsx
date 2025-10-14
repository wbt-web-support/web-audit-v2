'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { OverviewStats, RecentActivity } from '@/types/audit'

interface AdminOverviewProps {
  userProfile: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    role: 'user' | 'admin'
    email_confirmed: boolean
    created_at: string
  }
}

export default function AdminOverview({ userProfile }: AdminOverviewProps) {
  const [systemStats, setSystemStats] = useState<OverviewStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 0,
    totalAudits: 0,
    criticalIssues: 0,
    resolvedIssues: 0,
    totalScrapedPages: 0,
    pagesWithSocialMeta: 0,
    pagesWithCMS: 0,
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    highPriorityTickets: 0,
    systemUptime: '99.9%',
    responseTime: '120ms'
  })

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch overview statistics
        const statsResponse = await fetch('/api/admin/overview-stats')
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch overview statistics')
        }
        const statsData = await statsResponse.json()
        setSystemStats(statsData)

        // Fetch recent activity
        const activityResponse = await fetch('/api/admin/recent-activity?limit=10')
        if (!activityResponse.ok) {
          throw new Error('Failed to fetch recent activity')
        }
        const activityData = await activityResponse.json()
        setRecentActivity(activityData)
        
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Data</div>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Welcome Section */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-6"
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

      {/* System Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: systemStats.totalUsers, color: 'blue' },
          { label: 'Active Users', value: systemStats.activeUsers, color: 'green' },
          { label: 'Total Projects', value: systemStats.totalProjects, color: 'purple' },
          { label: 'Total Audits', value: systemStats.totalAudits, color: 'orange' },
          { label: 'Scraped Pages', value: systemStats.totalScrapedPages, color: 'indigo' },
          { label: 'Total Tickets', value: systemStats.totalTickets, color: 'red' },
          { label: 'Open Tickets', value: systemStats.openTickets, color: 'yellow' },
          { label: 'Resolved Tickets', value: systemStats.resolvedTickets, color: 'emerald' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            className="bg-white rounded-lg border border-gray-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-black mt-1">{stat.value}</p>
              </div>
              <div className={`w-3 h-3 rounded-full bg-${stat.color}-500`}></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity and Latest Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-black mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  className="flex items-start space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'success' ? 'bg-green-500' : 
                    activity.status === 'warning' ? 'bg-yellow-500' : 
                    activity.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-black">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
            </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent activity found
            </div>
            )}
          </div>
        </motion.div>

        {/* Latest Tickets */}
        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-black mb-4">Latest Tickets</h3>
          <div className="space-y-3">
            {systemStats.totalTickets > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-black">Open Tickets</p>
                      <p className="text-xs text-gray-500">{systemStats.openTickets} tickets</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-red-600">{systemStats.openTickets}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-black">In Progress</p>
                      <p className="text-xs text-gray-500">{systemStats.inProgressTickets} tickets</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">{systemStats.inProgressTickets}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-black">Resolved</p>
                      <p className="text-xs text-gray-500">{systemStats.resolvedTickets} tickets</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-green-600">{systemStats.resolvedTickets}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-black">High Priority</p>
                      <p className="text-xs text-gray-500">{systemStats.highPriorityTickets} urgent tickets</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-orange-600">{systemStats.highPriorityTickets}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No tickets found
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <h3 className="text-lg font-semibold text-black mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
            <h4 className="font-medium text-black mb-1">Export Data</h4>
            <p className="text-sm text-gray-600">Download system reports</p>
          </button>
          <button className="p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
            <h4 className="font-medium text-black mb-1">Clear Cache</h4>
            <p className="text-sm text-gray-600">Optimize system performance</p>
          </button>
          <button className="p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
            <h4 className="font-medium text-black mb-1">System Logs</h4>
            <p className="text-sm text-gray-600">View detailed logs</p>
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

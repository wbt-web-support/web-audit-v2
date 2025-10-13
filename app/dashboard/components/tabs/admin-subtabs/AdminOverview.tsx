'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

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
  const [systemStats] = useState({
    totalUsers: 156,
    activeUsers: 142,
    totalProjects: 324,
    totalAudits: 1247,
    criticalIssues: 23,
    resolvedIssues: 1204,
    systemUptime: '99.9%',
    responseTime: '120ms'
  })

  const [recentActivity] = useState([
    {
      id: 1,
      type: 'user_registration',
      message: 'New user registered: john.doe@example.com',
      timestamp: '2 minutes ago',
      status: 'success'
    },
    {
      id: 2,
      type: 'audit_completed',
      message: 'Audit completed for example.com',
      timestamp: '5 minutes ago',
      status: 'success'
    },
    {
      id: 3,
      type: 'system_alert',
      message: 'High CPU usage detected',
      timestamp: '10 minutes ago',
      status: 'warning'
    },
    {
      id: 4,
      type: 'user_login',
      message: 'Admin user logged in',
      timestamp: '15 minutes ago',
      status: 'info'
    }
  ])

 

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: systemStats.totalUsers, color: 'blue' },
          { label: 'Active Users', value: systemStats.activeUsers, color: 'green' },
          { label: 'Total Projects', value: systemStats.totalProjects, color: 'purple' },
          { label: 'Total Audits', value: systemStats.totalAudits, color: 'orange' }
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

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-black mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">System Uptime</span>
              <span className="font-semibold text-black">{systemStats.systemUptime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Response Time</span>
              <span className="font-semibold text-black">{systemStats.responseTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Critical Issues</span>
              <span className="font-semibold text-red-600">{systemStats.criticalIssues}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Resolved Issues</span>
              <span className="font-semibold text-green-600">{systemStats.resolvedIssues}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-black mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                className="flex items-start space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              >
                <div className={`w-2 h-2 rounded-full mt-2 bg-${activity.status === 'success' ? 'green' : activity.status === 'warning' ? 'yellow' : 'blue'}-500`}></div>
                <div className="flex-1">
                  <p className="text-sm text-black">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
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

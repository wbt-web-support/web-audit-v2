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
        <h1 className="text-2xl font-semibold text-blue-900 mb-2">
          <i className="fas fa-tachometer-alt mr-2"></i>Welcome back, {userProfile?.first_name || 'Admin'}!
        </h1>
        <p className="text-blue-600">
          Here&apos;s an overview of your system performance and recent activity.
        </p>
      </motion.div>

      {/* System Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: systemStats.totalUsers, color: 'blue', icon: 'fa-users' },
          { label: 'Active Users', value: systemStats.activeUsers, color: 'blue', icon: 'fa-user-check' },
          { label: 'Total Projects', value: systemStats.totalProjects, color: 'blue', icon: 'fa-folder' },
          { label: 'Total Audits', value: systemStats.totalAudits, color: 'blue', icon: 'fa-search' }
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
                <p className="text-sm font-medium text-blue-600">{stat.label}</p>
                <p className="text-2xl font-semibold text-blue-900 mt-1">{stat.value}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <i className={`fas ${stat.icon} text-blue-600 text-lg`}></i>
              </div>
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
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            <i className="fas fa-heartbeat mr-2"></i>System Health
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-700 flex items-center">
                <i className="fas fa-clock mr-2"></i>System Uptime
              </span>
              <span className="font-semibold text-blue-900">{systemStats.systemUptime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-700 flex items-center">
                <i className="fas fa-tachometer-alt mr-2"></i>Response Time
              </span>
              <span className="font-semibold text-blue-900">{systemStats.responseTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-700 flex items-center">
                <i className="fas fa-exclamation-triangle mr-2"></i>Critical Issues
              </span>
              <span className="font-semibold text-red-600">{systemStats.criticalIssues}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-700 flex items-center">
                <i className="fas fa-check-circle mr-2"></i>Resolved Issues
              </span>
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
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            <i className="fas fa-history mr-2"></i>Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                className="flex items-start space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              >
                <div className={`w-8 h-8 rounded-full mt-1 flex items-center justify-center ${
                  activity.status === 'success' ? 'bg-green-100' : 
                  activity.status === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                }`}>
                  <i className={`fas ${
                    activity.type === 'user_registration' ? 'fa-user-plus' :
                    activity.type === 'audit_completed' ? 'fa-check-circle' :
                    activity.type === 'system_alert' ? 'fa-exclamation-triangle' :
                    activity.type === 'user_login' ? 'fa-sign-in-alt' : 'fa-circle'
                  } text-xs ${
                    activity.status === 'success' ? 'text-green-600' : 
                    activity.status === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                  }`}></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-blue-900">{activity.message}</p>
                  <p className="text-xs text-blue-500">{activity.timestamp}</p>
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
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          <i className="fas fa-bolt mr-2"></i>Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
            <div className="flex items-center mb-2">
              <i className="fas fa-download text-blue-600 mr-2"></i>
              <h4 className="font-medium text-blue-900">Export Data</h4>
            </div>
            <p className="text-sm text-blue-600">Download system reports</p>
          </button>
          <button className="p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
            <div className="flex items-center mb-2">
              <i className="fas fa-broom text-blue-600 mr-2"></i>
              <h4 className="font-medium text-blue-900">Clear Cache</h4>
            </div>
            <p className="text-sm text-blue-600">Optimize system performance</p>
          </button>
          <button className="p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
            <div className="flex items-center mb-2">
              <i className="fas fa-file-alt text-blue-600 mr-2"></i>
              <h4 className="font-medium text-blue-900">System Logs</h4>
            </div>
            <p className="text-sm text-blue-600">View detailed logs</p>
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

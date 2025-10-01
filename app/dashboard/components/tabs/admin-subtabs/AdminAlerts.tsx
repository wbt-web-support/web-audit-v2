'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface AdminAlertsProps {
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

export default function AdminAlerts({ }: AdminAlertsProps) {
  const [alerts] = useState([
    {
      id: 1,
      type: 'system',
      severity: 'high',
      title: 'High CPU Usage Detected',
      message: 'Server CPU usage has exceeded 90% for the past 15 minutes',
      timestamp: '2 minutes ago',
      status: 'active',
      resolved: false
    },
    {
      id: 2,
      type: 'security',
      severity: 'medium',
      title: 'Multiple Failed Login Attempts',
      message: 'User admin@example.com has 5 failed login attempts in the last hour',
      timestamp: '15 minutes ago',
      status: 'active',
      resolved: false
    },
    {
      id: 3,
      type: 'performance',
      severity: 'low',
      title: 'Database Query Slow',
      message: 'Query execution time exceeded 5 seconds for user reports',
      timestamp: '1 hour ago',
      status: 'acknowledged',
      resolved: false
    },
    {
      id: 4,
      type: 'billing',
      severity: 'medium',
      title: 'Payment Processing Error',
      message: 'Failed to process payment for subscription ID 12345',
      timestamp: '2 hours ago',
      status: 'resolved',
      resolved: true
    },
    {
      id: 5,
      type: 'system',
      severity: 'high',
      title: 'Memory Usage Critical',
      message: 'Available memory has dropped below 10%',
      timestamp: '3 hours ago',
      status: 'resolved',
      resolved: true
    }
  ])

  const [alertStats] = useState({
    totalAlerts: 156,
    activeAlerts: 23,
    resolvedAlerts: 133,
    criticalAlerts: 5,
    averageResolutionTime: '2.5 hours',
    systemUptime: '99.9%'
  })

  const [alertTypes] = useState([
    { type: 'system', count: 45, color: 'red' },
    { type: 'security', count: 23, color: 'orange' },
    { type: 'performance', count: 34, color: 'yellow' },
    { type: 'billing', count: 12, color: 'blue' },
    { type: 'user', count: 42, color: 'green' }
  ])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800'
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'system': return 'bg-red-500'
      case 'security': return 'bg-orange-500'
      case 'performance': return 'bg-yellow-500'
      case 'billing': return 'bg-blue-500'
      case 'user': return 'bg-green-500'
      default: return 'bg-gray-500'
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
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">System Alerts</h1>
            <p className="text-gray-600">Monitor system health and security alerts</p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Acknowledge All
            </button>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
              Clear Resolved
            </button>
          </div>
        </div>
      </motion.div>

      {/* Alert Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Alerts', value: alertStats.totalAlerts, color: 'blue' },
          { label: 'Active Alerts', value: alertStats.activeAlerts, color: 'red' },
          { label: 'Resolved Alerts', value: alertStats.resolvedAlerts, color: 'green' },
          { label: 'Critical Alerts', value: alertStats.criticalAlerts, color: 'orange' }
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

      {/* Active Alerts */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3 className="text-lg font-semibold text-black mb-4">Active Alerts</h3>
        <div className="space-y-4">
          {alerts.filter(alert => !alert.resolved).map((alert, index) => (
            <motion.div
              key={alert.id}
              className="p-4 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`w-3 h-3 rounded-full mt-2 ${getTypeColor(alert.type)}`}></div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-black">{alert.title}</h4>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(alert.status)}`}>
                        {alert.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{alert.message}</p>
                    <p className="text-xs text-gray-500">{alert.timestamp}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-900 text-sm">Acknowledge</button>
                  <button className="text-green-600 hover:text-green-900 text-sm">Resolve</button>
                  <button className="text-gray-600 hover:text-gray-900 text-sm">View</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Alert Types */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h3 className="text-lg font-semibold text-black mb-4">Alert Types Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {alertTypes.map((type, index) => (
            <motion.div
              key={type.type}
              className="p-4 rounded-lg border border-gray-200 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
            >
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${getTypeColor(type.type)}`}></div>
              <h4 className="font-semibold text-black capitalize">{type.type}</h4>
              <p className="text-2xl font-bold text-black mt-1">{type.count}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-black mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-700">System Uptime</span>
              <span className="font-semibold text-green-600">{alertStats.systemUptime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Average Resolution Time</span>
              <span className="font-semibold text-black">{alertStats.averageResolutionTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Active Alerts</span>
              <span className="font-semibold text-red-600">{alertStats.activeAlerts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Resolved Today</span>
              <span className="font-semibold text-green-600">12</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <h3 className="text-lg font-semibold text-black mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="font-medium text-black">Configure Alert Rules</span>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="font-medium text-black">Export Alert Logs</span>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="font-medium text-black">Set Up Notifications</span>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="font-medium text-black">View System Logs</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Resolved Alerts */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <h3 className="text-lg font-semibold text-black mb-4">Recently Resolved</h3>
        <div className="space-y-3">
          {alerts.filter(alert => alert.resolved).slice(0, 3).map((alert, index) => (
            <motion.div
              key={alert.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${getTypeColor(alert.type)}`}></div>
                <div>
                  <p className="font-medium text-black">{alert.title}</p>
                  <p className="text-xs text-gray-500">{alert.timestamp}</p>
                </div>
              </div>
              <span className="text-green-600 text-sm font-medium">Resolved</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

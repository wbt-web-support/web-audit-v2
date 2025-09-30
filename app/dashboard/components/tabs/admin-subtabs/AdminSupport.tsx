'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface AdminSupportProps {
  userProfile: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    role: 'user' | 'admin' | 'moderator'
    email_confirmed: boolean
    created_at: string
  }
}

export default function AdminSupport({ userProfile }: AdminSupportProps) {
  const [supportStats] = useState({
    totalTickets: 1247,
    openTickets: 156,
    resolvedTickets: 1091,
    averageResolutionTime: '4.2 hours',
    customerSatisfaction: '4.8/5',
    responseTime: '12 minutes'
  })

  const [tickets] = useState([
    {
      id: 1,
      user: 'john.doe@example.com',
      subject: 'Unable to access dashboard',
      priority: 'high',
      status: 'open',
      assignedTo: 'Support Team',
      createdAt: '2024-01-15',
      lastActivity: '2 minutes ago'
    },
    {
      id: 2,
      user: 'jane.smith@example.com',
      subject: 'Billing question about subscription',
      priority: 'medium',
      status: 'in_progress',
      assignedTo: 'Billing Team',
      createdAt: '2024-01-15',
      lastActivity: '15 minutes ago'
    },
    {
      id: 3,
      user: 'bob.johnson@example.com',
      subject: 'Feature request for reports',
      priority: 'low',
      status: 'resolved',
      assignedTo: 'Product Team',
      createdAt: '2024-01-14',
      lastActivity: '1 hour ago'
    },
    {
      id: 4,
      user: 'alice.brown@example.com',
      subject: 'API integration help needed',
      priority: 'high',
      status: 'open',
      assignedTo: 'Technical Team',
      createdAt: '2024-01-14',
      lastActivity: '3 hours ago'
    }
  ])

  const [supportAgents] = useState([
    { name: 'Sarah Johnson', role: 'Senior Support', activeTickets: 12, status: 'online' },
    { name: 'Mike Chen', role: 'Technical Support', activeTickets: 8, status: 'online' },
    { name: 'Emily Davis', role: 'Billing Support', activeTickets: 5, status: 'away' },
    { name: 'Alex Rodriguez', role: 'Product Support', activeTickets: 15, status: 'online' }
  ])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800'
      case 'away': return 'bg-yellow-100 text-yellow-800'
      case 'offline': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
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
            <h1 className="text-2xl font-bold text-black mb-2">Support Management</h1>
            <p className="text-gray-600">Monitor support tickets and team performance</p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              New Ticket
            </button>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
              Export Data
            </button>
          </div>
        </div>
      </motion.div>

      {/* Support Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Tickets', value: supportStats.totalTickets, color: 'blue' },
          { label: 'Open Tickets', value: supportStats.openTickets, color: 'red' },
          { label: 'Resolved Tickets', value: supportStats.resolvedTickets, color: 'green' },
          { label: 'Avg Resolution Time', value: supportStats.averageResolutionTime, color: 'purple' }
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

      {/* Support Team */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3 className="text-lg font-semibold text-black mb-4">Support Team</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {supportAgents.map((agent, index) => (
            <motion.div
              key={agent.name}
              className="p-4 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-black">{agent.name}</h4>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getAgentStatusColor(agent.status)}`}>
                  {agent.status}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Role</span>
                  <span className="font-medium text-black">{agent.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Tickets</span>
                  <span className="font-semibold text-black">{agent.activeTickets}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Tickets */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h3 className="text-lg font-semibold text-black mb-4">Recent Tickets</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map((ticket, index) => (
                <motion.tr
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-black">#{ticket.id}</div>
                      <div className="text-sm text-gray-600">{ticket.subject}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {ticket.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ticket.assignedTo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ticket.lastActivity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">View</button>
                      <button className="text-yellow-600 hover:text-yellow-900">Assign</button>
                      <button className="text-green-600 hover:text-green-900">Resolve</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-black mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-700">Customer Satisfaction</span>
              <span className="font-semibold text-green-600">{supportStats.customerSatisfaction}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Average Response Time</span>
              <span className="font-semibold text-black">{supportStats.responseTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">First Contact Resolution</span>
              <span className="font-semibold text-blue-600">78%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Escalation Rate</span>
              <span className="font-semibold text-yellow-600">12%</span>
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
              <span className="font-medium text-black">View All Tickets</span>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="font-medium text-black">Generate Support Report</span>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="font-medium text-black">Manage Knowledge Base</span>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="font-medium text-black">Configure Auto-Responses</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Ticket Categories */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <h3 className="text-lg font-semibold text-black mb-4">Ticket Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { category: 'Technical Issues', count: 45, color: 'red' },
            { category: 'Billing Questions', count: 23, color: 'blue' },
            { category: 'Feature Requests', count: 34, color: 'green' },
            { category: 'Account Issues', count: 12, color: 'yellow' },
            { category: 'General Support', count: 42, color: 'purple' },
            { category: 'Bug Reports', count: 18, color: 'orange' }
          ].map((category, index) => (
            <motion.div
              key={category.category}
              className="p-4 rounded-lg border border-gray-200 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
            >
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 bg-${category.color}-500`}></div>
              <h4 className="font-semibold text-black">{category.category}</h4>
              <p className="text-2xl font-bold text-black mt-1">{category.count}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

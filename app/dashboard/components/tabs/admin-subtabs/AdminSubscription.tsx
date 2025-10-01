'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface AdminSubscriptionProps {
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

export default function AdminSubscription({ userProfile }: AdminSubscriptionProps) {
  const [subscriptionStats] = useState({
    totalSubscriptions: 1247,
    activeSubscriptions: 1156,
    cancelledSubscriptions: 91,
    monthlyRevenue: 45600,
    annualRevenue: 547200,
    averageRevenuePerUser: 39.5
  })

  const [subscriptionPlans] = useState([
    {
      id: 1,
      name: 'Basic Plan',
      price: 9.99,
      users: 456,
      revenue: 4554.44,
      status: 'active'
    },
    {
      id: 2,
      name: 'Pro Plan',
      price: 29.99,
      users: 234,
      revenue: 7017.66,
      status: 'active'
    },
    {
      id: 3,
      name: 'Enterprise Plan',
      price: 99.99,
      users: 89,
      revenue: 8900.11,
      status: 'active'
    },
    {
      id: 4,
      name: 'Starter Plan',
      price: 4.99,
      users: 377,
      revenue: 1881.23,
      status: 'active'
    }
  ])

  const [recentSubscriptions] = useState([
    {
      id: 1,
      user: 'john.doe@example.com',
      plan: 'Pro Plan',
      amount: 29.99,
      status: 'active',
      date: '2024-01-15'
    },
    {
      id: 2,
      user: 'jane.smith@example.com',
      plan: 'Enterprise Plan',
      amount: 99.99,
      status: 'active',
      date: '2024-01-14'
    },
    {
      id: 3,
      user: 'bob.johnson@example.com',
      plan: 'Basic Plan',
      amount: 9.99,
      status: 'cancelled',
      date: '2024-01-13'
    },
    {
      id: 4,
      user: 'alice.brown@example.com',
      plan: 'Starter Plan',
      amount: 4.99,
      status: 'active',
      date: '2024-01-12'
    }
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
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
        <h1 className="text-2xl font-bold text-black mb-2">Subscription Management</h1>
        <p className="text-gray-600">Monitor subscription plans, revenue, and user billing</p>
      </motion.div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Subscriptions', value: subscriptionStats.totalSubscriptions, color: 'blue' },
          { label: 'Active Subscriptions', value: subscriptionStats.activeSubscriptions, color: 'green' },
          { label: 'Monthly Revenue', value: `$${subscriptionStats.monthlyRevenue.toLocaleString()}`, color: 'purple' },
          { label: 'Avg Revenue/User', value: `$${subscriptionStats.averageRevenuePerUser}`, color: 'orange' }
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

      {/* Subscription Plans */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-black">Subscription Plans</h3>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Add Plan
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {subscriptionPlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-black">{plan.name}</h4>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(plan.status)}`}>
                  {plan.status}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price</span>
                  <span className="font-semibold text-black">${plan.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Users</span>
                  <span className="font-semibold text-black">{plan.users}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenue</span>
                  <span className="font-semibold text-green-600">${plan.revenue.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Subscriptions */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h3 className="text-lg font-semibold text-black mb-4">Recent Subscriptions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentSubscriptions.map((subscription, index) => (
                <motion.tr
                  key={subscription.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                    {subscription.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {subscription.plan}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-semibold">
                    ${subscription.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscription.status)}`}>
                      {subscription.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {subscription.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">View</button>
                      <button className="text-yellow-600 hover:text-yellow-900">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Cancel</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Revenue Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-black mb-4">Revenue Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-700">Monthly Revenue</span>
              <span className="font-semibold text-black">${subscriptionStats.monthlyRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Annual Revenue</span>
              <span className="font-semibold text-black">${subscriptionStats.annualRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Cancelled Subscriptions</span>
              <span className="font-semibold text-red-600">{subscriptionStats.cancelledSubscriptions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Conversion Rate</span>
              <span className="font-semibold text-green-600">92.7%</span>
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
              <span className="font-medium text-black">Generate Revenue Report</span>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="font-medium text-black">Export Subscription Data</span>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="font-medium text-black">Manage Billing Settings</span>
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface AdminRevenueProps {
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

export default function AdminRevenue({ }: AdminRevenueProps) {
  const [revenueStats] = useState({
    totalRevenue: 1247500,
    monthlyRevenue: 104500,
    dailyRevenue: 3483,
    growthRate: 12.5,
    averageOrderValue: 89.50,
    totalTransactions: 13944,
    refunds: 2340,
    netRevenue: 1224160
  })

  const [monthlyData] = useState([
    { month: 'Jan', revenue: 95000, growth: 8.2 },
    { month: 'Feb', revenue: 102000, growth: 7.4 },
    { month: 'Mar', revenue: 98000, growth: -3.9 },
    { month: 'Apr', revenue: 110000, growth: 12.2 },
    { month: 'May', revenue: 105000, growth: -4.5 },
    { month: 'Jun', revenue: 104500, growth: -0.5 }
  ])

  const [topRevenueSources] = useState([
    { source: 'Enterprise Plans', revenue: 456000, percentage: 36.6 },
    { source: 'Pro Plans', revenue: 234000, percentage: 18.8 },
    { source: 'Basic Plans', revenue: 189000, percentage: 15.2 },
    { source: 'Add-ons', revenue: 156000, percentage: 12.5 },
    { source: 'Consulting', revenue: 120000, percentage: 9.6 },
    { source: 'Other', revenue: 92500, percentage: 7.4 }
  ])

  const [recentTransactions] = useState([
    {
      id: 1,
      customer: 'Acme Corp',
      amount: 2999.00,
      type: 'Enterprise Plan',
      status: 'completed',
      date: '2024-01-15'
    },
    {
      id: 2,
      customer: 'TechStart Inc',
      amount: 299.99,
      type: 'Pro Plan',
      status: 'completed',
      date: '2024-01-15'
    },
    {
      id: 3,
      customer: 'SmallBiz LLC',
      amount: 99.99,
      type: 'Basic Plan',
      status: 'pending',
      date: '2024-01-14'
    },
    {
      id: 4,
      customer: 'Global Systems',
      amount: 4999.00,
      type: 'Enterprise Plan',
      status: 'completed',
      date: '2024-01-14'
    }
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
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
        <h1 className="text-2xl font-bold text-black mb-2">Revenue Analytics</h1>
        <p className="text-gray-600">Track revenue performance and financial metrics</p>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: `$${revenueStats.totalRevenue.toLocaleString()}`, color: 'blue' },
          { label: 'Monthly Revenue', value: `$${revenueStats.monthlyRevenue.toLocaleString()}`, color: 'green' },
          { label: 'Daily Revenue', value: `$${revenueStats.dailyRevenue.toLocaleString()}`, color: 'purple' },
          { label: 'Growth Rate', value: `+${revenueStats.growthRate}%`, color: 'orange' }
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            className="bg-white rounded-lg border border-gray-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                <p className="text-2xl font-bold text-black mt-1">{metric.value}</p>
              </div>
              <div className={`w-3 h-3 rounded-full bg-${metric.color}-500`}></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart Placeholder */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3 className="text-lg font-semibold text-black mb-4">Monthly Revenue Trend</h3>
        <div className="space-y-4">
          {monthlyData.map((data, index) => (
            <motion.div
              key={data.month}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
            >
              <div className="flex items-center space-x-4">
                <span className="font-medium text-black">{data.month}</span>
                <span className="text-gray-600">${data.revenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${data.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.growth > 0 ? '+' : ''}{data.growth}%
                </span>
                <div className="w-16 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-[#ff4b01] rounded-full" 
                    style={{ width: `${Math.min(Math.abs(data.growth) * 5, 100)}%` }}
                  ></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Revenue Sources */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h3 className="text-lg font-semibold text-black mb-4">Revenue Sources</h3>
        <div className="space-y-4">
          {topRevenueSources.map((source, index) => (
            <motion.div
              key={source.source}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-black">{source.source}</span>
                  <span className="text-sm text-gray-600">{source.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 bg-[#ff4b01] rounded-full" 
                    style={{ width: `${source.percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="ml-4">
                <span className="font-semibold text-black">${source.revenue.toLocaleString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h3 className="text-lg font-semibold text-black mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
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
              {recentTransactions.map((transaction, index) => (
                <motion.tr
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                    {transaction.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-semibold">
                    ${transaction.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-[#ff4b01] hover:text-[#e64401]">View</button>
                      <button className="text-yellow-600 hover:text-yellow-900">Refund</button>
                      <button className="text-gray-600 hover:text-gray-900">Export</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <h3 className="text-lg font-semibold text-black mb-4">Financial Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-700">Gross Revenue</span>
              <span className="font-semibold text-black">${revenueStats.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Refunds</span>
              <span className="font-semibold text-red-600">-${revenueStats.refunds.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-4">
              <span className="text-gray-700 font-medium">Net Revenue</span>
              <span className="font-bold text-black text-lg">${revenueStats.netRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Average Order Value</span>
              <span className="font-semibold text-black">${revenueStats.averageOrderValue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Total Transactions</span>
              <span className="font-semibold text-black">{revenueStats.totalTransactions.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <h3 className="text-lg font-semibold text-black mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-[#ff4b01] hover:bg-[#ff4b01]/10 transition-colors">
              <span className="font-medium text-black">Generate Revenue Report</span>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-[#ff4b01] hover:bg-[#ff4b01]/10 transition-colors">
              <span className="font-medium text-black">Export Financial Data</span>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-[#ff4b01] hover:bg-[#ff4b01]/10 transition-colors">
              <span className="font-medium text-black">View Tax Reports</span>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-[#ff4b01] hover:bg-[#ff4b01]/10 transition-colors">
              <span className="font-medium text-black">Process Refunds</span>
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

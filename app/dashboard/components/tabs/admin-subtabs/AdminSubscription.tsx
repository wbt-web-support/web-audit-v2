'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { PaymentStats, PaymentHistory, PlanStatistics } from '@/types/audit'
import { RevenueChart, UserGrowthChart, PlanDistributionChart } from './charts'
import FilterPanel from './FilterPanel'

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

interface ChartData {
  revenue: Array<{ month: string; revenue: number; users: number }>
  users: Array<{ month: string; newUsers: number; totalUsers: number }>
  plans: Array<{ name: string; value: number; color: string }>
}

export default function AdminSubscription({ userProfile: _userProfile }: AdminSubscriptionProps) {
  const [subscriptionStats, setSubscriptionStats] = useState<PaymentStats>({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    cancelledSubscriptions: 0,
    monthlyRevenue: 0,
    annualRevenue: 0,
    averageRevenuePerUser: 0
  })

  const [subscriptionPlans, setSubscriptionPlans] = useState<PlanStatistics[]>([])
  const [recentSubscriptions, setRecentSubscriptions] = useState<PaymentHistory[]>([])
  const [chartData, setChartData] = useState<ChartData>({
    revenue: [],
    users: [],
    plans: []
  })
  const [availablePlans, setAvailablePlans] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    planId: '',
    chartType: 'revenue'
  })

  const fetchData = async (currentFilters = filters) => {
    try {
      setLoading(true)
      
      // Build query parameters
      const queryParams = new URLSearchParams()
      if (currentFilters.startDate) queryParams.append('startDate', currentFilters.startDate)
      if (currentFilters.endDate) queryParams.append('endDate', currentFilters.endDate)
      if (currentFilters.planId) queryParams.append('planId', currentFilters.planId)

      // Fetch payment statistics
      const statsResponse = await fetch(`/api/admin/payment-stats?${queryParams.toString()}`)
      if (!statsResponse.ok) {
        const errorData = await statsResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch payment statistics (${statsResponse.status})`)
      }
      const statsData = await statsResponse.json()
      setSubscriptionStats(statsData)

      // Fetch payment history and plan statistics
      const historyResponse = await fetch(`/api/admin/payment-history?limit=10&${queryParams.toString()}`)
      if (!historyResponse.ok) {
        throw new Error('Failed to fetch payment history')
      }
      const historyData = await historyResponse.json()
      setRecentSubscriptions(historyData.payments)
      setSubscriptionPlans(historyData.planStatistics)

      // Fetch chart data
      const chartPromises = ['revenue', 'users', 'plans'].map(async (chartType) => {
        const response = await fetch(`/api/admin/chart-data?chartType=${chartType}&${queryParams.toString()}`)
        if (!response.ok) throw new Error(`Failed to fetch ${chartType} data`)
        return response.json()
      })

      const [revenueData, usersData, plansData] = await Promise.all(chartPromises)
      
      setChartData({
        revenue: revenueData,
        users: usersData,
        plans: plansData
      })

      // Extract available plans for filter
      const plans = historyData.planStatistics.map((plan: PlanStatistics, index: number) => ({
        id: `${plan.name}-${plan.type}`,
        name: `${plan.name} (${plan.type})`
      }))
      setAvailablePlans(plans)
      
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    fetchData(newFilters)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
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
      {/* Header */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h1 className="text-2xl font-bold text-black mb-2">Subscription Analytics</h1>
        <p className="text-gray-600">Monitor subscription plans, revenue growth, and user analytics with interactive charts</p>
      </motion.div>

      {/* Filter Panel */}
      {/* <FilterPanel 
        onFiltersChange={handleFiltersChange} 
        plans={availablePlans}
      /> */}

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Subscriptions', value: subscriptionStats.totalSubscriptions, color: 'blue' },
          { label: 'Active Subscriptions', value: subscriptionStats.activeSubscriptions, color: 'green' },
          { label: 'Monthly Revenue', value: `₹${subscriptionStats.monthlyRevenue.toLocaleString()}`, color: 'purple' },
          { label: 'Avg Revenue/User', value: `₹${subscriptionStats.averageRevenuePerUser}`, color: 'orange' }
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
          {subscriptionPlans.length > 0 ? (
            subscriptionPlans.map((plan, index) => (
              <motion.div
                key={`${plan.name}-${plan.type}`}
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
                    <span className="text-gray-600">Type</span>
                    <span className="font-semibold text-black capitalize">{plan.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Users</span>
                    <span className="font-semibold text-black">{plan.users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue</span>
                    <span className="font-semibold text-green-600">₹{plan.revenue.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              No subscription plans found
            </div>
          )}
        </div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-black mb-4">Revenue Growth</h3>
          {chartData.revenue.length > 0 ? (
            <RevenueChart data={chartData.revenue} type="area" />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No revenue data available
            </div>
          )}
        </motion.div>

        {/* User Growth Chart */}
        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-black mb-4">User Growth</h3>
          {chartData.users.length > 0 ? (
            <UserGrowthChart data={chartData.users} />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No user data available
            </div>
          )}
        </motion.div>
      </div>

      {/* Plan Distribution Chart */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <h3 className="text-lg font-semibold text-black mb-4">Plan Distribution</h3>
        {chartData.plans.length > 0 ? (
          <PlanDistributionChart data={chartData.plans} />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No plan data available
          </div>
        )}
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentSubscriptions.length > 0 ? (
                recentSubscriptions.map((subscription, index) => (
                  <motion.tr
                    key={subscription.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                      <div>
                        <div className="font-medium">{subscription.userName}</div>
                        <div className="text-gray-500 text-xs">{subscription.user}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {subscription.plan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-semibold">
                      ₹{subscription.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscription.status)}`}>
                        {subscription.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(subscription.date).toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No recent subscriptions found
                  </td>
                </tr>
              )}
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
              <span className="font-semibold text-black">₹{subscriptionStats.monthlyRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Annual Revenue</span>
              <span className="font-semibold text-black">₹{subscriptionStats.annualRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Cancelled Subscriptions</span>
              <span className="font-semibold text-red-600">{subscriptionStats.cancelledSubscriptions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Conversion Rate</span>
              <span className="font-semibold text-green-600">
                {subscriptionStats.totalSubscriptions > 0 
                  ? `${((subscriptionStats.activeSubscriptions / subscriptionStats.totalSubscriptions) * 100).toFixed(1)}%`
                  : '0%'
                }
              </span>
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

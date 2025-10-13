'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { supabase } from '@/lib/supabase'

interface AdminUsersProps {
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

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: 'user' | 'admin'
  email_confirmed: boolean
  created_at: string
  updated_at: string
  blocked?: boolean
  blocked_at?: string
  blocked_by?: string
  role_changed_at?: string
  role_changed_by?: string
  last_activity_at?: string
  login_count?: number
  notes?: string
  plan_type?: string
  auth_users?: {
    last_sign_in_at: string
    email_confirmed_at: string
  }
  project_count?: number
  plan_limit?: number
  plan_name?: string
  subscription_status?: string
}

interface Plan {
  id: string
  name: string
  plan_type: string
  max_projects: number
  features: string[]
  price: number
  is_active: boolean
}

export default function AdminUsers({ userProfile: _userProfile }: AdminUsersProps) {
  const { 
    getUsers, 
    updateUser, 
    blockUser, 
    unblockUser, 
    changeUserRole, 
    getUserActivity,
    getUserProjects,
    getUserSubscription 
  } = useSupabase()
  
  const [users, setUsers] = useState<User[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userActivity, setUserActivity] = useState<Record<string, unknown> | null>(null)
  const [_userProjects, setUserProjects] = useState<Record<string, unknown>[]>([])
  const [_userSubscription, setUserSubscription] = useState<Record<string, unknown> | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPlan, setFilterPlan] = useState('all')
  const [filterProjectLimit, setFilterProjectLimit] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Removed unused loadPlans function

  const calculateUserProjectCounts = useCallback(async (usersData: User[], plansData: Plan[]) => {
    try {
      const usersWithCounts = await Promise.all(
        usersData.map(async (user) => {
           // Get project count from scraped_pages table
           console.log(`Counting projects for user ${user.email} (ID: ${user.id})`)
           
           const { count, error } = await supabase
             .from('scraped_pages')
             .select('*', { count: 'exact', head: true })
             .eq('user_id', user.id)
           
           console.log(`Project count query result for ${user.email}:`, { count, error })
           
           // Let's also check what's actually in the scraped_pages table for this user
           const { data: sampleData, error: sampleError } = await supabase
             .from('scraped_pages')
             .select('id, user_id, url')
             .eq('user_id', user.id)
             .limit(3)
           
           console.log(`Sample scraped_pages data for ${user.email}:`, { sampleData, sampleError })
           
           if (error) {
             console.error(`Error counting projects for user ${user.id}:`, error)
             return { ...user, project_count: 0 }
           }

           // Find the plan details by searching in plans table using plan_type field
           console.log(`Looking for plan_type: "${user.plan_type}" in plans:`, plansData.map(p => ({ name: p.name, plan_type: p.plan_type, max_projects: p.max_projects })))
           
           let userPlan = null
           
           if (user.plan_type) {
             // Match by plan_type field (not name field)
             userPlan = plansData.find(plan => plan.plan_type === user.plan_type)
             console.log(`Exact match for plan_type "${user.plan_type}":`, userPlan)
             
             // If no exact match, try case-insensitive match
             if (!userPlan) {
               userPlan = plansData.find(plan => 
                 plan.plan_type.toLowerCase() === user.plan_type?.toLowerCase()
               )
               console.log(`Case-insensitive match for plan_type "${user.plan_type}":`, userPlan)
             }
           }
           
           const planLimit = userPlan?.max_projects || 0
           const planName = userPlan?.name || (user.plan_type || 'No Plan')
           
           console.log(`Final result for user ${user.email}: plan="${planName}", limit=${planLimit}`)

          return {
            ...user,
            project_count: count || 0,
            plan_limit: planLimit,
            plan_name: planName
          }
        })
      )
      return usersWithCounts
    } catch (error) {
      console.error('Error calculating project counts:', error)
      return usersData
    }
  }, [])

  const loadUsers = useCallback(async (plansData: Plan[]) => {
    setUsersLoading(true)
    setUsersError(null)
    try {
      console.log('Loading users...')
      const { data, error } = await getUsers()
      
      if (error) {
        console.error('Error loading users:', error)
        setUsersError(error.message || 'Failed to load users')
      } else {
        console.log('Successfully loaded users:', data?.length || 0, 'users')
        // Calculate project counts for each user
        const usersWithCounts = await calculateUserProjectCounts(data || [], plansData)
        setUsers(usersWithCounts)
      }
    } catch (error) {
      console.error('Unexpected error loading users:', error)
      setUsersError('Failed to load users')
    } finally {
      setUsersLoading(false)
    }
  }, [getUsers, calculateUserProjectCounts])

  // Load plans and users on component mount
  useEffect(() => {
    const loadData = async () => {
      // First load plans
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })
      
       if (plansError) {
         console.error('Error loading plans:', plansError)
       } else {
         console.log('Loaded plans from database:', plansData)
         setPlans(plansData || [])
         
         // Let's also check the scraped_pages table structure
         const { data: tableInfo, error: tableError } = await supabase
           .from('scraped_pages')
           .select('*')
           .limit(1)
         
         console.log('Sample scraped_pages table structure:', { tableInfo, tableError })
        
        // Then load users with plans data
        setUsersLoading(true)
        setUsersError(null)
        try {
          console.log('Loading users...')
          const { data, error } = await getUsers()
          
           if (error) {
             console.error('Error loading users:', error)
             setUsersError(error.message || 'Failed to load users')
           } else {
             console.log('Successfully loaded users:', data?.length || 0, 'users')
             console.log('Sample user data:', data?.slice(0, 3).map(u => ({ 
               email: u.email, 
               plan_type: u.plan_type 
             })))
             // Calculate project counts for each user
             const usersWithCounts = await calculateUserProjectCounts(data || [], plansData || [])
             setUsers(usersWithCounts)
           }
        } catch (error) {
          console.error('Unexpected error loading users:', error)
          setUsersError('Failed to load users')
        } finally {
          setUsersLoading(false)
        }
      }
    }
    loadData()
  }, [getUsers, calculateUserProjectCounts]) // Include dependencies but they won't change

  const handleUserAction = async (userId: string, action: string, value?: unknown) => {
    setActionLoading(action)
    try {
      let result
      switch (action) {
        case 'block':
          result = await blockUser(userId)
          break
        case 'unblock':
          result = await unblockUser(userId)
          break
        case 'changeRole':
          result = await changeUserRole(userId, value as 'user' | 'admin')
          break
        case 'updateNotes':
          result = await updateUser(userId, { notes: value })
          break
        default:
          throw new Error('Unknown action')
      }

      if (result.error) {
        console.error(`Error ${action}:`, result.error)
        alert(`Failed to ${action}. Please try again.`)
      } else {
        console.log(`Successfully ${action}ed user`)
        // Reload users to show updated data
        await loadUsers(plans)
        alert(`User ${action}ed successfully!`)
      }
    } catch (error) {
      console.error(`Unexpected error ${action}ing user:`, error)
      alert(`Failed to ${action} user. Please try again.`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewUserDetails = async (user: User) => {
    setSelectedUser(user)
    setShowUserDetails(true)
    
    try {
      // Load user activity, projects, and subscription
      const [activityResult, projectsResult, subscriptionResult] = await Promise.all([
        getUserActivity(user.id),
        getUserProjects(user.id),
        getUserSubscription(user.id)
      ])

      if (activityResult.data) setUserActivity(activityResult.data)
      if (projectsResult.data) setUserProjects(projectsResult.data)
      if (subscriptionResult.data) setUserSubscription(subscriptionResult.data)
    } catch (error) {
      console.error('Error loading user details:', error)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'user': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderDateField = (value: unknown, label: string) => {
    if (value && typeof value === 'string') {
      return (
        <div className="bg-gray-50 rounded p-4">
          <div>
            <span className="text-gray-600 text-sm">{label}</span>
            <p className="text-black font-medium mt-1">{formatDate(value)}</p>
          </div>
        </div>
      );
    }
    return null;
  }

  const getUserDisplayName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    if (user.first_name) {
      return user.first_name
    }
    return user.email.split('@')[0]
  }

  const filteredUsers = users.filter(user => {
    const displayName = getUserDisplayName(user)
    const matchesSearch = displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'verified' && !user.blocked && user.email_confirmed) ||
                         (filterStatus === 'blocked' && user.blocked) ||
                         (filterStatus === 'not-verified' && !user.email_confirmed)
    const matchesPlan = filterPlan === 'all' || 
                       (user.plan_type === filterPlan) ||
                       (filterPlan === 'no-plan' && !user.plan_type)
    const matchesProjectLimit = filterProjectLimit === 'all' ||
                               (filterProjectLimit === 'unlimited' && user.plan_limit === -1) ||
                               (filterProjectLimit === 'limited' && user.plan_limit && user.plan_limit > 0) ||
                               (filterProjectLimit === 'exceeded' && user.plan_limit && user.project_count && user.project_count > user.plan_limit)
    
    return matchesSearch && matchesRole && matchesStatus && matchesPlan && matchesProjectLimit
  }).sort((a, b) => {
    let aValue: string | number, bValue: string | number
    
    switch (sortBy) {
      case 'name':
        aValue = getUserDisplayName(a).toLowerCase()
        bValue = getUserDisplayName(b).toLowerCase()
        break
      case 'email':
        aValue = a.email.toLowerCase()
        bValue = b.email.toLowerCase()
        break
      case 'role':
        aValue = a.role
        bValue = b.role
        break
      case 'plan':
        aValue = a.plan_name || 'No Plan'
        bValue = b.plan_name || 'No Plan'
        break
      case 'projects':
        aValue = a.project_count || 0
        bValue = b.project_count || 0
        break
      case 'created_at':
      default:
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
        break
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">User Management</h1>
            <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Add User
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search users..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="blocked">Blocked</option>
              <option value="not-verified">Not Verified</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Plans</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.plan_type}>
                  {plan.name} ({plan.plan_type})
                </option>
              ))}
              <option value="no-plan">No Plan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Limit</label>
            <select
              value={filterProjectLimit}
              onChange={(e) => setFilterProjectLimit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Limits</option>
              <option value="unlimited">Unlimited</option>
              <option value="limited">Limited</option>
              <option value="exceeded">Exceeded</option>
            </select>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="created_at">Created Date</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="role">Role</option>
              <option value="plan">Plan</option>
              <option value="projects">Project Count</option>
            </select>
          </div>
          <div className="min-w-32">
            <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterRole('all')
                setFilterStatus('all')
                setFilterPlan('all')
                setFilterProjectLimit('all')
                setSortBy('created_at')
                setSortOrder('desc')
              }}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {usersLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : usersError ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{usersError}</p>
            <button 
              onClick={() => loadUsers(plans)}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium text-sm">
                            {getUserDisplayName(user).split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-black">{getUserDisplayName(user)}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm">
                         <div className="font-medium text-black">
                           {user.plan_name || 'No Plan'}
                         </div>
                         <div className="text-gray-500 text-xs">
                           {user.plan_limit === -1 
                             ? 'Unlimited' 
                             : user.plan_limit !== undefined && user.plan_limit !== null
                               ? `${user.plan_limit} projects`
                               : user.plan_type 
                                 ? 'No limit set'
                                 : 'No plan assigned'
                           }
                         </div>
                       </div>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-black">
                          {user.project_count || 0}
                        </div>
                         <div className="text-gray-500 text-xs">
                           {user.plan_limit === -1
                             ? 'unlimited'
                             : user.plan_limit !== undefined && user.plan_limit !== null
                               ? `of ${user.plan_limit}`
                               : user.plan_type 
                                 ? 'no limit set'
                                 : 'no plan'
                           }
                         </div>
                        {user.plan_limit && user.project_count && user.project_count > user.plan_limit && (
                          <div className="text-red-500 text-xs font-medium">
                            Exceeded!
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewUserDetails(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {user.blocked ? (
                          <button 
                            onClick={() => handleUserAction(user.id, 'unblock')}
                            disabled={actionLoading === 'unblock'}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {actionLoading === 'unblock' ? 'Unblocking...' : 'Unblock'}
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleUserAction(user.id, 'block')}
                            disabled={actionLoading === 'block'}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {actionLoading === 'block' ? 'Blocking...' : 'Block'}
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-black mb-4">User Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-700">Total Users</span>
              <span className="font-semibold text-black">{users.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Verified Users</span>
              <span className="font-semibold text-green-600">{users.filter(u => !u.blocked && u.email_confirmed).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Blocked Users</span>
              <span className="font-semibold text-red-600">{users.filter(u => u.blocked).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Not Verified</span>
              <span className="font-semibold text-yellow-600">{users.filter(u => !u.email_confirmed).length}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-black mb-4">Plan Distribution</h3>
          <div className="space-y-3">
            {plans.map(plan => (
              <div key={plan.id} className="flex justify-between">
                <span className="text-gray-700">{plan.name} ({plan.plan_type})</span>
                <span className="font-semibold text-blue-600">{users.filter(u => u.plan_type === plan.plan_type).length}</span>
              </div>
            ))}
            <div className="flex justify-between">
              <span className="text-gray-700">No Plan</span>
              <span className="font-semibold text-red-600">{users.filter(u => !u.plan_type).length}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-black mb-4">Project Usage</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-700">Total Projects</span>
              <span className="font-semibold text-black">{users.reduce((sum, u) => sum + (u.project_count || 0), 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Users at Limit</span>
              <span className="font-semibold text-orange-600">
                {users.filter(u => u.plan_limit && u.project_count && u.project_count >= u.plan_limit).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Exceeded Limit</span>
              <span className="font-semibold text-red-600">
                {users.filter(u => u.plan_limit && u.project_count && u.project_count > u.plan_limit).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Unlimited Users</span>
              <span className="font-semibold text-green-600">{users.filter(u => u.plan_limit === -1).length}</span>
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
          <div className="space-y-2">
            <button 
              onClick={() => loadUsers(plans)}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <span className="font-medium text-black">Refresh Users</span>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="font-medium text-black">Export User Data</span>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="font-medium text-black">Bulk Actions</span>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="font-medium text-black">View Exceeded Limits</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowUserDetails(false)}
        >
          <motion.div
            className="bg-white rounded-lg  max-w-4xl w-full max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-black">{getUserDisplayName(selectedUser)}</h2>
                  <p className="text-gray-600 mt-1">{selectedUser.email}</p>
                </div>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-black mb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Name</label>
                      <p className="text-black font-medium">{getUserDisplayName(selectedUser)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Email</label>
                      <p className="text-black font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Email Status</label>
                      <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                        selectedUser.email_confirmed 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedUser.email_confirmed ? 'Verified' : 'Not Verified'}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Role</label>
                      <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                        selectedUser.role === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Status</label>
                      <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                        selectedUser.blocked 
                          ? 'bg-red-100 text-red-800' 
                          : selectedUser.email_confirmed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedUser.blocked ? 'Blocked' : selectedUser.email_confirmed ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Created</label>
                      <p className="text-black font-medium">{formatDate(selectedUser.created_at)}</p>
                    </div>
                    {selectedUser.last_activity_at && (
                      <div>
                        <label className="text-sm text-gray-600 block mb-1">Last Activity</label>
                        <p className="text-black font-medium">{formatDate(selectedUser.last_activity_at)}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Current Plan</label>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                          selectedUser.plan_name === 'pro' 
                            ? 'bg-purple-100 text-purple-800' 
                            : selectedUser.plan_name === 'basic'
                              ? 'bg-blue-100 text-blue-800'
                              : selectedUser.plan_name === 'free'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedUser.plan_name || 'No Plan'}
                        </span>
                        {selectedUser.plan_type && (
                          <span className="text-xs text-gray-500">
                            ({selectedUser.plan_type})
                          </span>
                        )}
                      </div>
                    </div>
                     <div>
                       <label className="text-sm text-gray-600 block mb-1">Project Limit</label>
                       <p className="text-black font-medium">
                         {selectedUser.plan_limit === -1 
                           ? 'Unlimited' 
                           : selectedUser.plan_limit !== undefined && selectedUser.plan_limit !== null
                             ? `${selectedUser.plan_limit} projects`
                             : selectedUser.plan_type 
                               ? 'No limit set'
                               : 'No plan assigned'
                         }
                       </p>
                     </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Current Projects</label>
                       <div className="flex items-center gap-2">
                         <p className="text-black font-medium">{selectedUser.project_count || 0}</p>
                         {selectedUser.plan_limit === -1 ? (
                           <span className="text-sm text-gray-500">unlimited</span>
                         ) : selectedUser.plan_limit !== undefined && selectedUser.plan_limit !== null ? (
                           <span className="text-sm text-gray-500">
                             of {selectedUser.plan_limit}
                           </span>
                         ) : selectedUser.plan_type ? (
                           <span className="text-sm text-gray-500">no limit set</span>
                         ) : (
                           <span className="text-sm text-gray-500">no plan</span>
                         )}
                         {selectedUser.plan_limit && selectedUser.plan_limit > 0 && selectedUser.project_count && selectedUser.project_count > selectedUser.plan_limit && (
                           <span className="text-xs text-red-500 font-medium">
                             (Exceeded!)
                           </span>
                         )}
                       </div>
                    </div>
                  </div>
                </div>

                {/* Activity Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-black mb-4">Activity Summary</h3>
                  {userActivity ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Projects</span>
                          <span className="text-xl font-semibold text-black">{typeof userActivity.totalProjects === 'number' ? userActivity.totalProjects : 0}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Tickets</span>
                          <span className="text-xl font-semibold text-black">{typeof userActivity.totalTickets === 'number' ? userActivity.totalTickets : 0}</span>
                        </div>
                      </div>
                      {renderDateField(userActivity.lastProject, 'Last Project')}
                      {renderDateField(userActivity.lastTicket, 'Last Ticket')}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-500">Loading activity...</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const newRole = selectedUser.role === 'admin' ? 'user' : 'admin'
                    handleUserAction(selectedUser.id, 'changeRole', newRole)
                  }}
                  disabled={actionLoading === 'changeRole'}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading === 'changeRole' ? 'Changing...' : `Change to ${selectedUser.role === 'admin' ? 'User' : 'Admin'}`}
                </button>
                {selectedUser.blocked ? (
                  <button
                    onClick={() => handleUserAction(selectedUser.id, 'unblock')}
                    disabled={actionLoading === 'unblock'}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading === 'unblock' ? 'Unblocking...' : 'Unblock User'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUserAction(selectedUser.id, 'block')}
                    disabled={actionLoading === 'block'}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading === 'block' ? 'Blocking...' : 'Block User'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}

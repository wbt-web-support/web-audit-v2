'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'

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
  auth_users?: {
    last_sign_in_at: string
    email_confirmed_at: string
  }
}

export default function AdminUsers({ userProfile: _ }: AdminUsersProps) {
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
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userActivity, setUserActivity] = useState<Record<string, unknown> | null>(null)
  const [userProjects, setUserProjects] = useState<Record<string, unknown>[]>([])
  const [userSubscription, setUserSubscription] = useState<Record<string, unknown> | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const loadUsers = useCallback(async () => {
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
        setUsers(data || [])
      }
    } catch (error) {
      console.error('Unexpected error loading users:', error)
      setUsersError('Failed to load users')
    } finally {
      setUsersLoading(false)
    }
  }, [getUsers])

  // Load users on component mount
  useEffect(() => {
    loadUsers()
  }, [])

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
        await loadUsers()
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
    
    return matchesSearch && matchesRole && matchesStatus
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              onClick={loadUsers}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <h3 className="text-lg font-semibold text-black mb-4">Role Distribution</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-700">Admins</span>
              <span className="font-semibold text-red-600">{users.filter(u => u.role === 'admin').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Users</span>
              <span className="font-semibold text-blue-600">{users.filter(u => u.role === 'user').length}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-black mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button 
              onClick={loadUsers}
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
            className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
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

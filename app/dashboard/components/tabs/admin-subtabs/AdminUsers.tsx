'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface AdminUsersProps {
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

export default function AdminUsers({ userProfile }: AdminUsersProps) {
  const [users] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      status: 'active',
      lastLogin: '2024-01-15',
      projects: 5,
      createdAt: '2023-12-01'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'moderator',
      status: 'active',
      lastLogin: '2024-01-14',
      projects: 8,
      createdAt: '2023-11-15'
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'user',
      status: 'inactive',
      lastLogin: '2024-01-10',
      projects: 2,
      createdAt: '2023-10-20'
    },
    {
      id: 4,
      name: 'Alice Brown',
      email: 'alice@example.com',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-01-15',
      projects: 12,
      createdAt: '2023-09-10'
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'moderator': return 'bg-yellow-100 text-yellow-800'
      case 'user': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    
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
              <option value="moderator">Moderator</option>
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
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
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-black">{user.name}</div>
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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {user.projects}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">Edit</button>
                      <button className="text-yellow-600 hover:text-yellow-900">Suspend</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
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
              <span className="text-gray-700">Active Users</span>
              <span className="font-semibold text-green-600">{users.filter(u => u.status === 'active').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Inactive Users</span>
              <span className="font-semibold text-gray-600">{users.filter(u => u.status === 'inactive').length}</span>
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
              <span className="text-gray-700">Moderators</span>
              <span className="font-semibold text-yellow-600">{users.filter(u => u.role === 'moderator').length}</span>
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
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="font-medium text-black">Bulk User Actions</span>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="font-medium text-black">Export User Data</span>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="font-medium text-black">User Permissions</span>
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

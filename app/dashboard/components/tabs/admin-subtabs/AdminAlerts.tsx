'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { AdminAlert, AdminAlertStats, CreateAdminAlertRequest } from '@/types/audit'
// Removed direct supabaseAdmin import for security

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
  const [alerts, setAlerts] = useState<AdminAlert[]>([])
  const [alertStats, setAlertStats] = useState<AdminAlertStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAlert, setEditingAlert] = useState<AdminAlert | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')

  // Form state for creating/editing alerts
  const [formData, setFormData] = useState<CreateAdminAlertRequest & { status: string }>({
    title: '',
    message: '',
    alert_type: 'info',
    severity: 'low',
    status: 'active',
    is_global: true,
    target_audience: 'all',
    priority: 1,
    dismissible: true,
    auto_expire: false
  })

  // Fetch alerts and stats
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterType !== 'all') params.append('type', filterType)
      if (filterSeverity !== 'all') params.append('severity', filterSeverity)
      const response = await fetch(`/api/admin/alerts?${params.toString()}`)
      const data = await response.json()
      if (!response.ok) {
        console.error('Error fetching alerts:', data.error)
        setAlerts([])
      } else {
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterType, filterSeverity])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/alerts/stats')
      const data = await response.json()
      if (!response.ok) {
        console.error('Error fetching stats:', data.error)
      } else {
        setAlertStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
    fetchStats()
  }, [fetchAlerts, fetchStats])

  const handleCreateAlert = async () => {
    try {
      const response = await fetch('/api/admin/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error creating alert:', data.error)
        alert(`Error creating alert: ${data.error}`)
      } else {
        setShowCreateModal(false)
        resetForm()
        fetchAlerts()
        fetchStats()
      }
    } catch (error) {
      console.error('Error creating alert:', error)
      alert('Error creating alert')
    }
  }

  const handleUpdateAlert = async () => {
    if (!editingAlert) return

    try {
      const response = await fetch('/api/admin/alerts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingAlert.id,
          ...formData
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error updating alert:', data.error)
        alert(`Error updating alert: ${data.error}`)
      } else {
        setEditingAlert(null)
        resetForm()
        fetchAlerts()
        fetchStats()
      }
    } catch (error) {
      console.error('Error updating alert:', error)
      alert('Error updating alert')
    }
  }

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return

    try {
      const response = await fetch(`/api/admin/alerts?id=${alertId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error deleting alert:', data.error)
        alert(`Error deleting alert: ${data.error}`)
      } else {
        fetchAlerts()
        fetchStats()
      }
    } catch (error) {
      console.error('Error deleting alert:', error)
      alert('Error deleting alert')
    }
  }

  const handleToggleStatus = async (alert: AdminAlert) => {
    const newStatus = alert.status === 'active' ? 'inactive' : 'active'
    
    try {
      const response = await fetch('/api/admin/alerts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: alert.id,
          status: newStatus
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error updating alert status:', data.error)
      } else {
        fetchAlerts()
        fetchStats()
      }
    } catch (error) {
      console.error('Error updating alert status:', error)
    }
  }

  const handleEditAlert = (alert: AdminAlert) => {
    setEditingAlert(alert)
    setFormData({
      title: alert.title,
      message: alert.message,
      alert_type: alert.alert_type,
      severity: alert.severity,
      status: alert.status,
      is_global: alert.is_global,
      target_audience: alert.target_audience,
      priority: alert.priority,
      action_url: alert.action_url || '',
      action_text: alert.action_text || '',
      dismissible: alert.dismissible,
      auto_expire: alert.auto_expire
    })
  }

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      alert_type: 'info',
      severity: 'low',
      status: 'active',
      is_global: true,
      target_audience: 'all',
      priority: 1,
      dismissible: true,
      auto_expire: false
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-[#ff4b01]/20 text-[#ff4b01]'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-[#ff4b01]'
      case 'warning': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      case 'success': return 'bg-green-500'
      case 'maintenance': return 'bg-orange-500'
      case 'announcement': return 'bg-purple-500'
      case 'offer': return 'bg-pink-500'
      default: return 'bg-gray-500'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff4b01]"></div>
      </div>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">Admin Alerts</h1>
            <p className="text-gray-600">Create and manage alerts for all users</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-[#ff4b01] text-white px-4 py-2 rounded-lg hover:bg-[#e64401] transition-colors"
            >
              Create Alert
            </button>
            <button 
              onClick={fetchAlerts}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex flex-wrap gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
          >
            <option value="all">All Types</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="success">Success</option>
            <option value="maintenance">Maintenance</option>
            <option value="announcement">Announcement</option>
            <option value="offer">Offer</option>
          </select>
          
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
          >
            <option value="all">All Severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </motion.div>

      {/* Alert Stats */}
      {alertStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Alerts', value: alertStats.totalAlerts, color: 'blue' },
            { label: 'Active Alerts', value: alertStats.activeAlerts, color: 'green' },
            { label: 'Draft Alerts', value: alertStats.draftAlerts, color: 'yellow' },
            { label: 'Critical Alerts', value: alertStats.criticalAlerts, color: 'red' }
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
      )}

      {/* Alerts List */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3 className="text-lg font-semibold text-black mb-4">Alerts ({alerts.length})</h3>
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No alerts found. Create your first alert to get started.
            </div>
          ) : (
            alerts.map((alertItem, index) => (
            <motion.div
              key={alertItem.id}
              className="p-4 rounded-lg border border-gray-200 hover:border-[#ff4b01] transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                    <div className={`w-3 h-3 rounded-full mt-2 ${getTypeColor(alertItem.alert_type)}`}></div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-black">{alertItem.title}</h4>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alertItem.severity)}`}>
                        {alertItem.severity}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(alertItem.status)}`}>
                        {alertItem.status}
                      </span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {alertItem.alert_type}
                        </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{alertItem.message}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Created: {formatDate(alertItem.created_at)}</span>
                        <span>Priority: {alertItem.priority}</span>
                        <span>Views: {alertItem.view_count}</span>
                        <span>Clicks: {alertItem.click_count}</span>
                      </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                    <button 
                      onClick={() => handleToggleStatus(alertItem)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff4b01] focus:ring-offset-2 ${
                        alertItem.status === 'active' 
                          ? 'bg-green-600' 
                          : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          alertItem.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <button 
                      onClick={() => handleEditAlert(alertItem)}
                      className="text-[#ff4b01] hover:text-[#e64401] text-sm"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteAlert(alertItem.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Delete
                    </button>
                </div>
              </div>
            </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Alert Types Distribution */}
      {alertStats && alertStats.alertsByType.length > 0 && (
        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-black mb-4">Alert Types Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {alertStats.alertsByType.map((type, index) => (
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
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingAlert) && (
        <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-black">
                {editingAlert ? 'Edit Alert' : 'Create New Alert'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingAlert(null)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
                  placeholder="Enter alert title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
                  rows={3}
                  placeholder="Enter alert message"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.alert_type}
                    onChange={(e) => setFormData({ ...formData, alert_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="success">Success</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="announcement">Announcement</option>
                    <option value="offer">Offer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                  <select
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
                  >
                    <option value="all">All Users</option>
                    <option value="free">Free Users</option>
                    <option value="premium">Premium Users</option>
                    <option value="enterprise">Enterprise Users</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority || 1}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.action_url || ''}
                    onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action Text (Optional)</label>
                  <input
                    type="text"
                    value={formData.action_text || ''}
                    onChange={(e) => setFormData({ ...formData, action_text: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
                    placeholder="Learn More"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_global}
                    onChange={(e) => setFormData({ ...formData, is_global: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Global Alert</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.dismissible}
                    onChange={(e) => setFormData({ ...formData, dismissible: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Dismissible</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.auto_expire}
                    onChange={(e) => setFormData({ ...formData, auto_expire: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Auto Expire</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingAlert(null)
                  resetForm()
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={editingAlert ? handleUpdateAlert : handleCreateAlert}
                className="px-4 py-2 bg-[#ff4b01] text-white rounded-lg hover:bg-[#e64401]"
              >
                {editingAlert ? 'Update Alert' : 'Create Alert'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

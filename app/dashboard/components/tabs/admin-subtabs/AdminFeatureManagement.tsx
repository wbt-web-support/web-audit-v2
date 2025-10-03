'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { FEATURES, FEATURE_CATEGORIES, getFeaturesByCategory, getCoreFeatures } from '@/lib/features'

interface AdminFeatureManagementProps {
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

interface Plan {
  id: string
  name: string
  description: string
  plan_type: 'free' | 'pro' | 'enterprise'
  can_use_features: string[]
  max_projects: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AdminFeatureManagement({ userProfile: _ }: AdminFeatureManagementProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [plansError, setPlansError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  const loadPlans = useCallback(async () => {
    setPlansLoading(true)
    setPlansError(null)
    try {
      console.log('Loading plans for feature management...')
      
      const { data: directData, error: directError } = await supabase
        .from('plans')
        .select('id, name, description, plan_type, can_use_features, max_projects, is_active, created_at, updated_at')
        .order('sort_order', { ascending: true })
      
      if (directError) {
        console.log('Direct access failed, trying API route...')
        const response = await fetch('/api/plans')
        if (response.ok) {
          const apiData = await response.json()
          setPlans(apiData.plans || [])
        } else {
          throw new Error('Both direct and API access failed')
        }
      } else {
        setPlans(directData || [])
      }
    } catch (error) {
      console.error('Error loading plans:', error)
      setPlansError('Failed to load plans')
    } finally {
      setPlansLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan)
    setSelectedFeatures(plan.can_use_features || [])
  }

  const handleFeatureToggle = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    )
  }

  const handleSelectAllFeatures = () => {
    setSelectedFeatures(FEATURES.map(f => f.id))
  }

  const handleSelectCoreFeatures = () => {
    setSelectedFeatures(getCoreFeatures().map(f => f.id))
  }

  const handleClearFeatures = () => {
    setSelectedFeatures([])
  }

  const handleSaveFeatures = async () => {
    if (!selectedPlan) return

    setActionLoading('save')
    try {
      const { data, error } = await supabase
        .from('plans')
        .update({ 
          can_use_features: selectedFeatures,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPlan.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating features:', error)
        alert('Failed to update features: ' + error.message)
      } else {
        console.log('Features updated successfully')
        await loadPlans()
        alert('Features updated successfully!')
        setSelectedPlan(data)
      }
    } catch (error) {
      console.error('Unexpected error updating features:', error)
      alert('Failed to update features. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const getPlanTypeColor = (type: string) => {
    switch (type) {
      case 'free': return 'bg-green-100 text-green-800'
      case 'pro': return 'bg-blue-100 text-blue-800'
      case 'enterprise': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || plan.plan_type === filterType
    
    return matchesSearch && matchesType
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
            <h1 className="text-2xl font-bold text-black">Feature Management</h1>
            <p className="text-gray-600 mt-1">Manage which features each plan can access</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Plans</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search plans..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plan Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plans List */}
        <motion.div
          className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-black">Select Plan to Manage</h3>
          </div>
          
          {plansLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : plansError ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium">{plansError}</p>
              <button 
                onClick={loadPlans}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {filteredPlans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedPlan?.id === plan.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => handlePlanSelect(plan)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-black">{plan.name}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanTypeColor(plan.plan_type)}`}>
                          {plan.plan_type}
                        </span>
                        {!plan.is_active && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                      <div className="text-sm text-gray-500 mt-2">
                        {plan.can_use_features?.length || 0} features enabled
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {plan.max_projects === -1 ? 'Unlimited projects' : `${plan.max_projects} project${plan.max_projects !== 1 ? 's' : ''}`}
                      </div>
                    </div>
                    {selectedPlan?.id === plan.id && (
                      <div className="text-blue-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Feature Management */}
        <motion.div
          className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-black">
              {selectedPlan ? `Manage Features for ${selectedPlan.name}` : 'Select a Plan First'}
            </h3>
          </div>

          {selectedPlan ? (
            <div className="p-6 max-h-96 overflow-y-auto">
              {/* Quick Actions */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={handleSelectAllFeatures}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={handleSelectCoreFeatures}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors"
                >
                  Core Features Only
                </button>
                <button
                  onClick={handleClearFeatures}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
                >
                  Clear All
                </button>
              </div>

              {/* Features by Category */}
              {Object.entries(FEATURE_CATEGORIES).map(([categoryKey, categoryName]) => {
                const categoryFeatures = getFeaturesByCategory(categoryKey)
                return (
                  <div key={categoryKey} className="mb-6">
                    <h4 className="font-medium text-black mb-3">{categoryName}</h4>
                    <div className="space-y-2">
                      {categoryFeatures.map((feature) => (
                        <label
                          key={feature.id}
                          className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFeatures.includes(feature.id)}
                            onChange={() => handleFeatureToggle(feature.id)}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{feature.icon}</span>
                              <span className="font-medium text-black">{feature.name}</span>
                              {feature.isCore && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                                  Core
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Save Button */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSaveFeatures}
                  disabled={actionLoading === 'save'}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading === 'save' ? 'Saving...' : 'Save Features'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Select a plan from the list to manage its features</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Feature Summary */}
      {selectedPlan && (
        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-black mb-4">
            Selected Features Summary ({selectedFeatures.length})
          </h3>
          <div className="text-sm text-gray-600">
            {selectedFeatures.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedFeatures.map(featureId => {
                  const feature = FEATURES.find(f => f.id === featureId)
                  return feature ? (
                    <span key={featureId} className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      <span>{feature.icon}</span>
                      <span>{feature.name}</span>
                    </span>
                  ) : null
                })}
              </div>
            ) : (
              <span className="text-gray-500">No features selected</span>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface PlanLimits {
  max_pages?: number;
  max_audits_per_month?: number;
  max_team_members?: number;
  storage_gb?: number;
  api_calls_per_month?: number;
  [key: string]: number | string | boolean | undefined;
}

interface PlanFormData {
  name: string;
  description: string;
  plan_type: 'Starter' | 'Growth' | 'Scale';
  price: number;
  currency: string;
  billing_cycle: string;
  features: Array<{
    heading: string;
    tools: string[];
  }>;
  can_use_features: string[];
  max_projects: number;
  limits: PlanLimits;
  is_active: boolean;
  is_popular: boolean;
  color: string;
  sort_order: number;
  razorpay_plan_id: string;
  subscription_id: string;
  image_scan_credits: number;
}

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: PlanFormData;
  setFormData: React.Dispatch<React.SetStateAction<PlanFormData>>;
  isEditing: boolean;
  actionLoading: string | null;
}

export default function PlanFormModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  isEditing,
  actionLoading
}: PlanFormModalProps) {
  const [newHeading, setNewHeading] = useState('');
  const [newTool, setNewTool] = useState('');
  const [selectedHeadingIndex, setSelectedHeadingIndex] = useState<number | null>(null);

  const handleAddHeading = () => {
    if (newHeading.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, {
          heading: newHeading.trim(),
          tools: []
        }]
      }));
      setNewHeading('');
    }
  };

  const handleRemoveHeading = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
    if (selectedHeadingIndex === index) {
      setSelectedHeadingIndex(null);
      setNewTool('');
    }
  };

  const handleAddTool = () => {
    if (newTool.trim() && selectedHeadingIndex !== null) {
      setFormData(prev => ({
        ...prev,
        features: prev.features.map((feature, index) => 
          index === selectedHeadingIndex
            ? { ...feature, tools: [...feature.tools, newTool.trim()] }
            : feature
        )
      }));
      setNewTool('');
    }
  };

  const handleRemoveTool = (headingIndex: number, toolIndex: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, index) => 
        index === headingIndex
          ? { ...feature, tools: feature.tools.filter((_, i) => i !== toolIndex) }
          : feature
      )
    }));
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden" 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-black">
              {isEditing ? 'Edit Plan' : 'Add New Plan'}
            </h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      name: e.target.value
                    }))} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]" 
                    placeholder="Enter plan name" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea 
                    value={formData.description} 
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      description: e.target.value
                    }))} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]" 
                    rows={3} 
                    placeholder="Enter plan description" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Type</label>
                  <select 
                    value={formData.plan_type} 
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      plan_type: e.target.value as 'Starter' | 'Growth' | 'Scale'
                    }))} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Growth">Growth</option>
                    <option value="Scale">Scale</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={formData.price} 
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        price: parseFloat(e.target.value) || 0
                      }))} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]" 
                      placeholder="0" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select 
                      value={formData.currency} 
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        currency: e.target.value
                      }))} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
                    <select 
                      value={formData.billing_cycle} 
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        billing_cycle: e.target.value
                      }))} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Razorpay Plan ID <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={formData.razorpay_plan_id} 
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        razorpay_plan_id: e.target.value
                      }))} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]" 
                      placeholder="Required Razorpay plan ID" 
                      required 
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Required. Create this in your Razorpay dashboard first.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subscription ID <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={formData.subscription_id} 
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        subscription_id: e.target.value
                      }))} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]" 
                      placeholder="Required Razorpay subscription ID" 
                      required 
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Required for subscription payments. Create this in your Razorpay dashboard first.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Projects</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      value={formData.max_projects === -1 ? '' : formData.max_projects} 
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        max_projects: parseInt(e.target.value) || 1
                      }))} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]" 
                      min="1" 
                      placeholder="Number of projects"
                      disabled={formData.max_projects === -1}
                    />
                    <button 
                      type="button" 
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        max_projects: prev.max_projects === -1 ? 1 : -1
                      }))} 
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        formData.max_projects === -1 
                          ? 'bg-[#ff4b01]/20 text-[#ff4b01] border-[#ff4b01]/30' 
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      Unlimited
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.max_projects === -1 ? 'Unlimited projects' : `${formData.max_projects} project${formData.max_projects !== 1 ? 's' : ''} allowed`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Free Image Scan Credits <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    value={formData.image_scan_credits || 0} 
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      image_scan_credits: parseInt(e.target.value) || 0
                    }))} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]" 
                    min="0" 
                    placeholder="Number of free image scan credits"
                    required 
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Number of free image scan credits provided with this plan when user subscribes or updates their plan.
                  </p>
                </div>
              </div>
            </div>

            {/* Features Management */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">Custom Features</h3>
              <div className="space-y-4">
                {/* Add New Heading */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-black mb-3">Add Heading</h4>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newHeading} 
                      onChange={e => setNewHeading(e.target.value)} 
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]" 
                      placeholder="Enter heading name" 
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          handleAddHeading();
                        }
                      }}
                    />
                    <button 
                      onClick={handleAddHeading}
                      className="px-4 py-2 bg-[#ff4b01] text-white rounded-lg hover:bg-[#e64401] transition-colors"
                    >
                      Add Heading
                    </button>
                  </div>
                </div>

                {/* Add Tool to Selected Heading */}
                {formData.features.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-black mb-3">Add Tool</h4>
                    <div className="space-y-3">
                      <select 
                        value={selectedHeadingIndex ?? ''} 
                        onChange={e => setSelectedHeadingIndex(e.target.value ? parseInt(e.target.value) : null)} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
                      >
                        <option value="">Select a heading</option>
                        {formData.features.map((feature, index) => (
                          <option key={index} value={index}>
                            {feature.heading}
                          </option>
                        ))}
                      </select>
                      {selectedHeadingIndex !== null && (
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={newTool} 
                            onChange={e => setNewTool(e.target.value)} 
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]" 
                            placeholder="Enter tool name" 
                            onKeyPress={e => {
                              if (e.key === 'Enter') {
                                handleAddTool();
                              }
                            }}
                          />
                          <button 
                            onClick={handleAddTool}
                            className="px-4 py-2 bg-[#ff4b01] text-white rounded-lg hover:bg-[#e64401] transition-colors"
                          >
                            Add Tool
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Features List */}
                <div className="space-y-4">
                  {formData.features.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📋</div>
                      <p>No headings added yet</p>
                      <p className="text-sm">Add a heading using the form above</p>
                    </div>
                  ) : (
                    formData.features.map((feature, headingIndex) => (
                      <div key={headingIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-black text-lg">{feature.heading}</h5>
                          <button
                            onClick={() => handleRemoveHeading(headingIndex)}
                            className="text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50 transition-colors text-sm"
                          >
                            Remove Heading
                          </button>
                        </div>
                        <div className="space-y-2 ml-4">
                          {feature.tools.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No tools added yet</p>
                          ) : (
                            feature.tools.map((tool, toolIndex) => (
                              <div 
                                key={toolIndex} 
                                className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                              >
                                <span className="text-sm text-gray-700">• {tool}</span>
                                <button
                                  onClick={() => handleRemoveTool(headingIndex, toolIndex)}
                                  className="text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition-colors text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-black mb-4">Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="is_active" 
                    checked={formData.is_active} 
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      is_active: e.target.checked
                    }))} 
                    className="mr-2" 
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Active Plan
                  </label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="is_popular" 
                    checked={formData.is_popular} 
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      is_popular: e.target.checked
                    }))} 
                    className="mr-2" 
                  />
                  <label htmlFor="is_popular" className="text-sm font-medium text-gray-700">
                    Popular Plan
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <input 
                    type="number" 
                    value={formData.sort_order} 
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      sort_order: parseInt(e.target.value) || 0
                    }))} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex gap-3 justify-end">
            <button 
              onClick={onClose} 
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={onSubmit} 
              disabled={actionLoading === 'create' || actionLoading === 'update'} 
              className="px-4 py-2 bg-[#ff4b01] text-white rounded hover:bg-[#e64401] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {actionLoading === 'create' || actionLoading === 'update' ? 'Saving...' : isEditing ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}


'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import PlanFormModal from './PlanFormModal';
import CreditPackagesManagement from './CreditPackagesManagement';
interface AdminPlansProps {
  userProfile: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: 'user' | 'admin';
    email_confirmed: boolean;
    created_at: string;
  };
}
interface PlanLimits {
  max_pages?: number;
  max_audits_per_month?: number;
  max_team_members?: number;
  storage_gb?: number;
  api_calls_per_month?: number;
  [key: string]: number | string | boolean | undefined;
}
interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}
// Helper type for old feature format (for backward compatibility)
type OldFeature = {
  name: string;
  description: string;
  icon: string;
};

// New feature format
type NewFeature = {
  heading: string;
  tools: string[];
};

interface Plan {
  id: string;
  name: string;
  description: string;
  plan_type: 'Starter' | 'Growth' | 'Scale';
  razorpay_plan_id: string;
  subscription_id: string;
  price: number;
  currency: string;
  billing_cycle: string;
  interval_count: number;
  features: Array<NewFeature | OldFeature>;
  can_use_features: string[];
  max_projects: number;
  limits: PlanLimits;
  is_active: boolean;
  is_popular: boolean;
  color: string;
  sort_order: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

interface PlanFormData {
  name: string;
  description: string;
  plan_type: 'Starter' | 'Growth' | 'Scale';
  price: number;
  currency: string;
  billing_cycle: string;
  features: Array<NewFeature>;
  can_use_features: string[];
  max_projects: number;
  limits: PlanLimits;
  is_active: boolean;
  is_popular: boolean;
  color: string;
  sort_order: number;
  razorpay_plan_id: string;
  subscription_id: string;
}

// Helper function to convert old feature format to new format
function convertFeaturesToNewFormat(features: unknown): Array<NewFeature> {
  if (!Array.isArray(features)) return [];
  
  return features.map((feature: unknown) => {
    // Check if it's already in new format
    if (feature && typeof feature === 'object' && 'heading' in feature && 'tools' in feature) {
      return feature as NewFeature;
    }
    
    // Convert from old format
    if (feature && typeof feature === 'object' && 'name' in feature) {
      const oldFeature = feature as OldFeature;
      return {
        heading: oldFeature.name || 'Features',
        tools: oldFeature.description ? [oldFeature.description] : []
      };
    }
    
    // Fallback
    return { heading: 'Features', tools: [] };
  }).filter((f: NewFeature) => f.heading && f.heading.trim() !== '');
}
export default function AdminPlans({
  userProfile: _userProfile
}: AdminPlansProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    description: '',
    plan_type: 'Starter',
    price: 0,
    currency: 'INR',
    billing_cycle: 'monthly',
    features: [],
    can_use_features: [],
    max_projects: 1,
    limits: {},
    is_active: true,
    is_popular: false,
    color: 'gray',
    sort_order: 0,
    razorpay_plan_id: '',
    subscription_id: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    setPlansError(null);
    try {
      // Try direct Supabase access first
      const {
        data: directData,
        error: directError
      } = await supabase.from('plans').select('*').order('created_at', {
        ascending: true
      });
      
      if (directError) {
        console.error('Direct Supabase error:', directError);
        // Fallback to API route
        const response = await fetch('/api/plans');
        if (response.ok) {
          const apiData = await response.json();
          // Parse features from JSON strings if needed
          const parsedPlans = (apiData.plans || []).map((plan: unknown) => {
            const p = plan as Partial<Plan> & { features?: unknown; can_use_features?: unknown; limits?: unknown };
            try {
              const converted = {
                ...p,
                // Provide defaults for missing fields
                interval_count: p.interval_count ?? (p.billing_cycle === 'yearly' ? 12 : 1),
                subscription_id: p.subscription_id ?? '',
                razorpay_plan_id: p.razorpay_plan_id ?? '',
                features: convertFeaturesToNewFormat(
                  Array.isArray(p.features)
                    ? p.features.map((feature: unknown) =>
                        typeof feature === 'string' ? JSON.parse(feature as string) : feature
                      )
                    : []
                ),
                can_use_features: typeof p.can_use_features === 'string' ? JSON.parse(p.can_use_features as string) : (Array.isArray(p.can_use_features) ? p.can_use_features : []),
                limits: typeof p.limits === 'string' ? JSON.parse(p.limits as string) : (p.limits || {}),
                color: p.color || 'gray',
                sort_order: p.sort_order ?? 0,
                is_active: p.is_active ?? true,
                is_popular: p.is_popular ?? false
              };
              // Ensure all required fields exist
              if (converted.id && converted.name && converted.plan_type && converted.price !== undefined && converted.currency && converted.billing_cycle && converted.max_projects !== undefined) {
                return converted as Plan;
              }
              return null;
            } catch (error) {
              console.error('Error parsing plan data from API:', error, plan);
              return null;
            }
          }).filter((p: Plan | null): p is Plan => p !== null);
          setPlans(parsedPlans);
          console.log(`Loaded ${parsedPlans.length} plans from API`);
        } else {
          const errorText = await response.text();
          console.error('API access also failed:', response.status, response.statusText, errorText);
          setPlansError(`Failed to load plans: ${errorText || 'Unknown error'}`);
        }
      } else if (directData) {
        // Parse features from JSON strings if needed
        const parsedData = directData.map((plan: unknown) => {
          const p = plan as Partial<Plan> & { features?: unknown; can_use_features?: unknown; limits?: unknown };
          try {
            const converted = {
              ...p,
              // Provide defaults for missing fields
              interval_count: p.interval_count ?? (p.billing_cycle === 'yearly' ? 12 : 1),
              subscription_id: p.subscription_id ?? '',
              razorpay_plan_id: p.razorpay_plan_id ?? '',
              features: convertFeaturesToNewFormat(
                Array.isArray(p.features)
                  ? p.features.map((feature: unknown) =>
                      typeof feature === 'string' ? JSON.parse(feature as string) : feature
                    )
                  : []
              ),
              can_use_features: typeof p.can_use_features === 'string' ? JSON.parse(p.can_use_features as string) : (Array.isArray(p.can_use_features) ? p.can_use_features : []),
              limits: typeof p.limits === 'string' ? JSON.parse(p.limits as string) : (p.limits || {}),
              color: p.color || 'gray',
              sort_order: p.sort_order ?? 0,
              is_active: p.is_active ?? true,
              is_popular: p.is_popular ?? false
            };
            // Ensure all required fields exist
            if (converted.id && converted.name && converted.plan_type && converted.price !== undefined && converted.currency && converted.billing_cycle && converted.max_projects !== undefined) {
              return converted as Plan;
            }
            return null;
          } catch (error) {
            console.error('Error parsing plan data:', error, plan);
            return null;
          }
        }).filter((p): p is Plan => p !== null);
        setPlans(parsedData);
        console.log(`Loaded ${parsedData.length} plans from Supabase`);
      } else {
        // No data and no error - empty result
        setPlans([]);
        console.log('No plans found in database');
      }
    } catch (error) {
      console.error('Unexpected error loading plans:', error);
      setPlansError(`Failed to load plans: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  // Load plans on component mount
  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // Debug: Log form data changes
  useEffect(() => {}, [formData]);
  const handlePlanAction = async (planId: string, action: string, data?: Partial<PlanFormData>) => {
    setActionLoading(action);
    try {
      // Clean data to avoid unique constraint violations
      const cleanData = data ? {
        ...data,
        plan_type: data.plan_type?.trim(),
        // Ensure plan_type is trimmed
        razorpay_plan_id: data.razorpay_plan_id && data.razorpay_plan_id.trim() !== '' ? data.razorpay_plan_id : null
      } : data;

      // Debug: Log the data being sent

      // Validate plan_type before proceeding
      const validPlanTypes = ['Starter', 'Growth', 'Scale'];
      if (cleanData?.plan_type && !validPlanTypes.includes(cleanData.plan_type)) {
        console.error('Invalid plan_type detected:', cleanData.plan_type);
        alert(`Invalid plan type: "${cleanData.plan_type}". Must be one of: ${validPlanTypes.join(', ')}`);
        return;
      }
      let result: {
        data: Plan | null;
        error: SupabaseError | null;
      } | null = null;
      let useApiFallback = false;
      try {
        // Try direct Supabase operations first
        switch (action) {
          case 'create':
            result = await supabase.from('plans').insert([cleanData]).select().single();
            break;
          case 'update':
            result = await supabase.from('plans').update(cleanData).eq('id', planId).select().single();
            break;
          case 'delete':
            result = await supabase.from('plans').update({
              is_active: false
            }).eq('id', planId).select().single();
            break;
          default:
            throw new Error('Unknown action');
        }
        if (result.error) {
          useApiFallback = true;
        }
      } catch (directError) {
        useApiFallback = true;
      }

      // If direct operation failed, try API route
      if (useApiFallback) {
        let apiResponse;
        try {
          if (action === 'create') {
            apiResponse = await fetch('/api/plans', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(cleanData)
            });
          } else if (action === 'update') {
            apiResponse = await fetch(`/api/plans/${planId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(cleanData)
            });
          } else if (action === 'delete') {
            apiResponse = await fetch(`/api/plans/${planId}`, {
              method: 'DELETE'
            });
          }
          if (apiResponse && apiResponse.ok) {
            const apiResult = await apiResponse.json();
            result = {
              data: apiResult.plan || apiResult,
              error: null
            };
          } else {
            const errorText = await apiResponse?.text();
            console.error('API response error:', errorText);
            throw new Error(`API operation failed: ${apiResponse?.status} - ${errorText}`);
          }
        } catch (apiError) {
          console.error('API fallback error:', apiError);
          throw new Error(`Both direct and API operations failed. Direct error: ${result?.error?.message || 'Unknown'}, API error: ${apiError instanceof Error ? apiError.message : 'Unknown'}`);
        }
      }
      if (result && result.error) {
        console.error(`Error ${action}:`, result.error);
        console.error('Error details:', {
          message: result.error.message,
          code: result.error.code,
          details: result.error.details,
          hint: result.error.hint
        });
        alert(`Failed to ${action} plan: ${result.error.message || 'Unknown error'}`);
      } else {
        await loadPlans();
        alert(`Plan ${action}d successfully!`);

        // Trigger plan refresh across the application
        window.dispatchEvent(new CustomEvent('planUpdated'));
        // Also trigger a custom event for billing section refresh
        window.dispatchEvent(new CustomEvent('billingRefresh'));
        if (action === 'create' || action === 'update') {
          setShowPlanForm(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error(`Unexpected error ${action}ing plan:`, error);
      alert(`Failed to ${action} plan. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      plan_type: 'Starter',
      price: 0,
      currency: 'INR',
      billing_cycle: 'monthly',
      features: [],
      can_use_features: [],
      max_projects: 1,
      limits: {},
      is_active: true,
      is_popular: false,
      color: 'gray',
      sort_order: 0,
      razorpay_plan_id: '',
      subscription_id: ''
    });
    setIsEditing(false);
  };
  const handleEditPlan = (plan: Plan) => {
    // Convert features to new format
    const convertedFeatures = convertFeaturesToNewFormat(plan.features);

    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      plan_type: plan.plan_type || 'Starter',
      price: plan.price || 0,
      currency: plan.currency || 'INR',
      billing_cycle: plan.billing_cycle || 'monthly',
      features: convertedFeatures,
      can_use_features: plan.can_use_features || [],
      max_projects: plan.max_projects || 1,
      limits: plan.limits || {},
      is_active: plan.is_active ?? true,
      is_popular: plan.is_popular ?? false,
      color: plan.color || 'gray',
      sort_order: plan.sort_order || 0,
      razorpay_plan_id: plan.razorpay_plan_id || '',
      subscription_id: plan.subscription_id || ''
    });
    setSelectedPlan(plan);
    setIsEditing(true);
    setShowPlanForm(true);
  };
  const handleSubmit = () => {
    // Validate plan_type before submitting
    const validPlanTypes = ['Starter', 'Growth', 'Scale'];
    if (!validPlanTypes.includes(formData.plan_type)) {
      alert(`Invalid plan type: ${formData.plan_type}. Must be one of: ${validPlanTypes.join(', ')}`);
      return;
    }

    // Validate required fields
    if (!formData.name.trim()) {
      alert('Plan name is required');
      return;
    }
    if (!formData.razorpay_plan_id.trim()) {
      alert('Razorpay Plan ID is required');
      return;
    }
    if (!formData.subscription_id.trim()) {
      alert('Subscription ID is required');
      return;
    }
    if (isEditing && selectedPlan) {
      handlePlanAction(selectedPlan.id, 'update', formData);
    } else {
      handlePlanAction('', 'create', formData);
    }
  };
  const getPlanTypeColor = (type: string) => {
    switch (type) {
      case 'Starter':
        return 'bg-green-100 text-green-800';
      case 'Growth':
        return 'bg-[#ff4b01]/20 text-[#ff4b01]';
      case 'Scale':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const formatPrice = (price: number | null | undefined, currency: string | null | undefined) => {
    if (!price || price === 0 || isNaN(price)) return 'Free';
    const currencyCode = currency || 'INR';
    return currencyCode === 'INR' ? `₹${price.toLocaleString()}` : `$${price.toLocaleString()}`;
  };

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) || plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || plan.plan_type === filterType;
    const matchesStatus = filterStatus === 'all' || filterStatus === 'active' && plan.is_active || filterStatus === 'inactive' && !plan.is_active;
    return matchesSearch && matchesType && matchesStatus;
  });
  return <motion.div className="space-y-6" initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.5
  }}>
      {/* Header */}
      <motion.div className="bg-white rounded-lg border border-gray-200 p-6" initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5,
      delay: 0.1
    }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">Plans & Usage Management</h1>
            <p className="text-gray-600 mt-1">Manage subscription plans and their features</p>
          </div>
          <button onClick={() => {
          resetForm();
          setShowPlanForm(true);
        }} className="bg-[#ff4b01] text-white px-4 py-2 rounded-lg hover:bg-[#e64401] transition-colors">
            Add Plan
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]" placeholder="Search plans..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]">
              <option value="all">All Types</option>
              <option value="Starter">Starter</option>
              <option value="Growth">Growth</option>
              <option value="Scale">Scale</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Plans Table */}
      <motion.div className="bg-white rounded-lg border border-gray-200 overflow-hidden" initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5,
      delay: 0.2
    }}>
        {plansLoading ? <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff4b01]"></div>
          </div> : plansError ? <div className="text-center py-8">
            <div className="text-red-500 mb-2">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{plansError}</p>
            <button onClick={loadPlans} className="mt-2 text-[#ff4b01] hover:text-[#e64401] text-sm font-medium px-4 py-2 bg-[#ff4b01]/10 rounded-lg hover:bg-[#ff4b01]/20 transition-colors">
              Try again
            </button>
          </div> : <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Billing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Razorpay ID
                    </th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Features
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPlans.map((plan, index) => <motion.tr key={plan.id} initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.3,
              delay: 0.3 + index * 0.1
            }} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${plan.color === 'black' ? 'bg-black' : plan.color === 'blue' ? 'bg-[#ff4b01]' : 'bg-gray-500'}`}>
                          <span className="text-white font-medium text-sm">
                            {plan.name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-black">{plan.name}</div>
                          <div className="text-sm text-gray-500">{plan.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanTypeColor(plan.plan_type)}`}>
                        {plan.plan_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black">
                        {formatPrice(plan.price, plan.currency)}
                      </div>
                      <div className="text-sm text-gray-500">
                      {plan.billing_cycle || 'monthly'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${plan.billing_cycle === 'monthly' ? 'bg-[#ff4b01]/20 text-[#ff4b01]' : plan.billing_cycle === 'yearly' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {plan.billing_cycle || 'monthly'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {plan.razorpay_plan_id ? <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            {plan.razorpay_plan_id}
                          </span> : <span className="text-gray-400 text-xs">Not configured</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {Array.isArray(plan.features) && plan.features.length > 0 ? (
                          <div className="space-y-1">
                            {plan.features.map((feature, idx) => {
                              const newFeature = 'heading' in feature && 'tools' in feature ? feature : null;
                              if (newFeature) {
                                return (
                                  <div key={idx} className="text-xs">
                                    <span className="font-medium">{newFeature.heading}</span>
                                    {newFeature.tools.length > 0 && (
                                      <span className="text-gray-400 ml-1">
                                        ({newFeature.tools.length} tool{newFeature.tools.length !== 1 ? 's' : ''})
                                      </span>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-400">No features</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button onClick={() => handleEditPlan(plan)} className="text-[#ff4b01] hover:text-[#e64401]">
                          Edit
                        </button>
                        <button onClick={() => handlePlanAction(plan.id, 'delete')} disabled={actionLoading === 'delete'} className="text-red-600 hover:text-red-900 disabled:opacity-50">
                          {actionLoading === 'delete' ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </motion.tr>)}
              </tbody>
            </table>
          </div>}
      </motion.div>

      {/* Plan Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div className="bg-white rounded-lg border border-gray-200 p-6" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5,
        delay: 0.4
      }}>
          <h3 className="text-lg font-semibold text-black mb-4">Plan Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-700">Total Plans</span>
              <span className="font-semibold text-black">{plans.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Active Plans</span>
              <span className="font-semibold text-green-600">{plans.filter(p => p.is_active).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Starter Plans</span>
              <span className="font-semibold text-green-600">{plans.filter(p => p.plan_type === 'Starter').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Growth Plans</span>
              <span className="font-semibold text-[#ff4b01]">{plans.filter(p => p.plan_type === 'Growth').length}</span>
            </div>
          </div>
        </motion.div>

        <motion.div className="bg-white rounded-lg border border-gray-200 p-6" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5,
        delay: 0.5
      }}>
          <h3 className="text-lg font-semibold text-black mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button onClick={loadPlans} className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-[#ff4b01] hover:bg-[#ff4b01]/10 transition-colors">
              <span className="font-medium text-black">Refresh Plans</span>
            </button>
            <button onClick={() => setShowPlanForm(true)} className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-[#ff4b01] hover:bg-[#ff4b01]/10 transition-colors">
              <span className="font-medium text-black">Add New Plan</span>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-[#ff4b01] hover:bg-[#ff4b01]/10 transition-colors">
              <span className="font-medium text-black">Export Plans</span>
            </button>
          </div>
        </motion.div>

        <motion.div className="bg-white rounded-lg border border-gray-200 p-6" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5,
        delay: 0.6
      }}>
          <h3 className="text-lg font-semibold text-black mb-4">Plan Types</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-700">Starter</span>
              <span className="font-semibold text-green-600">{plans.filter(p => p.plan_type === 'Starter').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Growth</span>
              <span className="font-semibold text-[#ff4b01]">{plans.filter(p => p.plan_type === 'Growth').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Scale</span>
              <span className="font-semibold text-purple-600">{plans.filter(p => p.plan_type === 'Scale').length}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Credit Packages Management */}
      <CreditPackagesManagement />

      {/* Plan Form Modal */}
      <PlanFormModal
        isOpen={showPlanForm}
        onClose={() => {
          setShowPlanForm(false);
          resetForm();
        }}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        isEditing={isEditing}
        actionLoading={actionLoading}
      />
    </motion.div>;
}
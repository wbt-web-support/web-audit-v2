import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type PlanType = 'Starter' | 'Growth' | 'Scale'

export interface UserPlanInfo {
  plan_type: PlanType
  plan_id: string
  plan_name: string
  can_use_features: string[]
  max_projects: number
  current_projects: number
  billing_cycle?: string
  plan_expires_at?: string
}

export interface UseUserPlanResult {
  planInfo: UserPlanInfo | null
  loading: boolean
  error: string | null
  hasFeature: (featureId: string) => boolean
  canCreateProject: () => boolean
  refreshPlan: () => Promise<void>
}

interface SubscriptionData {
  plan_id: string
  plans: {
    id: string
    name: string
    plan_type: PlanType
    can_use_features: string[]
    max_projects: number
  }
}

interface PlanData {
  id: string
  name: string
  plan_type: PlanType
  can_use_features: string[]
  max_projects: number
}

// Utility function to get plan name from database based on plan type
const getPlanNameFromDB = async (planType: PlanType): Promise<string> => {
  try {
    const { data: plan, error } = await supabase
      .from('plans')
      .select('name')
      .eq('plan_type', planType)
      .eq('is_active', true)
      .single()
    
    if (error || !plan) {
      console.warn(`No plan found for type ${planType}, using fallback name`)
      return `${planType} Plan` // Fallback to plan type + "Plan"
    }
    
    return plan.name
  } catch (err) {
    console.error(`Error fetching plan name for ${planType}:`, err)
    return `${planType} Plan` // Fallback to plan type + "Plan"
  }
}

export function useUserPlan(): UseUserPlanResult {
  const [planInfo, setPlanInfo] = useState<UserPlanInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Function to check plan expiry
  const checkPlanExpiry = async () => {
    try {
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      if (!token) {
        console.warn('No session token available for plan expiry check')
        return
      }

      console.log('Checking plan expiry...')
      
      const response = await fetch('/api/check-plan-expiry', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Plan expiry check result:', data)
        
        if (data.downgraded) {
          console.log('User plan was downgraded due to expiry')
          // Trigger a refresh of plan data
          setTimeout(() => {
            fetchUserPlan()
          }, 1000)
        }
      } else {
        console.warn('Plan expiry check failed:', response.status)
      }
    } catch (error) {
      console.error('Error checking plan expiry:', error)
      // Don't throw error - this is a background check
    }
  }


  const fetchUserPlan = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Check plan expiry first
      await checkPlanExpiry()

      // Get user's plan data from user table
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('plan_type, plan_id, max_projects, can_use_features, plan_expires_at, billing_cycle')
        .eq('id', user.id)
        .single()

      console.log('User data from database:', userData)
      console.log('User data error:', userError)

      let userPlan: UserPlanInfo | null = null

      if (userDataError || !userData || !userData.plan_type) {
        console.warn('No plan_type found in user table, using fallback plan')
        // Use a fallback plan if no plan_type is set
        const fallbackPlanName = await getPlanNameFromDB('Starter')
        userPlan = {
          plan_type: 'Starter' as PlanType,
          plan_id: 'fallback-starter',
          plan_name: fallbackPlanName,
          can_use_features: ['basic_audit'],
          max_projects: 1,
          current_projects: 0
        }
      } else {
        // Use data directly from users table if available, otherwise fetch from plans table
        if (userData.plan_id && userData.max_projects !== undefined && userData.can_use_features) {
          console.log('Using user data directly from users table')
          // Get plan name from plans table
          const { data: planData, error: planError } = await supabase
            .from('plans')
            .select('name')
            .eq('id', userData.plan_id)
            .single()

          const planName = planError || !planData ? 
            await getPlanNameFromDB(userData.plan_type as PlanType) : 
            planData.name

          userPlan = {
            plan_type: userData.plan_type as PlanType,
            plan_id: userData.plan_id,
            plan_name: planName,
            can_use_features: userData.can_use_features || [],
            max_projects: userData.max_projects || 1,
            current_projects: 0,
            billing_cycle: userData.billing_cycle,
            plan_expires_at: userData.plan_expires_at
          }
        } else {
          console.log('Fetching plan details from plans table')
          // Get plan details from plans table based on user's plan_type
          const { data: planData, error: planError } = await supabase
            .from('plans')
            .select('id, name, plan_type, can_use_features, max_projects')
            .eq('plan_type', userData.plan_type)
            .eq('is_active', true)
            .single() as { data: PlanData | null; error: any }

          if (planError || !planData) {
            console.warn(`No plan found for type ${userData.plan_type}, using fallback plan`)
            const fallbackPlanName = await getPlanNameFromDB(userData.plan_type as PlanType)
            userPlan = {
              plan_type: userData.plan_type as PlanType,
              plan_id: 'fallback-' + userData.plan_type.toLowerCase(),
              plan_name: fallbackPlanName,
              can_use_features: ['basic_audit'],
              max_projects: 1,
              current_projects: 0
            }
          } else {
            userPlan = {
              plan_type: planData.plan_type,
              plan_id: planData.id,
              plan_name: planData.name, // Use the actual name from database
              can_use_features: planData.can_use_features || [],
              max_projects: planData.max_projects || 1,
              current_projects: 0,
              billing_cycle: userData.billing_cycle,
              plan_expires_at: userData.plan_expires_at
            }
          }
        }
      }

      // Get current project count
      const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)

      if (!projectError && projects) {
        userPlan.current_projects = projects.length
      }

      console.log('Final user plan:', userPlan)
      setPlanInfo(userPlan)
    } catch (err) {
      console.error('Error fetching user plan:', err)
      
            // If there's an error, provide a fallback plan instead of null
            const fallbackPlanName = await getPlanNameFromDB('Starter')
            const fallbackPlan: UserPlanInfo = {
              plan_type: 'Starter' as PlanType,
              plan_id: 'fallback-starter',
              plan_name: fallbackPlanName,
              can_use_features: ['basic_audit'],
              max_projects: 1,
              current_projects: 0
            }
      
      setError(err instanceof Error ? err.message : 'Failed to fetch plan information')
      setPlanInfo(fallbackPlan) // Use fallback instead of null
    } finally {
      setLoading(false)
    }
  }

  const hasFeature = (featureId: string): boolean => {
    return planInfo?.can_use_features.includes(featureId) || false
  }

  const canCreateProject = (): boolean => {
    if (!planInfo) return false
    return planInfo.max_projects === -1 || planInfo.current_projects < planInfo.max_projects
  }

  const refreshPlan = useCallback(async () => {
    await fetchUserPlan()
  }, [])

  useEffect(() => {
    fetchUserPlan()
  }, [])

  // Add a refresh mechanism that can be triggered externally
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'plan_updated' && e.newValue) {
        console.log('Plan update detected via storage, refreshing...')
        fetchUserPlan()
        localStorage.removeItem('plan_updated')
      }
    }

    const handleCustomEvent = () => {
      console.log('Plan update detected via custom event, refreshing...')
      fetchUserPlan()
    }

    // Also listen for focus events to refresh when user comes back to the tab
    const handleFocus = () => {
      console.log('Window focused, checking for plan updates...')
      fetchUserPlan()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('planUpdated', handleCustomEvent)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('planUpdated', handleCustomEvent)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  return {
    planInfo,
    loading,
    error,
    hasFeature,
    canCreateProject,
    refreshPlan
  }
}

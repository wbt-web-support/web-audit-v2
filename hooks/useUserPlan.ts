import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export type PlanType = 'Starter' | 'Growth' | 'Scale'

export interface UserPlanInfo {
  plan_type: PlanType
  plan_id: string
  plan_name: string
  can_use_features: string[]
  max_projects: number
  current_projects: number
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

export function useUserPlan(): UseUserPlanResult {
  const [planInfo, setPlanInfo] = useState<UserPlanInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserPlan = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Get user's current subscription/plan
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          plan_id,
          plans!inner(
            id,
            name,
            plan_type,
            can_use_features,
            max_projects
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single() as { data: SubscriptionData | null; error: any }

      let userPlan: UserPlanInfo | null = null

      if (subError || !subscription) {
        // If no active subscription, check for free plan
        const { data: freePlan, error: freeError } = await supabase
          .from('plans')
          .select('id, name, plan_type, can_use_features, max_projects')
          .eq('plan_type', 'Starter')
          .eq('is_active', true)
          .single() as { data: PlanData | null; error: any }

        if (freeError || !freePlan) {
          throw new Error('No plan found')
        }

        userPlan = {
          plan_type: freePlan.plan_type,
          plan_id: freePlan.id,
          plan_name: freePlan.name,
          can_use_features: freePlan.can_use_features || [],
          max_projects: freePlan.max_projects || 1,
          current_projects: 0
        }
      } else {
        userPlan = {
          plan_type: subscription.plans.plan_type,
          plan_id: subscription.plans.id,
          plan_name: subscription.plans.name,
          can_use_features: subscription.plans.can_use_features || [],
          max_projects: subscription.plans.max_projects || 1,
          current_projects: 0
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

      setPlanInfo(userPlan)
    } catch (err) {
      console.error('Error fetching user plan:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch plan information')
      setPlanInfo(null)
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

  const refreshPlan = async () => {
    await fetchUserPlan()
  }

  useEffect(() => {
    fetchUserPlan()
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

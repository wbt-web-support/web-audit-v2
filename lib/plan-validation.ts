import { supabase } from './supabase'
import { FEATURES } from './features'

export type PlanType = 'Starter' | 'Growth' | 'Scale'
export type CrawlType = 'single' | 'multiple'

export interface PlanValidationResult {
  hasAccess: boolean
  userPlan: PlanType | null
  allowedFeatures: string[]
  error?: string
}

export interface UserPlanInfo {
  plan_type: PlanType
  plan_id: string
  plan_name: string
  can_use_features: string[]
  max_projects: number
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

/**
 * Get user's current plan information
 */
export async function getUserPlanInfo(userId: string): Promise<UserPlanInfo | null> {
  try {
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
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single() as { data: SubscriptionData | null; error: any }

    if (subError || !subscription) {
      // If no active subscription, check for free plan
      const { data: freePlan, error: freeError } = await supabase
        .from('plans')
        .select('id, name, plan_type, can_use_features, max_projects')
        .eq('plan_type', 'Starter')
        .eq('is_active', true)
        .single() as { data: PlanData | null; error: any }

      if (freeError || !freePlan) {
        return null
      }

      return {
        plan_type: freePlan.plan_type,
        plan_id: freePlan.id,
        plan_name: freePlan.name,
        can_use_features: freePlan.can_use_features || [],
        max_projects: freePlan.max_projects || 1
      }
    }

    return {
      plan_type: subscription.plans.plan_type,
      plan_id: subscription.plans.id,
      plan_name: subscription.plans.name,
      can_use_features: subscription.plans.can_use_features || [],
      max_projects: subscription.plans.max_projects || 1
    }
  } catch (error) {
    console.error('Error getting user plan info:', error)
    return null
  }
}

/**
 * Check if user has access to a specific feature
 */
export async function checkFeatureAccess(userId: string, featureId: string): Promise<PlanValidationResult> {
  try {
    const userPlan = await getUserPlanInfo(userId)
    
    if (!userPlan) {
      return {
        hasAccess: false,
        userPlan: null,
        allowedFeatures: [],
        error: 'No plan found for user'
      }
    }

    const hasAccess = userPlan.can_use_features.includes(featureId)
    
    return {
      hasAccess,
      userPlan: userPlan.plan_type,
      allowedFeatures: userPlan.can_use_features,
      error: hasAccess ? undefined : `Feature '${featureId}' not available in ${userPlan.plan_type} plan`
    }
  } catch (error) {
    console.error('Error checking feature access:', error)
    return {
      hasAccess: false,
      userPlan: null,
      allowedFeatures: [],
      error: 'Failed to validate feature access'
    }
  }
}

/**
 * Check if user can perform a specific crawl type
 */
export async function checkCrawlAccess(userId: string, crawlType: CrawlType): Promise<PlanValidationResult> {
  const requiredFeature = crawlType === 'single' ? 'single_page_crawl' : 'full_site_crawl'
  return await checkFeatureAccess(userId, requiredFeature)
}

/**
 * Check if user can create more projects
 */
export async function checkProjectLimit(userId: string): Promise<{ canCreate: boolean; currentCount: number; maxProjects: number; error?: string }> {
  try {
    const userPlan = await getUserPlanInfo(userId)
    
    if (!userPlan) {
      return {
        canCreate: false,
        currentCount: 0,
        maxProjects: 0,
        error: 'No plan found for user'
      }
    }

    // Get current project count for user
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId)

    if (projectError) {
      return {
        canCreate: false,
        currentCount: 0,
        maxProjects: userPlan.max_projects,
        error: 'Failed to get project count'
      }
    }

    const currentCount = projects?.length || 0
    const maxProjects = userPlan.max_projects
    const canCreate = maxProjects === -1 || currentCount < maxProjects

    return {
      canCreate,
      currentCount,
      maxProjects,
      error: canCreate ? undefined : `Project limit reached. You can create ${maxProjects} project${maxProjects !== 1 ? 's' : ''} with your current plan.`
    }
  } catch (error) {
    console.error('Error checking project limit:', error)
    return {
      canCreate: false,
      currentCount: 0,
      maxProjects: 0,
      error: 'Failed to validate project limit'
    }
  }
}

/**
 * Validate all features for a crawl request
 */
export async function validateCrawlRequest(userId: string, requestedFeatures: string[]): Promise<{
  isValid: boolean
  allowedFeatures: string[]
  deniedFeatures: string[]
  errors: string[]
}> {
  try {
    const userPlan = await getUserPlanInfo(userId)
    
    if (!userPlan) {
      return {
        isValid: false,
        allowedFeatures: [],
        deniedFeatures: requestedFeatures,
        errors: ['No plan found for user']
      }
    }

    const allowedFeatures: string[] = []
    const deniedFeatures: string[] = []
    const errors: string[] = []

    for (const feature of requestedFeatures) {
      if (userPlan.can_use_features.includes(feature)) {
        allowedFeatures.push(feature)
      } else {
        deniedFeatures.push(feature)
        const featureInfo = FEATURES.find(f => f.id === feature)
        errors.push(`Feature '${featureInfo?.name || feature}' is not available in your ${userPlan.plan_type} plan`)
      }
    }

    return {
      isValid: deniedFeatures.length === 0,
      allowedFeatures,
      deniedFeatures,
      errors
    }
  } catch (error) {
    console.error('Error validating crawl request:', error)
    return {
      isValid: false,
      allowedFeatures: [],
      deniedFeatures: requestedFeatures,
      errors: ['Failed to validate request']
    }
  }
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { handleAuthError } from '@/lib/auth-utils';
export type PlanType = 'Starter' | 'Growth' | 'Scale';
export interface UserPlanInfo {
  plan_type: PlanType;
  plan_id: string;
  plan_name: string;
  can_use_features: string[];
  max_projects: number;
  current_projects: number;
  billing_cycle?: string;
  plan_expires_at?: string;
}
export interface UseUserPlanResult {
  planInfo: UserPlanInfo | null;
  loading: boolean;
  error: string | null;
  hasFeature: (featureId: string) => boolean;
  canCreateProject: () => boolean;
  refreshPlan: () => Promise<void>;
}
interface SubscriptionData {
  plan_id: string;
  plans: {
    id: string;
    name: string;
    plan_type: PlanType;
    can_use_features: string[];
    max_projects: number;
  };
}
interface PlanData {
  id: string;
  name: string;
  plan_type: PlanType;
  can_use_features: string[];
  max_projects: number;
}

// Utility function to get plan name from database based on plan type
const getPlanNameFromDB = async (planType: PlanType): Promise<string> => {
  try {
    const {
      data: plan,
      error
    } = await supabase.from('plans').select('name').eq('plan_type', planType).eq('is_active', true).single();
    if (error || !plan) {
      console.warn(`No plan found for type ${planType}, using fallback name`);
      return `${planType} Plan`; // Fallback to plan type + "Plan"
    }
    return plan.name;
  } catch (err) {
    console.error(`Error fetching plan name for ${planType}:`, err);
    return `${planType} Plan`; // Fallback to plan type + "Plan"
  }
};
export function useUserPlan(): UseUserPlanResult {
  const [planInfo, setPlanInfo] = useState<UserPlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastExpiryCheck, setLastExpiryCheck] = useState<number>(0);
  const [isCheckingExpiry, setIsCheckingExpiry] = useState(false);

  // Function to check plan expiry with debouncing
  const checkPlanExpiry = async () => {
    const now = Date.now();
    const DEBOUNCE_TIME = 10 * 60 * 1000; // 10 minutes (increased from 5)
    
    // Prevent concurrent expiry checks
    if (isCheckingExpiry) {
      return;
    }
    
    // Only check if enough time has passed since last check
    if (now - lastExpiryCheck < DEBOUNCE_TIME) {
      return;
    }
    
    // Skip expiry check if user is on Starter plan (no expiry)
    if (planInfo?.plan_type === 'Starter') {
      return;
    }
    
    try {
      // Get current session for authentication
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        console.warn('No session token available for plan expiry check');
        return;
      }
      
    setLastExpiryCheck(now);
    setIsCheckingExpiry(true);
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('/api/check-plan-expiry', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.downgraded) {
          // Trigger a refresh of plan data
          setTimeout(() => {
            fetchUserPlan();
          }, 1000);
        }
      } else {
        console.warn('Plan expiry check failed:', response.status);
      }
    } catch (error) {
      // Handle AbortError specifically (timeout) - don't log as error
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Plan expiry check timed out - this is normal for slow connections');
        return;
      }
      console.error('Error checking plan expiry:', error);
      // Don't throw error - this is a background check
    } finally {
      setIsCheckingExpiry(false);
    }
  };
  const fetchUserPlan = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const {
        data: {
          user
        },
        error: userError
      } = await supabase.auth.getUser();
      if (userError || !user) {
        // Handle authentication errors
        const wasLoggedOut = await handleAuthError(userError, 'useUserPlan');
        if (wasLoggedOut) {
          return;
        }
        throw new Error('User not authenticated');
      }

      // Check plan expiry first (with debouncing) - non-blocking
      checkPlanExpiry().catch(error => {
        console.warn('Plan expiry check failed (non-blocking):', error);
      });

      // Get user's plan data from user table
      const {
        data: userData,
        error: userDataError
      } = await supabase.from('users').select('plan_type, plan_id, max_projects, can_use_features, plan_expires_at, billing_cycle').eq('id', user.id).single();
      let userPlan: UserPlanInfo | null = null;
      if (userDataError || !userData || !userData.plan_type) {
        console.warn('No plan_type found in user table, using fallback plan');
        // Use a fallback plan if no plan_type is set
        const fallbackPlanName = await getPlanNameFromDB('Starter');
        userPlan = {
          plan_type: 'Starter' as PlanType,
          plan_id: 'fallback-starter',
          plan_name: fallbackPlanName,
          can_use_features: ['basic_audit'],
          max_projects: 1,
          current_projects: 0
        };
      } else {
        // Always fetch fresh data from plans table to get latest features and limits
        // This ensures we get the most up-to-date plan configuration
        let planData, planError;
        
        // Try to get by plan_id first if available, otherwise by plan_type
        if (userData.plan_id) {
          const result = await supabase.from('plans').select('id, name, plan_type, can_use_features, max_projects').eq('id', userData.plan_id).eq('is_active', true).single();
          planData = result.data;
          planError = result.error;
        }
        
        // If plan_id query failed or no plan_id, try by plan_type
        if (planError || !planData) {
          const result = await supabase.from('plans').select('id, name, plan_type, can_use_features, max_projects').eq('plan_type', userData.plan_type).eq('is_active', true).order('created_at', { ascending: true }).limit(1).single();
          planData = result.data;
          planError = result.error;
        }
        
        if (planError || !planData) {
          console.warn(`No plan found for type ${userData.plan_type}, using fallback plan`);
          console.error('Plan query error:', planError);
          const fallbackPlanName = await getPlanNameFromDB(userData.plan_type as PlanType);
          userPlan = {
            plan_type: userData.plan_type as PlanType,
            plan_id: 'fallback-' + userData.plan_type.toLowerCase(),
            plan_name: fallbackPlanName,
            can_use_features: ['basic_audit'],
            max_projects: 1,
            current_projects: 0,
            billing_cycle: userData.billing_cycle,
            plan_expires_at: userData.plan_expires_at
          };
        } else {
          userPlan = {
            plan_type: planData.plan_type,
            plan_id: planData.id,
            plan_name: planData.name,
            // Always use fresh data from plans table
            can_use_features: planData.can_use_features || [],
            max_projects: planData.max_projects || 1,
            current_projects: 0,
            billing_cycle: userData.billing_cycle,
            plan_expires_at: userData.plan_expires_at
          };
        }
      }

      // Get current project count
      const {
        data: projects,
        error: projectError
      } = await supabase.from('audit_projects').select('id').eq('user_id', user.id);
      if (!projectError && projects) {
        userPlan.current_projects = projects.length;
      }
      
      setPlanInfo(userPlan);
    } catch (err) {
      console.error('Error fetching user plan:', err);

      // Handle authentication errors
      const wasLoggedOut = await handleAuthError(err, 'useUserPlan catch block');
      if (wasLoggedOut) {
        return;
      }

      // If there's an error, provide a fallback plan instead of null
      const fallbackPlanName = await getPlanNameFromDB('Starter');
      const fallbackPlan: UserPlanInfo = {
        plan_type: 'Starter' as PlanType,
        plan_id: 'fallback-starter',
        plan_name: fallbackPlanName,
        can_use_features: ['basic_audit'],
        max_projects: 1,
        current_projects: 0
      };
      setError(err instanceof Error ? err.message : 'Failed to fetch plan information');
      setPlanInfo(fallbackPlan); // Use fallback instead of null
    } finally {
      setLoading(false);
    }
  };
  const hasFeature = (featureId: string): boolean => {
    return planInfo?.can_use_features.includes(featureId) || false;
  };
  const canCreateProject = (): boolean => {
    if (!planInfo) return false;
    return planInfo.max_projects === -1 || planInfo.current_projects < planInfo.max_projects;
  };
  const refreshPlan = useCallback(async () => {
    await fetchUserPlan();
  }, []);
  useEffect(() => {
    fetchUserPlan();
  }, []);

  // Add a refresh mechanism that can be triggered externally
  useEffect(() => {
    let lastFocusTime = 0;
    const FOCUS_DEBOUNCE = 30 * 1000; // 30 seconds
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'plan_updated' && e.newValue) {
        fetchUserPlan();
        localStorage.removeItem('plan_updated');
      }
    };
    const handleCustomEvent = () => {
      fetchUserPlan();
    };

    // Debounced focus handler to prevent excessive calls
    const handleFocus = () => {
      const now = Date.now();
      if (now - lastFocusTime > FOCUS_DEBOUNCE) {
        lastFocusTime = now;
        fetchUserPlan();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('planUpdated', handleCustomEvent);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('planUpdated', handleCustomEvent);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  return {
    planInfo,
    loading,
    error,
    hasFeature,
    canCreateProject,
    refreshPlan
  };
}
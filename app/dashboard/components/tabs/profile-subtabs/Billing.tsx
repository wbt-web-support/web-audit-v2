'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PricingSection from '@/app/home-page-components/PricingSection';
import { useUserPlan } from '@/hooks/useUserPlan';
import { supabase } from '@/lib/supabase-client';
import { handleAuthError } from '@/lib/auth-utils';
interface PaymentHistory {
  id: string;
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  amount: number;
  currency: string;
  plan_name: string;
  plan_type: string;
  billing_cycle?: string;
  max_projects?: number;
  can_use_features?: string[];
  payment_status: string;
  payment_method?: string;
  subscription_id?: string;
  subscription_status?: string;
  payment_date: string;
  created_at: string;
  expires_at?: string;
  receipt_number?: string;
  notes?: string;
}
interface BillingProps {
  userProfile: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    full_name?: string;
    avatar_url?: string;
    role: 'user' | 'admin';
    email_confirmed: boolean;
    created_at: string;
    updated_at?: string;
  };
}
export default function Billing({
  userProfile
}: BillingProps) {
  const {
    planInfo,
    loading: planLoading
  } = useUserPlan();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [planExpiryStatus, setPlanExpiryStatus] = useState<{
    is_expired: boolean;
    expires_at: string | null;
    days_until_expiry: number | null;
  } | null>(null);

  // Check plan expiry status
  const checkPlanExpiryStatus = async () => {
    try {
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
      const response = await fetch('/api/check-plan-expiry', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPlanExpiryStatus({
          is_expired: data.is_expired,
          expires_at: data.expires_at,
          days_until_expiry: data.days_until_expiry
        });
      } else {
        console.warn('Plan expiry status check failed:', response.status);
      }
    } catch (error) {
      console.error('Error checking plan expiry status:', error);
      // Handle authentication errors
      await handleAuthError(error, 'Billing checkPlanExpiryStatus');
    }
  };

  // Fetch payment history function
  const fetchPaymentHistory = async () => {
    try {
      setLoadingHistory(true);
      // Get the current session token
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch('/api/payment-history', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data.payments || []);
      } else if (response.status === 401) {
        console.warn('User not authenticated, skipping payment history fetch');
        setPaymentHistory([]);
      } else {
        console.error('Failed to fetch payment history:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        // Set empty array as fallback
        setPaymentHistory([]);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      // Handle authentication errors
      await handleAuthError(error, 'Billing fetchPaymentHistory');
      // Set empty array as fallback
      setPaymentHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch payment history and check plan expiry on mount
  useEffect(() => {
    // Only fetch if user is authenticated
    if (userProfile?.id) {
      fetchPaymentHistory();
      checkPlanExpiryStatus();
    } else {
      setLoadingHistory(false);
    }
  }, [userProfile?.id]);

  // Listen for plan updates and billing refresh events
  useEffect(() => {
    const handlePlanUpdate = () => {
      // Refresh payment history when plans are updated
      if (userProfile?.id) {
        fetchPaymentHistory();
      }
    };
    const handleBillingRefresh = () => {
      // Refresh payment history
      if (userProfile?.id) {
        fetchPaymentHistory();
      }
    };

    // Add event listeners
    window.addEventListener('planUpdated', handlePlanUpdate);
    window.addEventListener('billingRefresh', handleBillingRefresh);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('planUpdated', handlePlanUpdate);
      window.removeEventListener('billingRefresh', handleBillingRefresh);
    };
  }, [userProfile?.id]);

  // Subscription data for usage display
  const subscription = {
    plan: planInfo?.plan_name || 'Free',
    status: 'active',
    nextBilling: null,
    usage: {
      projects: planInfo?.current_projects || 0,
      maxProjects: planInfo?.max_projects || 1,
      audits: 8,
      maxAudits: 100
    }
  };

  // Debug logging

  return <motion.div className="space-y-6" initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.5
  }}>
      {/* Plan Expiry Warning */}
      {planExpiryStatus && planExpiryStatus.expires_at && <motion.div className={`rounded-lg border p-4 mb-6 ${planExpiryStatus.is_expired ? 'bg-red-50 border-red-200' : planExpiryStatus.days_until_expiry && planExpiryStatus.days_until_expiry <= 7 ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`} initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5,
      delay: 0.05
    }}>
          <div className="flex items-center">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${planExpiryStatus.is_expired ? 'bg-red-100' : planExpiryStatus.days_until_expiry && planExpiryStatus.days_until_expiry <= 7 ? 'bg-yellow-100' : 'bg-blue-100'}`}>
              <span className={`text-lg ${planExpiryStatus.is_expired ? 'text-red-600' : planExpiryStatus.days_until_expiry && planExpiryStatus.days_until_expiry <= 7 ? 'text-yellow-600' : 'text-blue-600'}`}>
                {planExpiryStatus.is_expired ? '⚠️' : '⏰'}
              </span>
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${planExpiryStatus.is_expired ? 'text-red-800' : planExpiryStatus.days_until_expiry && planExpiryStatus.days_until_expiry <= 7 ? 'text-yellow-800' : 'text-blue-800'}`}>
                {planExpiryStatus.is_expired ? 'Plan Expired' : planExpiryStatus.days_until_expiry && planExpiryStatus.days_until_expiry <= 7 ? 'Plan Expiring Soon' : 'Plan Status'}
              </h3>
              <p className={`text-sm ${planExpiryStatus.is_expired ? 'text-red-700' : planExpiryStatus.days_until_expiry && planExpiryStatus.days_until_expiry <= 7 ? 'text-yellow-700' : 'text-blue-700'}`}>
                {planExpiryStatus.is_expired ? 'Your plan has expired and you have been downgraded to the Starter plan.' : planExpiryStatus.days_until_expiry ? `Your plan expires in ${planExpiryStatus.days_until_expiry} day${planExpiryStatus.days_until_expiry === 1 ? '' : 's'} on ${new Date(planExpiryStatus.expires_at!).toLocaleDateString()}.` : `Your plan expires on ${new Date(planExpiryStatus.expires_at!).toLocaleDateString()}.`}
              </p>
            </div>
          </div>
        </motion.div>}

      {/* Current Plan Usage */}
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-black">Current Plan</h2>
          <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
            {subscription.status}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.5,
          delay: 0.2
        }}>
            <h3 className="text-2xl font-bold text-black">{subscription.plan}</h3>
            <p className="text-gray-600">
              {planInfo?.plan_type === 'Starter' ? 'Free Plan' : `${planInfo?.plan_type} Plan`}
            </p>
          </motion.div>
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.5,
          delay: 0.3
        }}>
            <h4 className="font-medium text-black mb-2">Usage</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Projects: {subscription.usage.projects}/{subscription.usage.maxProjects === -1 ? '∞' : subscription.usage.maxProjects}</span>
                <div className="w-20 bg-gray-200 rounded h-2">
                  <motion.div className="bg-blue-600 h-2 rounded" initial={{
                  width: 0
                }} animate={{
                  width: subscription.usage.maxProjects === -1 ? '100%' : `${Math.min(subscription.usage.projects / subscription.usage.maxProjects * 100, 100)}%`
                }} transition={{
                  duration: 1,
                  delay: 0.5
                }}></motion.div>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span>Audits: {subscription.usage.audits}/{subscription.usage.maxAudits}</span>
                <div className="w-20 bg-gray-200 rounded h-2">
                  <motion.div className="bg-blue-600 h-2 rounded" initial={{
                  width: 0
                }} animate={{
                  width: `${subscription.usage.audits / subscription.usage.maxAudits * 100}%`
                }} transition={{
                  duration: 1,
                  delay: 0.7
                }}></motion.div>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.5,
          delay: 0.4
        }}>
            <h4 className="font-medium text-black mb-2">Next Billing</h4>
            <p className="text-gray-600">
              {subscription.nextBilling || 'No billing date (Free plan)'}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Pricing Plans */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5,
      delay: 0.2
    }}>
        <PricingSection currentPlanType={planInfo?.plan_type} currentPlanId={planInfo?.plan_id} currentBillingCycle={planInfo?.billing_cycle} planExpiresAt={planInfo?.plan_expires_at} showBillingToggle={true} showCurrentPlanHighlight={true} className="py-8" />
      </motion.div>

      {/* Billing History */}
      <motion.div className="bg-white rounded-lg border border-gray-200 p-6" initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5,
      delay: 0.3
    }}>
        <h2 className="text-lg font-semibold text-black mb-4">Payment History</h2>
        
        {loadingHistory ? <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading payment history...</p>
          </div> : !userProfile?.id ? <motion.div className="text-center py-8" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        duration: 0.5,
        delay: 0.4
      }}>
            <motion.svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" initial={{
          scale: 0
        }} animate={{
          scale: 1
        }} transition={{
          duration: 0.5,
          delay: 0.5
        }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </motion.svg>
            <h3 className="mt-2 text-sm font-medium text-black">Authentication Required</h3>
            <p className="mt-1 text-sm text-gray-500">Please log in to view payment history.</p>
          </motion.div> : paymentHistory.length === 0 ? <motion.div className="text-center py-8" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        duration: 0.5,
        delay: 0.4
      }}>
            <motion.svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" initial={{
          scale: 0
        }} animate={{
          scale: 1
        }} transition={{
          duration: 0.5,
          delay: 0.5
        }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </motion.svg>
            <h3 className="mt-2 text-sm font-medium text-black">No payment history</h3>
            <p className="mt-1 text-sm text-gray-500">
              {planInfo?.plan_type === 'Starter' ? "You're currently on the free plan." : "No payment records found for your account."}
            </p>
          </motion.div> : <div className="space-y-4">
            {paymentHistory.map((payment, index) => <motion.div key={payment.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors" initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.5,
          delay: 0.4 + index * 0.1
        }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-black">{payment.plan_name}</h3>
                    <p className="text-sm text-gray-600">
                      {payment.plan_type} • {payment.billing_cycle || 'One-time'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-black">
                      {payment.currency === 'INR' ? '₹' : '$'}{payment.amount}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${payment.payment_status === 'completed' ? 'bg-green-100 text-green-800' : payment.payment_status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {payment.payment_status}
                      </span>
                      {payment.subscription_status && <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {payment.subscription_status}
                        </span>}
                    </div>
                    <p className="text-xs text-gray-500">
                      Payment ID: {payment.razorpay_payment_id}
                    </p>
                    {payment.razorpay_order_id && <p className="text-xs text-gray-500">
                        Order ID: {payment.razorpay_order_id}
                      </p>}
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      Created: {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                    {payment.expires_at && <p className="text-xs text-gray-500">
                        Expires: {new Date(payment.expires_at).toLocaleDateString()}
                      </p>}
                    {payment.receipt_number && <p className="text-xs text-gray-500">
                        Receipt: {payment.receipt_number}
                      </p>}
                  </div>
                </div>

                {/* Plan Details */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Max Projects</p>
                      <p className="font-medium text-black">
                        {payment.max_projects === -1 ? 'Unlimited' : payment.max_projects || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Features</p>
                      <p className="font-medium text-black">
                        {payment.can_use_features?.length || 0} features
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Payment Method</p>
                      <p className="font-medium text-black">
                        {payment.payment_method || 'Razorpay'}
                      </p>
                    </div>
                  </div>
                  
                  {payment.notes && <div className="mt-2">
                      <p className="text-xs text-gray-500">Notes</p>
                      <p className="text-sm text-gray-700">{payment.notes}</p>
                    </div>}
                </div>
              </motion.div>)}
          </div>}
      </motion.div>
    </motion.div>;
}
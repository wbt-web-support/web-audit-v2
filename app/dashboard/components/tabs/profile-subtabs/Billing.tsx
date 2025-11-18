'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PricingSection from '@/app/home-page-components/PricingSection';
import { useUserPlan } from '@/hooks/useUserPlan';
import { supabase } from '@/lib/supabase-client';
import { handleAuthError } from '@/lib/auth-utils';

// Razorpay type is already declared in layout.tsx or elsewhere
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
    loading: _planLoading,
    hasFeature
  } = useUserPlan();
  
  // Check if user has Image_scane feature
  const hasImageScanFeature = hasFeature('Image_scane');
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [planExpiryStatus, setPlanExpiryStatus] = useState<{
    is_expired: boolean;
    expires_at: string | null;
    days_until_expiry: number | null;
  } | null>(null);
  const [creditPackages, setCreditPackages] = useState<Array<{id: number | string; credits: number; price: number; label: string; pricePerCredit: string}>>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [purchasingPackage, setPurchasingPackage] = useState<number | string | null>(null);

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

  // Fetch credit packages
  const fetchCreditPackages = async () => {
    try {
      setLoadingPackages(true);
      const response = await fetch('/api/purchase-credits');
      if (response.ok) {
        const data = await response.json();
        setCreditPackages(data.packages || []);
      }
    } catch (error) {
      console.error('Error fetching credit packages:', error);
    } finally {
      setLoadingPackages(false);
    }
  };

  // Handle credit purchase
  const handlePurchaseCredits = async (packageId: number | string) => {
    try {
      setPurchasingPackage(packageId);
      
      // Load Razorpay script
      const loadRazorpayScript = async (): Promise<boolean> => {
        if (typeof window === 'undefined') return false;
        if (window.Razorpay) return true;

        const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
        if (existingScript) {
          return new Promise((resolve) => {
            existingScript.addEventListener('load', () => resolve(true));
            existingScript.addEventListener('error', () => resolve(false));
          });
        }

        return new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
          
          setTimeout(() => {
            if (!window.Razorpay) {
              resolve(false);
            }
          }, 5000);
        });
      };

      const isRazorpayReady = await loadRazorpayScript();
      if (!isRazorpayReady) {
        alert('Payment system not available. Please try again later.');
        return;
      }

      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        alert('Please log in to purchase credits.');
        return;
      }

      // Create order
      const orderResponse = await fetch('/api/purchase-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ packageId })
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        alert(errorData.message || 'Failed to create payment order');
        return;
      }

      const orderData = await orderResponse.json();

      // Initialize Razorpay checkout
      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: orderData.orderId,
        name: 'Web Audit Pro',
        description: `Purchase ${orderData.credits} Image Scan Credits`,
        image: '/logo.png',
        prefill: {
          name: userProfile.first_name && userProfile.last_name 
            ? `${userProfile.first_name} ${userProfile.last_name}` 
            : 'Customer',
          email: userProfile.email,
        },
        notes: {
          credits: orderData.credits.toString(),
          packageId: orderData.packageId || packageId.toString(),
          payment_type: 'credit_purchase'
        },
        theme: {
          color: '#000000'
        },
        handler: async function(response: any) {
          try {
            // Call success API
            const successResponse = await fetch('/api/credit-purchase-success', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                packageId: orderData.packageId || packageId,
                credits: orderData.credits,
                amount: orderData.amount / 100, // Convert from paise
                currency: orderData.currency
              })
            });

            if (successResponse.ok) {
              const successData = await successResponse.json();
              alert(`Success! ${successData.creditsAdded} credits have been added to your account.`);
              // Refresh plan info to get updated credits
              window.dispatchEvent(new Event('planUpdated'));
              fetchPaymentHistory();
            } else {
              const errorData = await successResponse.json();
              alert(errorData.message || 'Payment successful but credits could not be added. Please contact support.');
            }
          } catch (error) {
            console.error('Error processing credit purchase:', error);
            alert('Payment successful but there was an error adding credits. Please contact support with payment ID: ' + response.razorpay_payment_id);
          }
        },
        modal: {
          ondismiss: function() {
            setPurchasingPackage(null);
          }
        }
      });

      razorpay.open();
    } catch (error) {
      console.error('Error purchasing credits:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setPurchasingPackage(null);
    }
  };

  // Fetch payment history and check plan expiry on mount
  useEffect(() => {
    // Only fetch if user is authenticated
    if (userProfile?.id) {
      fetchPaymentHistory();
      checkPlanExpiryStatus();
      fetchCreditPackages();
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
      {planExpiryStatus && planExpiryStatus.expires_at && <motion.div className={`rounded-lg border p-4 mb-6 ${planExpiryStatus.is_expired ? 'bg-red-50 border-red-200' : planExpiryStatus.days_until_expiry && planExpiryStatus.days_until_expiry <= 7 ? 'bg-yellow-50 border-yellow-200' : 'bg-[#ff4b01]/10 border-[#ff4b01]/30'}`} initial={{
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
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${planExpiryStatus.is_expired ? 'bg-red-100' : planExpiryStatus.days_until_expiry && planExpiryStatus.days_until_expiry <= 7 ? 'bg-yellow-100' : 'bg-[#ff4b01]/20'}`}>
              <span className={`text-lg ${planExpiryStatus.is_expired ? 'text-red-600' : planExpiryStatus.days_until_expiry && planExpiryStatus.days_until_expiry <= 7 ? 'text-yellow-600' : 'text-[#ff4b01]'}`}>
                {planExpiryStatus.is_expired ? '⚠️' : '⏰'}
              </span>
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${planExpiryStatus.is_expired ? 'text-red-800' : planExpiryStatus.days_until_expiry && planExpiryStatus.days_until_expiry <= 7 ? 'text-yellow-800' : 'text-[#ff4b01]'}`}>
                {planExpiryStatus.is_expired ? 'Plan Expired' : planExpiryStatus.days_until_expiry && planExpiryStatus.days_until_expiry <= 7 ? 'Plan Expiring Soon' : 'Plan Status'}
              </h3>
              <p className={`text-sm ${planExpiryStatus.is_expired ? 'text-red-700' : planExpiryStatus.days_until_expiry && planExpiryStatus.days_until_expiry <= 7 ? 'text-yellow-700' : 'text-[#ff4b01]'}`}>
                {planExpiryStatus.is_expired ? 'Your plan has expired and you have been downgraded to the Starter plan.' : planExpiryStatus.days_until_expiry ? `Your plan expires in ${planExpiryStatus.days_until_expiry} day${planExpiryStatus.days_until_expiry === 1 ? '' : 's'} on ${new Date(planExpiryStatus.expires_at!).toLocaleDateString()}.` : `Your plan expires on ${new Date(planExpiryStatus.expires_at!).toLocaleDateString()}.`}
              </p>
            </div>
          </div>
        </motion.div>}

      {/* Current Plan Usage */}
      {/* <motion.div className="bg-white rounded-lg border border-gray-200 p-6" initial={{
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
          <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-[#ff4b01]/20 text-[#ff4b01]">
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
                  <motion.div className="bg-[#ff4b01] h-2 rounded" initial={{
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
                  <motion.div className="bg-[#ff4b01] h-2 rounded" initial={{
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
      </motion.div> */}

      
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
      
      {/* Image Scan Credits Section - Only show if user has Image_scane feature */}
      {hasImageScanFeature && (
        <motion.div className="bg-white rounded-lg border border-gray-200 p-6" initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.5,
          delay: 0.15
        }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-black">Image Scan Credits</h2>
              <p className="text-sm text-gray-600 mt-1">
                Credits used for reverse image search scans. Each scan costs 1 credit.
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-black">
                {planInfo?.image_scan_credits ?? 0}
              </div>
              <p className="text-sm text-gray-500">Available Credits</p>
            </div>
          </div>

          {loadingPackages ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ff4b01] mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading credit packages...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {creditPackages.map((pkg, index) => (
                <motion.div
                  key={pkg.id || index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-[#ff4b01]/30 hover:shadow-md transition-all"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-black">{pkg.label}</h3>
                    <span className="text-xs text-gray-500">${pkg.pricePerCredit}/credit</span>
                  </div>
                  <p className="text-2xl font-bold text-[#ff4b01] mb-3">${pkg.price}</p>
                  <button
                    onClick={() => handlePurchaseCredits(pkg.id || index)}
                    disabled={purchasingPackage === (pkg.id || index)}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-[#ff4b01] rounded-md hover:bg-[#e64401] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {purchasingPackage === (pkg.id || index) ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </span>
                    ) : (
                      `Purchase ${pkg.label}`
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

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
                      {payment.currency === 'INR' ? '$' : '$'}{payment.amount}
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
                      {payment.subscription_status && <span className="px-2 py-1 rounded text-xs font-medium bg-[#ff4b01]/20 text-[#ff4b01]">
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

                {/* Plan Details - Show different info for credit purchases */}
                {payment.plan_type === 'Credits' ? (
                  <div className="border-t border-gray-100 pt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Purchase Type</p>
                        <p className="font-medium text-black">
                          {payment.plan_name}
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
                ) : (
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
                )}
              </motion.div>)}
          </div>}
      </motion.div>
    </motion.div>;
}
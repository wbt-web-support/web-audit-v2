'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

// Default fallback plans (minimal fallback)

const defaultPlans = [{
  id: 'starter-free',
  name: 'Starter',
  price: 'Free',
  period: 'forever',
  description: 'Perfect for personal projects and small websites',
  features: ['Up to 5 audits per month', 'Basic SEO analysis', 'Performance metrics', 'Security scan', 'Mobile responsiveness check', 'Email support'],
  cta: 'Get Started Free',
  popular: false,
  color: 'gray',
  amount: 0,
  currency: 'INR',
  plan_type: 'Starter',
  billing_cycle: 'monthly',
  max_projects: 5,
  can_use_features: ['basic_seo', 'performance', 'security', 'mobile_check'],
  razorpay_plan_id: null,
  isCurrentPlan: false
}];
interface PricingSectionProps {
  currentPlanType?: string;
  currentPlanId?: string;
  currentBillingCycle?: string;
  planExpiresAt?: string;
  showBillingToggle?: boolean;
  showCurrentPlanHighlight?: boolean;
  className?: string;
}
export default function PricingSection({
  currentPlanType,
  currentPlanId,
  currentBillingCycle,
  planExpiresAt,
  showBillingToggle = true,
  showCurrentPlanHighlight = false,
  className = ""
}: PricingSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: "-100px"
  });
  const [loading, setLoading] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [plans, setPlans] = useState(defaultPlans);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Memoized feature extraction for better performance
  const extractFeatureText = useCallback((feature: unknown): string => {
    if (typeof feature === 'string') {
      const trimmed = feature.trim();
      const looksLikeJson = trimmed.startsWith('{') && trimmed.endsWith('}') || trimmed.startsWith('[') && trimmed.endsWith(']');
      if (looksLikeJson) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === 'object' && 'name' in parsed) {
            return String((parsed as {
              name?: string;
            }).name ?? '');
          }
        } catch {
          // Fall through to return original string
        }
      }
      return feature;
    }
    if (typeof feature === 'object' && feature !== null && 'name' in feature) {
      return String((feature as {
        name?: string;
      }).name ?? '');
    }
    return '';
  }, []);

  // Lazy load Razorpay script only when needed

  const loadRazorpayScript = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    if (window.Razorpay) return true;

    // Check if script is already being loaded

    const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existingScript) {
      return new Promise(resolve => {
        existingScript.addEventListener('load', () => resolve(true));
        existingScript.addEventListener('error', () => resolve(false));
      });
    }
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        resolve(true);
      };
      script.onerror = error => {
        console.error('Failed to load Razorpay script:', error);
        resolve(false);
      };

      // Reduced timeout for faster failure detection

      setTimeout(() => {
        if (!window.Razorpay) {
          console.error('Razorpay script loading timeout');
          resolve(false);
        }
      }, 5000); // 5 second timeout

      document.body.appendChild(script);
    });
  };

  // Fetch plans from database with optimized loading

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);

        // First, set default plans immediately for faster initial render

        setPlans(defaultPlans);
        const response = await fetch('/api/plans');
        if (response.ok) {
          const data = await response.json();
          if (data.plans && data.plans.length > 0) {
            // Transform database plans to match component format

            const transformedPlans = data.plans.map((plan: any) => ({
              id: plan.id,
              name: plan.name,
              price: plan.price === 0 ? 'Free' : plan.currency === 'INR' ? `₹${plan.price.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}` : `$${plan.price.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`,
              period: plan.billing_cycle === 'monthly' ? 'per month' : plan.billing_cycle === 'yearly' ? 'per year' : 'per ' + plan.billing_cycle,
              description: plan.description || '',
              features: plan.features ? plan.features.map((feature: unknown) => extractFeatureText(feature)) : [],
              cta: plan.plan_type === 'Starter' ? 'Get Started Free' : plan.planStatus === 'current' ? 'Current Plan' : plan.planStatus === 'billing_change' ? `Switch to ${plan.billing_cycle}` : plan.planStatus === 'upgrade_downgrade' ? plan.amount > (plans.find(p => p.plan_type === currentPlanType)?.amount || 0) ? 'Upgrade' : 'Downgrade' : 'Get Plan',
              popular: plan.is_popular || false,
              color: plan.color || 'gray',
              amount: plan.price,
              currency: plan.currency,
              plan_type: plan.plan_type,
              billing_cycle: plan.billing_cycle,
              max_projects: plan.max_projects,
              can_use_features: plan.can_use_features || [],
              razorpay_plan_id: plan.razorpay_plan_id,
              subscription_id: plan.subscription_id,
              isCurrentPlan: showCurrentPlanHighlight && currentPlanType && plan.plan_type === currentPlanType
            }));

            // Update plans with database data (no need for Razorpay plans API)

            setPlans(transformedPlans);
          } else {
            setPlans(defaultPlans);
          }
        } else {
          console.error('Failed to fetch database plans, using fallback');
          setPlans(defaultPlans);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        setPlans(defaultPlans);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  // Function to check if a plan can be purchased
  const canPurchasePlan = useCallback((plan: any) => {
    // Always allow free plan
    if (plan.plan_type === 'Starter') return true;

    // If no current plan, allow any plan
    if (!currentPlanType) return true;

    // If current plan is Starter, allow any paid plan
    if (currentPlanType === 'Starter') return true;

    // Check if plan has expired
    const isPlanExpired = planExpiresAt ? new Date(planExpiresAt) < new Date() : false;

    // If plan has expired, allow any plan
    if (isPlanExpired) return true;

    // If same plan type and same billing cycle, don't allow (user is already on this exact plan)
    if (plan.plan_type === currentPlanType && plan.billing_cycle === currentBillingCycle) {
      return false;
    }

    // If same plan type but different billing cycle, allow (monthly to yearly or vice versa)
    if (plan.plan_type === currentPlanType && plan.billing_cycle !== currentBillingCycle) {
      return true;
    }

    // If different plan type, allow (upgrade or downgrade)
    if (plan.plan_type !== currentPlanType) {
      return true;
    }

    // Default: allow the plan
    return true;
  }, [currentPlanType, currentBillingCycle, planExpiresAt]);

  // Function to get plan status
  const getPlanStatus = useCallback((plan: any) => {
    if (plan.plan_type === 'Starter') return 'available';
    if (!currentPlanType) return 'available';
    if (currentPlanType === 'Starter') return 'available';
    
    const isPlanExpired = planExpiresAt ? new Date(planExpiresAt) < new Date() : false;
    if (isPlanExpired) return 'available';
    
    // If same plan type and same billing cycle, it's the current plan
    if (plan.plan_type === currentPlanType && plan.billing_cycle === currentBillingCycle) {
      return 'current';
    }
    
    // If same plan type but different billing cycle, it's a billing change
    if (plan.plan_type === currentPlanType && plan.billing_cycle !== currentBillingCycle) {
      return 'billing_change';
    }
    
    // If different plan type, it's an upgrade or downgrade
    if (plan.plan_type !== currentPlanType) {
      return 'upgrade_downgrade';
    }
    
    return 'available';
  }, [currentPlanType, currentBillingCycle, planExpiresAt]);

  // Memoized filtered plans for better performance
  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      if (plan.plan_type === 'Starter') return true; // Always show free plan
      return plan.billing_cycle === billingCycle;
    }).map(plan => ({
      ...plan,
      canPurchase: canPurchasePlan(plan),
      planStatus: getPlanStatus(plan)
    })).sort((a, b) => {
      // Always put Starter plan first
      if (a.plan_type === 'Starter') return -1;
      if (b.plan_type === 'Starter') return 1;

      // Then sort by price (ascending)
      return a.amount - b.amount;
    });
  }, [plans, billingCycle, canPurchasePlan, getPlanStatus]);
  const handlePayment = async (plan: any) => {
    // Check if plan can be purchased
    if (!plan.canPurchase) {
      if (plan.planStatus === 'current') {
        alert('You are already on this plan!');
        return;
      }
      alert('This plan is not available for purchase at this time.');
      return;
    }

    // Handle free plan
    if (plan.plan_type === 'Starter' || plan.amount === 0) {
      alert('Free plan selected! No payment required.');
      return;
    }
    setLoading(plan.id);
    setPaymentSuccess(null);
    try {
      // Ensure Razorpay checkout is available

      const isRazorpayReady = await loadRazorpayScript();
      if (!isRazorpayReady) {
        alert('Payment system not available. Please try again later.');
        return;
      }
      // Validate plan amount
      if (!plan.amount || plan.amount <= 0) {
        throw new Error('Invalid plan amount. Please contact support.');
      }

      // Create order using the create-order API (supports all payment methods)
      const orderData = {
        amount: Math.round(plan.amount * 100),
        // Convert to paise and ensure integer
        currency: plan.currency || 'INR',
        receipt: `rec_${Date.now()}`,
        // Shortened receipt (max 40 chars)
        plan_id: plan.id
      };
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        console.error('Order creation failed:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to create payment order');
      }
      const orderResponseData = await orderResponse.json();
      // Initialize Razorpay with order data (supports all payment methods)
      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: orderResponseData.id,
        name: 'Web Audit Pro',
        description: `${plan.name} Plan - ${plan.billing_cycle} subscription`,
        image: '/logo.png',
        // Add your logo path

        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          emi: true,
          paylater: true
        },
        prefill: {
          name: 'Customer',
          email: 'customer@example.com',
          contact: '9999999999'
        },
        notes: {
          plan_name: plan.name,
          plan_type: plan.plan_type,
          billing_cycle: plan.billing_cycle,
          plan_id: plan.id
        },
        theme: {
          color: '#000000'
        },
        config: {
          display: {
            hide: []
          }
        },
        handler: async function (response: any) {
          setPaymentSuccess(response.razorpay_payment_id);
          try {
            // Get current session for authentication
            const {
              data: {
                session
              }
            } = await supabase.auth.getSession();
            const authToken = session?.access_token;
            // Get current user info for the API call
            const {
              data: {
                user: currentUser
              }
            } = await supabase.auth.getUser();

            // Call payment success API to update user plan
            const successResponse = await fetch('/api/payment-success', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(authToken && {
                  'Authorization': `Bearer ${authToken}`
                })
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                plan_id: plan.id,
                amount: plan.amount,
                currency: plan.currency,
                payment_method: response.method || 'unknown',
                subscription_id: plan.subscription_id,
                user_id: currentUser?.id,
                user_email: currentUser?.email
              })
            });
            if (successResponse.ok) {
              const successData = await successResponse.json();
              // Check if the response has the expected structure
              if (successData.success && successData.plan_details) {
                alert(`Payment successful! You are now on the ${successData.plan_details.plan_name} plan.`);

                // Trigger multiple refresh mechanisms

                window.dispatchEvent(new CustomEvent('planUpdated'));
                localStorage.setItem('plan_updated', 'true');

                // Wait a bit longer to ensure database update is complete

                setTimeout(() => {
                  window.location.reload();
                }, 3000);
              } else {
                console.warn('Unexpected response structure:', successData);
                alert('Payment successful! Your plan has been updated.');

                // Still trigger plan refresh even if response structure is unexpected

                window.dispatchEvent(new CustomEvent('planUpdated'));
                localStorage.setItem('plan_updated', 'true');

                // Wait a bit longer to ensure database update is complete

                setTimeout(() => {
                  window.location.reload();
                }, 3000);
              }
            } else {
              const errorData = await successResponse.json();
              console.error('Payment processing failed:', errorData);
              console.error('Response status:', successResponse.status);
              console.error('Response headers:', Object.fromEntries(successResponse.headers.entries()));
              alert(`Payment successful but plan update failed: ${errorData.error || 'Unknown error'}. Please contact support.`);
            }
          } catch (apiError) {
            console.error('Error calling payment success API:', apiError);
            alert('Payment successful but plan update failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(null);
          }
        }
      });
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);

      // Try fallback approach with direct payment
      try {
        // Fallback: Create direct payment without order
        const razorpay = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: Math.round(plan.amount * 100),
          currency: plan.currency || 'INR',
          name: 'Web Audit Pro',
          description: `${plan.name} Plan - ${plan.billing_cycle} subscription`,
          image: '/logo.png',
          method: {
            upi: true,
            card: true,
            netbanking: true,
            wallet: true,
            emi: true,
            paylater: true
          },
          prefill: {
            name: 'Customer',
            email: 'customer@example.com',
            contact: '9999999999'
          },
          notes: {
            plan_name: plan.name,
            plan_type: plan.plan_type,
            billing_cycle: plan.billing_cycle,
            plan_id: plan.id
          },
          theme: {
            color: '#000000'
          },
          handler: async function (response: any) {
            setPaymentSuccess(response.razorpay_payment_id);
            try {
              // Get current user info for the API call
              const {
                data: {
                  user: currentUser
                }
              } = await supabase.auth.getUser();

              // Call payment success API to update user plan
              const successResponse = await fetch('/api/payment-success', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  plan_id: plan.id,
                  amount: plan.amount,
                  currency: plan.currency,
                  payment_method: response.method || 'unknown',
                  subscription_id: plan.subscription_id,
                  user_id: currentUser?.id,
                  user_email: currentUser?.email
                })
              });
              if (successResponse.ok) {
                const successData = await successResponse.json();
                alert(`Payment successful! You are now on the ${successData.plan_details.plan_name} plan.`);

                // Trigger multiple refresh mechanisms

                window.dispatchEvent(new CustomEvent('planUpdated'));
                localStorage.setItem('plan_updated', 'true');

                // Wait a bit longer to ensure database update is complete

                setTimeout(() => {
                  window.location.reload();
                }, 3000);
              } else {
                const errorData = await successResponse.json();
                console.error('Fallback payment processing failed:', errorData);
                alert('Payment successful but plan update failed. Please contact support.');
              }
            } catch (apiError) {
              console.error('Error calling payment success API for fallback:', apiError);
              alert('Payment successful but plan update failed. Please contact support.');
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(null);
            }
          }
        });
        razorpay.open();
        return; // Exit early if fallback succeeds
      } catch (fallbackError) {
        console.error('Fallback payment also failed:', fallbackError);
        alert('Payment failed: ' + (error as Error).message + '\n\nPlease try again or contact support.');
      }
    } finally {
      setLoading(null);
    }
  };
  return <section id="pricing" ref={ref} className={`py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}

        <motion.div initial={{
        opacity: 0,
        y: 50
      }} animate={isInView ? {
        opacity: 1,
        y: 0
      } : {
        opacity: 0,
        y: 50
      }} transition={{
        duration: 0.8
      }} className="text-center mb-16">

          <h2 className="text-4xl md:text-6xl font-bold text-black mb-6">

            Simple, Transparent Pricing

          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">

            Choose the plan that fits your needs. No hidden fees, no surprises.

          </p>

          

          {/* Billing Cycle Toggle */}

          {showBillingToggle && <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={isInView ? {
          opacity: 1,
          y: 0
        } : {
          opacity: 0,
          y: 20
        }} transition={{
          duration: 0.6,
          delay: 0.2
        }} className="flex items-center justify-center space-x-4 mb-8">

            <span className={`text-lg font-medium ${billingCycle === 'monthly' ? 'text-black' : 'text-gray-500'}`}>

              Monthly

            </span>

            <button onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')} className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-200 ${billingCycle === 'yearly' ? 'bg-black' : 'bg-gray-300'}`}>

              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 ${billingCycle === 'yearly' ? 'translate-x-9' : 'translate-x-1'}`} />

            </button>

            <span className={`text-lg font-medium ${billingCycle === 'yearly' ? 'text-black' : 'text-gray-500'}`}>

              Yearly

            </span>

            {billingCycle === 'yearly' && <motion.span initial={{
            opacity: 0,
            scale: 0.8
          }} animate={{
            opacity: 1,
            scale: 1
          }} className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">

                Save 17%

              </motion.span>}

          </motion.div>}
        </motion.div>



        {/* Pricing Cards */}

        <div className={`grid grid-cols-1 gap-6 max-w-6xl mx-auto ${filteredPlans.length === 1 ? 'md:grid-cols-1 max-w-md' : filteredPlans.length === 2 ? 'md:grid-cols-2' : filteredPlans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'}`}>

          {loadingPlans ?
        // Loading skeleton

        Array.from({
          length: filteredPlans.length || 3
        }).map((_, index) => <div key={index} className="bg-white rounded-3xl p-8  animate-pulse">

                <div className="h-8 bg-gray-200 rounded mb-4"></div>

                <div className="h-12 bg-gray-200 rounded mb-4"></div>

                <div className="h-4 bg-gray-200 rounded mb-2"></div>

                <div className="h-4 bg-gray-200 rounded mb-8"></div>

                <div className="h-12 bg-gray-200 rounded"></div>

              </div>) : filteredPlans.map((plan, index) => <motion.div key={plan.id || `${plan.name}_${plan.billing_cycle}_${index}`} initial={{
          opacity: 0,
          y: 50
        }} animate={isInView ? {
          opacity: 1,
          y: 0
        } : {
          opacity: 0,
          y: 50
        }} transition={{
          duration: 0.6,
          delay: index * 0.2
        }} whileHover={{
          y: -10
        }} className={`relative rounded-3xl p-8 ${plan.popular && plan.billing_cycle === billingCycle ? 'bg-black text-white  scale-105' : 'bg-white text-black '} border-2 ${plan.popular && plan.billing_cycle === billingCycle ? 'border-black' : 'border-gray-200'}`}>

              {/* Popular Badge */}

              {plan.popular && plan.billing_cycle === billingCycle && <motion.div initial={{
            scale: 0
          }} animate={isInView ? {
            scale: 1
          } : {
            scale: 0
          }} transition={{
            duration: 0.5,
            delay: index * 0.2 + 0.3
          }} className="absolute -top-4 left-1/2 transform -translate-x-1/2">

                  <span className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold ">

                    Most Popular

                  </span>

                </motion.div>}


              {/* Current Plan Badge */}
              {plan.planStatus === 'current' && <motion.div initial={{
            scale: 0
          }} animate={isInView ? {
            scale: 1
          } : {
            scale: 0
          }} transition={{
            duration: 0.5,
            delay: index * 0.2 + 0.3
          }} className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gray-600 text-white px-4 py-2 rounded-full text-sm font-semibold ">
                    Current Plan
                  </span>
                </motion.div>}

              {/* Billing Change Badge */}
              {plan.planStatus === 'billing_change' && <motion.div initial={{
            scale: 0
          }} animate={isInView ? {
            scale: 1
          } : {
            scale: 0
          }} transition={{
            duration: 0.5,
            delay: index * 0.2 + 0.3
          }} className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gray-600 text-white px-4 py-2 rounded-full text-sm font-semibold ">
                    Switch Billing
                  </span>
                </motion.div>}

              {/* Upgrade/Downgrade Badge */}
              {plan.planStatus === 'upgrade_downgrade' && <motion.div initial={{
            scale: 0
          }} animate={isInView ? {
            scale: 1
          } : {
            scale: 0
          }} transition={{
            duration: 0.5,
            delay: index * 0.2 + 0.3
          }} className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gray-600 text-white px-4 py-2 rounded-full text-sm font-semibold ">
                    {plan.amount > (plans.find(p => p.plan_type === currentPlanType)?.amount || 0) ? 'Upgrade' : 'Downgrade'}
                  </span>
                </motion.div>}


              {/* Plan Header */}

              <div className="text-center mb-8">

                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>

                <div className="mb-4">

                  <span className="text-5xl font-bold">{plan.price}</span>

                  {plan.plan_type !== 'Starter' && <span className={`text-lg ml-2 ${plan.popular && plan.billing_cycle === billingCycle ? 'text-gray-300' : 'text-gray-500'}`}>

                      {plan.period}

                    </span>}

                </div>

                <p className={`text-sm ${plan.popular && plan.billing_cycle === billingCycle ? 'text-gray-300' : 'text-gray-600'}`}>

                  {plan.description}

                </p>

              </div>



              {/* Features List */}

              <ul className="space-y-4 mb-8">

                {plan.features.map((feature: unknown, featureIndex: number) => {
              const featureText = extractFeatureText(feature);
              return <motion.li key={featureIndex} initial={{
                opacity: 0,
                x: -20
              }} animate={isInView ? {
                opacity: 1,
                x: 0
              } : {
                opacity: 0,
                x: -20
              }} transition={{
                duration: 0.4,
                delay: index * 0.2 + featureIndex * 0.1 + 0.5
              }} className="flex items-start">

                      <span className={`text-lg mr-3 ${plan.popular && plan.billing_cycle === billingCycle ? 'text-white' : 'text-black'}`}>✓</span>

                      <span className={`text-sm ${plan.popular && plan.billing_cycle === billingCycle ? 'text-gray-300' : 'text-gray-600'}`}>

                        {featureText}

                      </span>

                    </motion.li>;
            })}

              </ul>



              {/* CTA Button */}

              <motion.button whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }} initial={{
            opacity: 0,
            y: 20
          }} animate={isInView ? {
            opacity: 1,
            y: 0
          } : {
            opacity: 0,
            y: 20
          }} transition={{
            duration: 0.5,
            delay: index * 0.2 + 0.8
          }} onClick={() => handlePayment(plan)} disabled={loading === plan.id || !plan.canPurchase} className={`w-full py-4 rounded-lg font-semibold transition-all duration-300 ${plan.popular && plan.billing_cycle === billingCycle ? 'bg-white text-black hover:bg-gray-100 disabled:bg-gray-300' : plan.planStatus === 'current' ? 'bg-gray-500 text-white cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800 disabled:bg-gray-500'}`}>

                {loading === plan.id ? 'Processing...' : plan.cta}

              </motion.button>



              {/* Payment Success Message */}

              {paymentSuccess && plan.plan_type !== 'Starter' && <motion.div initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">

                  <p className="text-green-800 text-sm text-center">

                    ✅ Payment successful! ID: {paymentSuccess}

                  </p>

                </motion.div>}

            </motion.div>)}

        </div>



     

      </div>

    </section>;
}
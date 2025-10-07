'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

// Default fallback plans (minimal fallback)
const defaultPlans = [
  {
    id: 'starter-free',
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    description: 'Perfect for personal projects and small websites',
    features: [
      'Up to 5 audits per month',
      'Basic SEO analysis',
      'Performance metrics',
      'Security scan',
      'Mobile responsiveness check',
      'Email support'
    ],
    cta: 'Get Started Free',
    popular: false,
    color: 'gray',
    amount: 0,
    currency: 'INR',
    plan_type: 'Starter',
    billing_cycle: 'monthly',
    max_projects: 5,
    can_use_features: ['basic_seo', 'performance', 'security', 'mobile_check'],
    razorpay_plan_id: null
  }
];

export default function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [loading, setLoading] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [plans, setPlans] = useState(defaultPlans);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const extractFeatureText = (feature: unknown): string => {
    if (typeof feature === 'string') {
      const trimmed = feature.trim();
      const looksLikeJson = (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'));
      if (looksLikeJson) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === 'object' && 'name' in parsed) {
            return String((parsed as { name?: string }).name ?? '');
          }
        } catch {
          // Fall through to return original string
        }
      }
      return feature;
    }
    if (typeof feature === 'object' && feature !== null && 'name' in feature) {
      return String((feature as { name?: string }).name ?? '');
    }
    return '';
  };

  // Fetch plans from database
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const response = await fetch('/api/plans');
        
        if (response.ok) {
          const data = await response.json();
          console.log('Database plans loaded:', data.plans?.length || 0, 'plans');
          
          if (data.plans && data.plans.length > 0) {
            // Transform database plans to match component format
            const transformedPlans = data.plans.map((plan: any) => ({
              id: plan.id,
              name: plan.name,
              price: plan.price === 0 ? 'Free' : 
                     plan.currency === 'INR' ? 
                     `₹${plan.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
                     `$${plan.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              period: plan.billing_cycle === 'monthly' ? 'per month' : 
                      plan.billing_cycle === 'yearly' ? 'per year' : 
                      'per ' + plan.billing_cycle,
              description: plan.description || '',
              features: plan.features ? plan.features.map((feature: unknown) => extractFeatureText(feature)) : [],
              cta: plan.plan_type === 'Starter' ? 'Get Started Free' :
                   plan.plan_type === 'Scale' ? 'Start Scale Trial' : 'Start Growth Trial',
              popular: plan.is_popular || false, // Use database popular flag
              color: plan.color || 'gray',
              amount: plan.price, // Keep original price for calculations
              currency: plan.currency,
              plan_type: plan.plan_type,
              billing_cycle: plan.billing_cycle,
              max_projects: plan.max_projects,
              can_use_features: plan.can_use_features || [],
              razorpay_plan_id: plan.razorpay_plan_id
            }));
            
            setPlans(transformedPlans);
          } else {
            console.log('No plans found in database, using fallback');
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

  // Filter plans based on billing cycle and sort to keep free plan first
  const filteredPlans = plans
    .filter(plan => {
      if (plan.plan_type === 'Starter') return true; // Always show free plan
      return plan.billing_cycle === billingCycle;
    })
    .sort((a, b) => {
      // Always put Starter plan first
      if (a.plan_type === 'Starter') return -1;
      if (b.plan_type === 'Starter') return 1;
      
      // Then sort by price (ascending)
      return a.amount - b.amount;
    });

  const handlePayment = async (plan: any) => {
    // Handle free plan
    if (plan.plan_type === 'Starter' || plan.amount === 0) {
      alert('Free plan selected! No payment required.');
      return;
    }
    
    setLoading(plan.id);
    setPaymentSuccess(null);
    
    try {
      // Simple payment handling - redirect to payment page or show contact info
      if (plan.plan_type === 'Scale') {
        alert('Please contact our sales team for custom pricing.');
        return;
      }
      
      // For Growth plans, show contact information or redirect to payment
      alert(`Selected ${plan.name} plan. Please contact us to complete your subscription.`);
      
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed: ' + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <section id="pricing" ref={ref} className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-black mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose the plan that fits your needs. No hidden fees, no surprises.
          </p>
          
          {/* Billing Cycle Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center space-x-4 mb-8"
          >
            <span className={`text-lg font-medium ${billingCycle === 'monthly' ? 'text-black' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-200 ${
                billingCycle === 'yearly' ? 'bg-black' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 ${
                  billingCycle === 'yearly' ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-lg font-medium ${billingCycle === 'yearly' ? 'text-black' : 'text-gray-500'}`}>
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full"
              >
                Save 17%
              </motion.span>
            )}
          </motion.div>
        </motion.div>

        {/* Pricing Cards */}
        <div className={`grid grid-cols-1 gap-6 max-w-6xl mx-auto ${
          filteredPlans.length === 1 ? 'md:grid-cols-1 max-w-md' :
          filteredPlans.length === 2 ? 'md:grid-cols-2' :
          filteredPlans.length === 3 ? 'md:grid-cols-3' :
          'md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {loadingPlans ? (
            // Loading skeleton
            Array.from({ length: filteredPlans.length || 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-3xl p-8 shadow-lg animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-8"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : (
            filteredPlans.map((plan, index) => (
            <motion.div
              key={plan.id || `${plan.name}_${plan.billing_cycle}_${index}`}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ y: -10 }}
              className={`relative rounded-3xl p-8 ${
                (plan.popular && plan.billing_cycle === billingCycle)
                  ? 'bg-black text-white shadow-2xl scale-105' 
                  : 'bg-white text-black shadow-lg'
              } border-2 ${
                (plan.popular && plan.billing_cycle === billingCycle) 
                  ? 'border-black' 
                  : 'border-gray-200'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && plan.billing_cycle === billingCycle && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : { scale: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                >
                  <span className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </span>
                </motion.div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  {plan.plan_type !== 'Starter' && (
                    <span className={`text-lg ml-2 ${
                      (plan.popular && plan.billing_cycle === billingCycle) ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className={`text-sm ${
                  (plan.popular && plan.billing_cycle === billingCycle) ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {plan.description}
                </p>
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature: unknown, featureIndex: number) => {
                  const featureText = extractFeatureText(feature);

                  return (
                    <motion.li
                      key={featureIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                      transition={{ duration: 0.4, delay: index * 0.2 + featureIndex * 0.1 + 0.5 }}
                      className="flex items-start"
                    >
                      <span className={`text-lg mr-3 ${
                        (plan.popular && plan.billing_cycle === billingCycle) ? 'text-white' : 'text-black'
                      }`}>✓</span>
                      <span className={`text-sm ${
                        (plan.popular && plan.billing_cycle === billingCycle) ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {featureText}
                      </span>
                    </motion.li>
                  );
                })}
              </ul>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: index * 0.2 + 0.8 }}
                onClick={() => handlePayment(plan)}
                disabled={loading === plan.id}
                className={`w-full py-4 rounded-lg font-semibold transition-all duration-300 ${
                  (plan.popular && plan.billing_cycle === billingCycle)
                    ? 'bg-white text-black hover:bg-gray-100 disabled:bg-gray-300'
                    : 'bg-black text-white hover:bg-gray-800 disabled:bg-gray-500'
                }`}
              >
                {loading === plan.id ? 'Processing...' : plan.cta}
              </motion.button>

              {/* Payment Success Message */}
              {paymentSuccess && plan.plan_type !== 'Starter' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <p className="text-green-800 text-sm text-center">
                    ✅ Payment successful! ID: {paymentSuccess}
                  </p>
                </motion.div>
              )}
            </motion.div>
            ))
          )}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16"
        >
          <p className="text-gray-600 mb-6">
            All plans include 14-day free trial. No credit card required.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 border-2 border-black text-black font-semibold rounded-lg hover:bg-black hover:text-white transition-all duration-300"
          >
            Compare All Features
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

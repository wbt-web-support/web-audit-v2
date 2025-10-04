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

// Default fallback plans
const defaultPlans = [
  {
    id: 'Starter',
    name: 'Starter',
    price: '$0',
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
    currency: 'USD',
    plan_type: 'Starter'
  }
];

export default function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [loading, setLoading] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [plans, setPlans] = useState(defaultPlans);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Fetch plans from database on component mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // First try to fetch from database
        const response = await fetch('/api/plans');
        if (response.ok) {
          const data = await response.json();
          console.log('Database plans loaded:', data.plans?.length || 0, 'plans');
          
          // Transform database plans to match component format
          const transformedPlans = data.plans.map((plan: { id: string; name: string; plan_type: string; price: number; interval_type: string; description: string; features: Array<{ name: string }>; currency?: string; amount?: number; is_popular?: boolean; color?: string; razorpay_plan_id?: string }) => ({
            id: plan.id,
            name: plan.name,
            price: (plan.amount || plan.price) === 0 ? 'Free' : 
                   plan.currency === 'INR' ? 
                   `₹${Math.round((plan.amount || plan.price) / 100).toLocaleString()}` : 
                   `$${Math.round((plan.amount || plan.price) / 100).toLocaleString()}`,
            period: plan.interval_type === 'monthly' ? 'per month' : 
                    plan.interval_type === 'yearly' ? 'per year' : 
                    plan.interval_type === 'weekly' ? 'per week' : 
                    plan.interval_type === 'daily' ? 'per day' : 'per ' + plan.interval_type,
            description: plan.description,
            features: plan.features.map((f: { name: string }) => f.name),
            cta: plan.plan_type === 'Starter' ? 'Get Started Free' :
                 plan.plan_type === 'Scale' ? 'Contact Sales' : 'Start Growth Trial',
            popular: plan.is_popular,
            color: plan.color,
            amount: plan.amount,
            currency: plan.currency,
            plan_type: plan.plan_type,
            razorpay_plan_id: plan.razorpay_plan_id
          }));
          
          setPlans(transformedPlans);
        } else {
          console.error('Failed to fetch database plans, trying Razorpay fallback');
          // Fallback to Razorpay plans
          const razorpayResponse = await fetch('/api/razorpay-plans');
          if (razorpayResponse.ok) {
            const razorpayData = await razorpayResponse.json();
            const allPlans = [...defaultPlans, ...razorpayData.plans];
            const uniquePlans = allPlans.filter((plan, index, self) => 
              index === self.findIndex(p => p.id === plan.id)
            );
            console.log('Razorpay plans loaded:', uniquePlans.map(p => ({ id: p.id, name: p.name, price: p.price })));
            setPlans(uniquePlans);
          } else {
            throw new Error('Both database and Razorpay plans failed');
          }
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        // Set fallback plans on error
        const fallbackPlans = [
          ...defaultPlans,
          {
            id: 'pro_monthly',
            name: 'Pro',
            price: '₹2,900',
            period: 'per month',
            description: 'Ideal for growing businesses and agencies',
            features: [
              'Unlimited audits',
              'Advanced SEO analysis',
              'Core Web Vitals tracking',
              'Brand consistency check',
              'Custom audit rules',
              'Priority support',
              'API access',
              'White-label reports'
            ],
            cta: 'Start Pro Trial',
            popular: true,
            color: 'black',
            amount: 290000,
            currency: 'INR',
            plan_type: 'Growth'
          },
          {
            id: 'Scale',
            name: 'Scale',
            price: 'Custom',
            period: 'contact us',
            description: 'For large organizations with specific needs',
            features: [
              'Everything in Pro',
              'Dedicated account manager',
              'Custom integrations',
              'Advanced security scanning',
              'Team collaboration tools',
              'Custom reporting',
              'SLA guarantee',
              '24/7 phone support'
            ],
            cta: 'Contact Sales',
            popular: false,
            color: 'gray',
            amount: 0,
            currency: 'USD',
            plan_type: 'Scale'
          }
        ];
        setPlans(fallbackPlans);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  const handlePayment = async (plan: { id: string; name: string; amount: number; currency: string; plan_type: string; description?: string; price?: string; period?: string; features?: string[]; cta?: string; popular?: boolean; color?: string; razorpay_plan_id?: string }) => {
    if (plan.id === 'Starter') {
      alert('Free plan selected! No payment required.');
      return;
    }
    
    setLoading(plan.id);
    setPaymentSuccess(null);
    
    try {
      // Try subscription first, fallback to regular payment
      let paymentData;
      
      try {
        // Create subscription for Razorpay plan
        const subscriptionResponse = await fetch('/api/create-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan_id: plan.id,
            customer_details: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '9999999999'
            }
          })
        });

        if (subscriptionResponse.ok) {
          paymentData = await subscriptionResponse.json();
        } else {
          throw new Error('Subscription failed, trying regular payment');
        }
      } catch (subscriptionError) {
        console.log('Subscription failed, using regular payment:', subscriptionError);
        
        // Fallback to regular payment
        const orderResponse = await fetch('/api/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: plan.amount,
            currency: plan.currency,
            receipt: `plan_${plan.id}_${Date.now()}`
          })
        });

        if (!orderResponse.ok) {
          throw new Error('Failed to create order');
        }

        paymentData = await orderResponse.json();
      }

      // Create options based on payment type
      const options: Record<string, unknown> = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXXXXXX',
        name: plan.name,
        description: plan.description || plan.name,
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999'
        },
        notes: {
          plan_id: plan.id,
          plan_name: plan.name,
          source: 'pricing_section'
        },
        theme: {
          color: '#000000'
        },
        // Enable all payment methods
        method: {
          netbanking: true,
          wallet: true,
          emi: true,
          upi: true,
          card: true
        },
        // Enable UPI
        upi: {
          flow: 'collect'
        },
        // Enable wallet options
        wallet: {
          paytm: true,
          phonepe: true,
          gpay: true
        },
        handler: function (response: { razorpay_payment_id: string }) {
          console.log('Payment successful:', response);
          setPaymentSuccess(response.razorpay_payment_id);
          alert(`Payment successful! You now have ${plan.name} access. Payment ID: ${response.razorpay_payment_id}`);
        }
      };

      // Add subscription_id or order_id based on payment type
      if (paymentData.id && paymentData.plan_id) {
        // Subscription payment
        options.subscription_id = paymentData.id;
      } else if (paymentData.id && paymentData.amount) {
        // Regular order payment
        options.order_id = paymentData.id;
        options.amount = paymentData.amount;
        options.currency = paymentData.currency;
      }

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
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
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your needs. No hidden fees, no surprises.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {loadingPlans ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-3xl p-8 shadow-lg animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-8"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : (
            plans.map((plan, index) => (
            <motion.div
              key={plan.id || `${plan.name}_${index}`}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ y: -10 }}
              className={`relative rounded-3xl p-8 ${
                plan.popular 
                  ? 'bg-black text-white shadow-2xl scale-105' 
                  : 'bg-white text-black shadow-lg'
              } border-2 ${
                plan.popular ? 'border-black' : 'border-gray-200'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
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
                  <span className={`text-lg ml-2 ${
                    plan.popular ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm ${
                  plan.popular ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {plan.description}
                </p>
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <motion.li
                    key={featureIndex}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, delay: index * 0.2 + featureIndex * 0.1 + 0.5 }}
                    className="flex items-start"
                  >
                    <span className={`text-lg mr-3 ${
                      plan.popular ? 'text-white' : 'text-black'
                    }`}>✓</span>
                    <span className={`text-sm ${
                      plan.popular ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {feature}
                    </span>
                  </motion.li>
                ))}
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
                  plan.popular
                    ? 'bg-white text-black hover:bg-gray-100 disabled:bg-gray-300'
                    : 'bg-black text-white hover:bg-gray-800 disabled:bg-gray-500'
                }`}
              >
                {loading === plan.id ? 'Processing...' : plan.cta}
              </motion.button>

              {/* Payment Success Message */}
              {paymentSuccess && plan.id !== 'Starter' && (
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

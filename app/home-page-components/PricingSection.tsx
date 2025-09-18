'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const pricingPlans = [
  {
    name: 'Free',
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
    color: 'gray'
  },
  {
    name: 'Pro',
    price: '$29',
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
    color: 'black'
  },
  {
    name: 'Enterprise',
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
    color: 'gray'
  }
];

export default function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
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
                className={`w-full py-4 rounded-lg font-semibold transition-all duration-300 ${
                  plan.popular
                    ? 'bg-white text-black hover:bg-gray-100'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {plan.cta}
              </motion.button>
            </motion.div>
          ))}
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

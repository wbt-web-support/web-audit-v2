'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function CallToActionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 bg-gradient-to-br from-gray-100 via-white to-gray-200 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_24%,rgba(0,0,0,0.1)_25%,rgba(0,0,0,0.1)_26%,transparent_27%,transparent_74%,rgba(0,0,0,0.1)_75%,rgba(0,0,0,0.1)_76%,transparent_77%)] bg-[length:60px_60px]"></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-4 h-4 bg-black/10 rounded-full animate-bounce"></div>
        <div className="absolute top-40 right-32 w-6 h-6 bg-black/5 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute bottom-32 left-1/3 w-3 h-3 bg-black/15 rounded-full animate-bounce delay-2000"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Main CTA Content */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold text-black mb-6">
              Ready to Audit Your Website?
            </h2>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Get instant insights into your website&apos;s performance, security, and SEO. 
              Start your free audit today and discover what&apos;s holding your site back.
            </p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors duration-300  text-lg"
              >
                Start Free Audit
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-4 border-2 border-black text-black font-semibold rounded-lg hover:bg-black hover:text-white transition-all duration-300 text-lg"
              >
                View Pricing
              </motion.button>
            </motion.div>

            {/* Features List */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-row justify-center items-center gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto"
            >
              <div className="text-center flex-shrink-0">
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-4">⚡</div>
                <h3 className="text-base sm:text-lg font-semibold text-black mb-1 sm:mb-2">Instant Results</h3>
                <p className="text-gray-600 text-xs sm:text-sm whitespace-nowrap">Get your audit results in under 2 minutes</p>
              </div>
              <div className="text-center flex-shrink-0">
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-4">🔒</div>
                <h3 className="text-base sm:text-lg font-semibold text-black mb-1 sm:mb-2">100% Secure</h3>
                <p className="text-gray-600 text-xs sm:text-sm whitespace-nowrap">Your data is encrypted and never stored</p>
              </div>
              <div className="text-center flex-shrink-0">
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-4">💯</div>
                <h3 className="text-base sm:text-lg font-semibold text-black mb-1 sm:mb-2">No Credit Card</h3>
                <p className="text-gray-600 text-xs sm:text-sm whitespace-nowrap">Start completely free, no strings attached</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

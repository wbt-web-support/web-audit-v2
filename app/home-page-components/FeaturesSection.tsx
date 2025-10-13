'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const features = [
  {
    icon: "🔍",
    title: "Website Crawling",
    description: "Comprehensive website analysis from single pages to full site crawls",
    items: [
      "Single Page Crawl – Analyze one specific page",
      "Full Site Crawl – Scan and audit all accessible pages", 
      "Hidden URLs Detection – Identify unlinked or orphan pages"
    ]
  },
  {
    icon: "📑",
    title: "Content & Brand Insights",
    description: "Ensure your content and branding are consistent and optimized",
    items: [
      "Brand Consistency Check – Ensure colors, fonts, and messaging align",
      "Grammar & Content Analysis – Check spelling, grammar, readability",
      "SEO & Structure – Validate meta tags, heading hierarchy, schema markup"
    ]
  },
  {
    icon: "💳",
    title: "Security & Compliance",
    description: "Protect your site from security vulnerabilities and compliance issues",
    items: [
      "Stripe Public Key Detection – Identify exposed API keys",
      "Google Tags & Tracking Audit – Detect analytics and third-party scripts",
      "Security Risk Assessment – Comprehensive security analysis"
    ]
  },
  {
    icon: "🖼️",
    title: "Media & Asset Analysis",
    description: "Optimize your media assets for better performance and accessibility",
    items: [
      "On-Site Image Scan – Check alt tags, resolution, compression",
      "Link Scanner – Validate internal/external links and detect broken redirects",
      "Social Share Preview – Generate platform previews for Twitter, LinkedIn, Facebook"
    ]
  },
  {
    icon: "⚙️",
    title: "Technical & Performance",
    description: "Improve your site's technical performance and user experience",
    items: [
      "Performance Metrics – Page load time, Core Web Vitals, resource optimization",
      "UI/UX Quality Check – Detect layout issues, responsiveness, accessibility gaps",
      "Technical Fix Recommendations – Actionable suggestions for improvements"
    ]
  },
  {
    icon: "🎯",
    title: "Customization",
    description: "Tailor the audit to your specific needs and requirements",
    items: [
      "Custom Audit Instructions – Define specific checks and tailored rules",
      "Priority-based Analysis – Focus on areas that matter most to you",
      "Flexible Reporting – Get insights in the format that works for you"
    ]
  }
];

export default function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" ref={ref} className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_24%,rgba(0,0,0,0.05)_25%,rgba(0,0,0,0.05)_26%,transparent_27%,transparent_74%,rgba(0,0,0,0.05)_75%,rgba(0,0,0,0.05)_76%,transparent_77%)] bg-[length:50px_50px]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16 px-4"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4 sm:mb-6">
            Platform Features
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive website analysis powered by AI to help you optimize every aspect of your site
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover: transition-all duration-500 border border-gray-200 relative overflow-hidden group"
            >
              {/* Card Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Card Content */}
              <div className="relative z-10">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : { scale: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                  className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:from-black group-hover:to-gray-800 transition-all duration-500"
                >
                  <span className="text-lg sm:text-2xl group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </span>
                </motion.div>

                {/* Title */}
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-black mb-3 sm:mb-4 group-hover:text-gray-800 transition-colors duration-300">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                  {feature.description}
                </p>

                {/* Feature Items */}
                <ul className="space-y-2 sm:space-y-3">
                  {feature.items.map((item, itemIndex) => (
                    <motion.li
                      key={itemIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                      transition={{ duration: 0.4, delay: index * 0.1 + itemIndex * 0.1 + 0.5 }}
                      className="flex items-start text-xs sm:text-sm text-gray-700 group-hover:text-gray-800 transition-colors duration-300"
                    >
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black rounded-full mt-1.5 sm:mt-2 mr-2 sm:mr-3 flex-shrink-0 group-hover:bg-gray-600 transition-colors duration-300"></span>
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-12 sm:mt-16 px-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 sm:px-12 sm:py-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors duration-300  text-sm sm:text-base"
          >
            Start Your Free Audit
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

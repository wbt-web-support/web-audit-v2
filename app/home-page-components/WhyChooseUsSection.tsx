'use client';

import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function WhyChooseUsSection() {
  return (
    <motion.section 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="py-16 px-4 bg-slate-50"
    >
      <div className="max-w-7xl mx-auto">
        {/* Heading and Paragraph */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-12"
        >
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6"
          >
            Why Choose Our <span className="text-blue-600">Web</span> Audit?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed"
          >
            Get actionable insights that drive results
          </motion.p>
        </motion.div>

        {/* Grid Section - Two rows with 50%-25%-25% layout */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="space-y-6"
        >
          {/* First Row */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            {/* Large box - 50% width (2 columns) */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="md:col-span-2 bg-white rounded-xl p-6 border border-slate-200"
            >
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 1.4 }}
                className="text-xl font-semibold text-slate-900 mb-3"
              >
                Improve Rankings
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 1.6 }}
                className="text-slate-600 leading-relaxed mb-4"
              >
                Boost SEO visibility with clear fixes.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 1.8 }}
                className="w-full h-48 rounded-lg overflow-hidden"
              >
                <img 
                  src="/images/home-page/sco.png" 
                  alt="Performance Analysis Report" 
                  className="w-full h-full object-contain"
                />
              </motion.div>
            </motion.div>

            {/* Two smaller boxes - 25% each (1 column each) */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="md:col-span-1 bg-white rounded-xl  border border-slate-200"
            >
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 1.6 }}
                className="text-lg font-semibold text-slate-900 mb-2 p-4"
              >
                Protect Your Site
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 1.8 }}
                className="text-slate-600 text-sm leading-relaxed mb-3 px-4"
              >
                Spot security risks before they hurt you.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 2.0 }}
                className="w-full h-full rounded-lg overflow-hidden"
              >
                <Image 
                  src="/images/home-page/ProtectYourSite.png" 
                  alt="Protect Your Site Security Analysis" 
                  width={300}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 1.6 }}
              className="md:col-span-1 bg-white rounded-xl p-4 border border-slate-200"
            >
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 1.8 }}
                className="text-lg font-semibold text-slate-900 mb-2"
              >
                Save Time
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 2.0 }}
                className="text-slate-600 text-sm leading-relaxed mb-3"
              >
                Automated crawling saves hours of manual work.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 2.2 }}
                className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center"
              >
                <span className="text-gray-500 text-xs">Image Placeholder</span>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Second Row */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 2.4 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            {/* Large box - 50% width (2 columns) */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 2.6 }}
              className="md:col-span-2 bg-white rounded-xl p-6 border border-slate-200"
            >
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 2.8 }}
                className="text-xl font-semibold text-slate-900 mb-3"
              >
                Ensure Brand Consistency
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 3.0 }}
                className="text-slate-600 leading-relaxed mb-4"
              >
                Check content, tone, and messaging.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 3.2 }}
                className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center"
              >
                <span className="text-gray-500 text-sm">Image Placeholder</span>
              </motion.div>
            </motion.div>

            {/* Two smaller boxes - 25% each (1 column each) */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 2.8 }}
              className="md:col-span-1 bg-white rounded-xl p-4 border border-slate-200"
            >
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 3.0 }}
                className="text-lg font-semibold text-slate-900 mb-2"
              >
                Deliver Better UX
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 3.2 }}
                className="text-slate-600 text-sm leading-relaxed mb-3"
              >
                Identify performance and accessibility issues.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 3.4 }}
                className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center"
              >
                <span className="text-gray-500 text-xs">Image Placeholder</span>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 3.0 }}
              className="md:col-span-1 bg-white rounded-xl p-4 border border-slate-200"
            >
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 3.2 }}
                className="text-lg font-semibold text-slate-900 mb-2"
              >
                Peace of Mind
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 3.4 }}
                className="text-slate-600 text-sm leading-relaxed mb-3"
              >
                Regular audits ensure your site stays healthy.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 3.6 }}
                className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center"
              >
                <span className="text-gray-500 text-xs">Image Placeholder</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  )
}

"use client";

import { motion } from "framer-motion";
import { ArrowRight  } from "lucide-react";
import Image from "next/image";

export default function FeatureSection() {
  return (
    <section className="relative bg-white py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          {/* Tag */}
          <span className="inline-block px-3 py-1 text-sm font-medium text-blue-700 bg-blue-50 rounded-sm">
            Automation
          </span>

          {/* Title */}
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Find more hours <br /> in the day.
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
            Automate <span className="text-blue-700 font-medium">complex</span> manual workflows, operate far{" "}
            <span className="text-blue-700 font-medium">more efficiently</span>, and get to audit{" "}
            <span className="text-blue-700 font-medium">faster</span>. The result? Spend more of your time on 
            strategic work and take the business forward.
          </p>

          {/* CTA */}
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="#learn"
            className="inline-flex items-center px-6 py-3 bg-green-50 text-blue-700 font-semibold rounded-lg shadow hover:bg-green-100 transition"
          >
            Learn more
            <ArrowRight className="ml-2 h-4 w-4" />
          </motion.a>
        </motion.div>

        {/* Right Content (Image placeholder) */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center"
        >
          <div className="relative w-full max-w-lg">
            <Image
              src="/feature-image.png" // replace with your actual image path
              alt="Automation Preview"
              width={600}
              height={400}
              className="rounded-xl shadow-lg"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function TrustSection() {
  return (
    <section className="relative bg-white py-20 mt-30 h-full ">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-12">
        
        {/* Top content (text) */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 text-left"
        >
          {/* Tag */}
          <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-700 border">
            Accuracy
          </span>

          {/* Title */}
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-snug">
            Trust the numbers.
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
            <span className="text-blue-600 font-medium">Reduce errors</span>, be far more{" "}
            <span className="text-blue-600 font-medium">accurate</span>, and create{" "}
            <span className="text-blue-600 font-medium">real-time</span> visibility of your
            source data. Let Brullion’s{" "}
            <span className="text-blue-600 font-medium">AI-powered</span> software take care of
            the numbers, so you can go to audit with confidence.
          </p>
        </motion.div>

        {/* Bottom content (images) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row gap-6 justify-center items-center"
        >
          {/* Left small image */}
          <div className="relative w-60 h-72 mr-40    overflow-hidden">
            <Image
              src="/flow-diagram.png" // replace with your image
              alt="Flow Diagram"
              fill
              className="object-cover h-200"
            />
          </div>

          {/* Right bigger image */}
          <div className="relative w-130    h-70   bg-white overflow-hidden">
            <Image
              src="/tableImage.png" // replace with your image
              alt="Data Table"
              fill
              className="object-cover"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

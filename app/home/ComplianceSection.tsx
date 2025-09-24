"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function ComplianceSection() {
  return (
    <section className="relative bg-white py-20 h-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 ">
        
        {/* LEFT COLUMN */}
        <div className="box relative w-full h-full border border-gray-200 rounded-xl shadow-sm bg-gray-50 p-10">
        <div className="flex flex-col space-y-6  ">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col space-y-6"
          >
            {/* Text Content */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Peace of mind like never before.
              </h2>
              <p className="text-gray-600 leading-relaxed mt-3">
                Ensure ongoing compliance with the latest accounting standards
                and minimize cost inefficiencies across your business.
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-3">
              {[
                "ASC 606",
                "ASC 842",
                "IFRS 15",
                "IFRS 16",
                "GASB 87",
                "GASB 96",
                "FRS 102",
              ].map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-md border border-blue-600 text-blue-600 text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div>
              <button className="px-5 py- mt-40 rounded-md border border-gray-300 hover:bg-gray-100 text-sm font-medium transition">
                Explore standards →
              </button>
            </div>
          </motion.div>
          </div>
          {/* Left Image Placeholder */}
         
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col space-y-6 relative w-full h-full border border-gray-200 rounded-xl shadow-sm bg-gray-50 p-10">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col space-y-6"
          >
            {/* Text Content */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                One workspace (for everyone)
              </h2>
              <p className="text-gray-600 leading-relaxed mt-3">
                Create a 360° view of your data. Empower CFOs, controllers, and
                auditors to collaborate in one platform, increase visibility, and
                build transparency across your accounting work.
              </p>
            </div>

            {/* CTA */}
          
          </motion.div>

          {/* Right Image Placeholder */}
          <div className="relative w-full h-40   ">
            <Image
              src="/workSpace.png" // replace with actual image
              alt="Workspace Preview"
              fill
              className="object-cover w-full  "
            />
          </div>
          <div>
              <button className="px-5 py-2 rounded-md border border-gray-300 hover:bg-gray-100 text-sm font-medium transition">
                Learn more →
              </button>
            </div>
        </div>
      </div>
    </section>
  );
}

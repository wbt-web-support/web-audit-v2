    "use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function WorkflowSection() {
  return (
    <section className="relative bg-white py-20 mt-30 h-170">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          {/* Tag */}
          <span className="inline-block px-3 py-1 text-sm font-medium-700 text-blue-700  bg-blue-50 rounded-lg  ">
            The Brullion Platform
          </span>

          {/* Title */}
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Automate workflows. <br /> Transform your world.
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
            Connect structured and unstructured data together in{" "}
            <span className="text-blue-700 font-medium">one platform</span>. Always be in step 
            with the latest{" "}
            <span className="text-blue-700 font-medium">compliance standards</span>.
          </p>
        </motion.div>

        {/* Right Content (Image placeholder for UI) */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center"
        >
          <div className="relative w-full max-w-lg">
            <Image
              src="/workflowImage.png" // replace with your actual screenshot or UI component
              alt="Workflow Preview"
              width={600}
              height={400}
              className="rounded-xl shadow-xl"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

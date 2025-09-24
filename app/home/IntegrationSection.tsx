"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function IntegrationSection() {
  return (
    <section className="relative bg-white py-20 shadow-xl w-300 m-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* LEFT SIDE - Text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Yes, Brullion works <br /> with that too.
          </h2>
          <p className="text-gray-600 leading-relaxed max-w-md">
            Connect with CRM, billing, and ERP data sources, and sync unstructured
            data including spreadsheets and PDF contracts—all in one platform.
          </p>

          <button className="px-5 py-2 rounded-md bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition">
            See all integrated apps 🌿
          </button>
        </motion.div>

        {/* RIGHT SIDE - Image */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative w-full h-64 sm:h-80"
        >
          <Image
            src="/integrations.png" // replace with actual integration graphic
            alt="Integration logos"
            fill
            className="object-contain shadow-sm"
          />
        </motion.div>
      </div>
    </section>
  );
}

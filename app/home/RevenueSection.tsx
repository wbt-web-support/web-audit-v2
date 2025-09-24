"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { FileText, BarChart3, Database, ClipboardCheck } from "lucide-react";

const features = [
  {
    id: "data",
    title: "Unify your data with ease.",
    description:
      "Consolidate structured and unstructured data from multiple sources into one trusted platform. Ensure consistency and reliability across your entire audit process.",
    image: "/data-consolidation.png", // replace with your image
    icon: Database,
    label: "Data Consolidation",
  },
  {
    id: "logic",
    title: "Smarter recognition logic.",
    description:
      "Leverage advanced recognition logic to classify, match, and validate your financial records accurately—minimizing errors and saving time.",
    image: "/recognition-logic.png",
    icon: FileText,
    label: "Recognition Logic",
  },
  {
    id: "revenue",
    title: "Less number crunching, more accuracy.",
    description:
      "Minimize errors, improve accuracy, and reduce compliance risk. Easily report on your trusted data with confidence at every step.",
    image: "/revenue-card.png",
    icon: BarChart3,
    label: "Revenue Analysis",
  },
  {
    id: "audit",
    title: "Stay ahead with automated audit reporting.",
    description:
      "Generate audit-ready reports instantly, ensuring compliance with evolving standards while reducing manual effort.",
    image: "/audit-report.png",
    icon: ClipboardCheck,
    label: "Audit Reporting",
  },
];

export default function RevenueSection() {
  const [active, setActive] = useState("revenue");
  const activeFeature = features.find((f) => f.id === active)!;

  return (
    <section className="relative bg-white py-20 border-t  border-gray-100 h-full">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Content */}
        <motion.div
          key={activeFeature.id + "-text"}
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Title */}
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {activeFeature.title}
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
            {activeFeature.description}
          </p>

          {/* CTA */}
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="#learn"
            className="inline-flex items-center px-6 py-3 bg-green-50 text-blue-700 font-semibold rounded-lg shadow hover:bg-green-100 transition"
          >
            Explore standards →
          </motion.a>
        </motion.div>

        {/* Right Content (Image placeholder) */}
        <motion.div
          key={activeFeature.id + "-image"}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <div className="relative w-full max-w-xl">
            <Image
              src='/revenueImage.png'
              alt={activeFeature.label}
              width={600}
              height={400}
              className="rounded-xl  border border-gray-100"
            />
          </div>
        </motion.div>
      </div>

      {/* Feature Tabs */}
      <div className="mt-16 border-t border-gray-200 pt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto text-center">
          {features.map((tab, index) => (
            <motion.button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className={`flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer transition ${
                active === tab.id
                  ? "text-blue-700 bg-green-50 font-semibold"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <tab.icon className="h-6 w-6 mb-2" />
              <span className="text-sm">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

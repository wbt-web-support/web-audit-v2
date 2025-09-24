"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

const testimonials = [
  {
    name: "Alexa Gumiho",
    role: "CEO, Arbitor",
    text: "Our financial processes used to be complex and time-consuming. Since integrating this platform, managing revenue recognition, lease accounting, and audits has become effortless. The AI-powered automation has elevated our efficiency, giving us more time to focus on strategic decisions.",
  },
  {
    name: "Sindi Foster",
    role: "Financial Controller, Dynamico",
    text: "Transitioning to this platform was a strategic move for us. The AI-powered revenue recognition and lease accounting modules have optimized our processes, providing real-time insights and increasing collaboration across our financial teams.",
  },
  {
    name: "Lucas Megihu",
    role: "Audit Manager, Global Auditors Inc",
    text: "Automating revenue recognition and lease accounting through this platform has been a game-changer. It has simplified our workflows and improved our financial reporting accuracy. The AI-driven analytics provide invaluable insights, making audits a breeze.",
  },
  {
    name: "Syntalopia Utop",
    role: "Finance Director, Innovate Innovations",
    text: "Our transition to this platform was seamless, thanks to its AI-driven simplicity. The automated revenue recognition and lease accounting modules have streamlined our financial operations and offered a clear advantage in managing audits.",
  },
  {
    name: "Lucyna Wejawa",
    role: "CFO, Forward Financials",
    text: "In the realm of audits, efficiency and precision are paramount. This platform has brought a new level of efficiency to our workflows. The integration of revenue recognition and lease accounting data, coupled with the platform's comprehensive reporting, has simplified our assessments.",
  },
  {
    name: "Gristel Yucal",
    role: "Controller, Precision Manufacturing",
    text: "Our experience with this platform has been truly transformative. Simplifying revenue recognition, lease accounting, and audits has been a game-changer for our financial team. The platform’s seamless integration and user-friendly interface have streamlined processes, reduced manual errors and saved valuable time.",
  },
];

export default function TestimonySection() {
  return (
    <section className="relative bg-white py-20 ">
      <div className="max-w-6xl mx-auto px-6 space-y-14">
        
        {/* Header */}
        <div className="text-left space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-gray-300 text-sm text-gray-700 bg-gray-50"
          >
            <MessageCircle className="w-4 h-4 text-gray-600" />
            Testimony
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900"
          >
            Hundreds of people <br /> already love us
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-gray-600 max-w-lg"
          >
            Our <span className="text-blue-600 font-medium">services quality</span> 
            {" "}speaks for itself from our beloved clients.
          </motion.p>
        </div>

        {/* Testimonials grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition"
            >
              <p className="text-gray-700 mb-4">{t.text}</p>
              <div>
                <p className="font-semibold text-gray-900">{t.name}</p>
                <p className="text-sm text-gray-500">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA button */}
        <div className="flex justify-center pt-6">
          <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl shadow hover:bg-blue-700 transition">
            See all testimonies
          </button>
        </div>
      </div>
    </section>
  );
}

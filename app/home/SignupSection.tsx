"use client";

import { motion } from "framer-motion";

export default function SignupSection() {
  return (
    <section className="relative bg-white py-20 h-200  pt-50">
      <div className="max-w-md mx-auto text-center px-6">
        
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
        >
          It just works, <br /> so that you can too.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-gray-600 mb-8"
        >
          Create your account and join us
        </motion.p>

        {/* Signup form */}
        <form className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full py-3 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-800 transition flex items-center justify-center gap-2"
          >
            Sign up →
          </button>
        </form>
      </div>
    </section>
  );
}

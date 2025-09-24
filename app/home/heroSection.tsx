// "use client";

// import { motion, useScroll, useTransform } from "framer-motion";
// import { useRef } from "react";

// export default function HeroSection() {
//   const ref = useRef<HTMLDivElement>(null);
//   const { scrollYProgress } = useScroll({
//     target: ref,
//     offset: ["start start", "end start"],
//   });

//   const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
//   const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

//   return (
//     <section
//       ref={ref}
//       className="relative h-screen overflow-hidden bg-black-200 flex items-center"
//     >
//       {/* Parallax Background */}
//       <motion.div
//         style={{ y }}
//         className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800"
//       >
//         {/* Subtle Grid Overlay */}
//         <div className="absolute inset-0 opacity-10">
//           <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05)_76%,transparent_77%)] bg-[length:50px_50px]" />
//         </div>

//         {/* Floating Elements */}
//         <motion.div
//           animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
//           transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
//           className="absolute top-20 left-10 w-4 h-4 bg-white rounded-full opacity-30"
//         />
//         <motion.div
//           animate={{ y: [0, 30, 0], rotate: [0, -5, 0] }}
//           transition={{
//             duration: 8,
//             repeat: Infinity,
//             ease: "easeInOut",
//             delay: 2,
//           }}
//           className="absolute top-40 right-20 w-6 h-6 border border-white rounded-full opacity-20"
//         />
//         <motion.div
//           animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
//           transition={{
//             duration: 7,
//             repeat: Infinity,
//             ease: "easeInOut",
//             delay: 1,
//           }}
//           className="absolute bottom-40 left-1/4 w-3 h-3 bg-white rounded-full opacity-25"
//         />
//       </motion.div>

//       {/* Main Content */}
//       <motion.div
//         style={{ opacity }}
//         className="relative z-10 w-full text-center px-6"
//       >
//         <div className="max-w-4xl mx-auto">
//           {/* Title */}
//           <motion.h1
//             initial={{ opacity: 0, y: 40 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8 }}
//             className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4"
//           >
//             WEB{" "}
//             <motion.span
//               animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
//               transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
//               className="bg-gradient-to-r from-white via-gray-300 to-white bg-[length:200%_100%] bg-clip-text text-transparent"
//             >
//               AUDIT
//             </motion.span>
//           </motion.h1>

//           {/* Subtitle */}
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8, delay: 0.3 }}
//             className="mb-6"
//           >
//             <span className="inline-block px-4 py-2 bg-white text-black text-xs sm:text-sm font-semibold rounded-full mb-3 animate-pulse">
//               🤖 AI-POWERED
//             </span>
//             <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-300 font-light">
//               Complete Website Analysis in Minutes
//             </h2>
//           </motion.div>

//           {/* Description */}
//           <motion.p
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8, delay: 0.5 }}
//             className="text-sm sm:text-base md:text-lg text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed"
//           >
//             From single-page checks to full-site crawls, our AI analyzes content,
//             SEO, performance, branding, and security risks. Get actionable
//             insights to improve your site&apos;s quality, speed, and visibility.
//           </motion.p>

//           {/* CTA Input */}
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8, delay: 0.7 }}
//             className="flex flex-col sm:flex-row gap-3 justify-center mb-8"
//           >
//             <input
//               type="url"
//               placeholder="Enter your website URL"
//               className="flex-1 min-w-[250px] px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300"
//             />
//             <motion.button
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//               className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition"
//             >
//               Let&apos;s Go! 🚀
//             </motion.button>
//           </motion.div>

//           {/* Secondary CTA */}
//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8, delay: 0.9 }}
//             className="px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-black transition mb-10"
//           >
//             Learn More
//           </motion.button>

//           {/* Stats Section */}
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8, delay: 1.1 }}
//             className="flex flex-wrap justify-center gap-6"
//           >
//             {[
//               { number: "10K+", label: "Websites Audited" },
//               { number: "99.9%", label: "Accuracy Rate" },
//               { number: "< 2min", label: "Average Scan Time" },
//             ].map((stat, i) => (
//               <div key={i} className="text-center">
//                 <div className="text-2xl sm:text-3xl font-bold text-white">
//                   {stat.number}
//                 </div>
//                 <div className="text-gray-400 text-sm">{stat.label}</div>
//               </div>
//             ))}
//           </motion.div>
//         </div>
//       </motion.div>

//       {/* Scroll Indicator */}
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ duration: 1.2, delay: 1.5 }}
//         className="absolute bottom-8 left-1/2 -translate-x-1/2"
//       >
//         <motion.div
//           animate={{ y: [0, 10, 0] }}
//           transition={{ duration: 2, repeat: Infinity }}
//           className="w-6 h-10 border-2 border-white rounded-full flex justify-center"
//         >
//           <motion.div
//             animate={{ y: [0, 12, 0] }}
//             transition={{ duration: 2, repeat: Infinity }}
//             className="w-1 h-3 bg-white rounded-full mt-2"
//           />
//         </motion.div>
//       </motion.div>
//     </section>
//   );
// }
"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative bg-white py-20 h-100  pt-50 ">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          {/* Tagline */}
          <span className="inline-block px-3 py-1 text-sm font-medium text-blue-700 bg-blue-50 rounded-full">
            Your best tool for accounting and audit teams
          </span>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Beyond <span className="text-blue-700">Accounting.</span>
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
            Brullion is the AI-powered platform that automates manual work for finance 
            and audit teams—ensuring{" "}
            <span className="text-blue-700 font-medium">accuracy</span>,{" "}
            <span className="text-blue-700 font-medium">compliance</span>, and total{" "}
            <span className="text-blue-700 font-medium">confidence</span>.
          </p>

          {/* CTA */}
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="#demo"
            className="inline-flex items-center px-6 py-3 bg-blue-700 text-white font-semibold rounded-lg shadow hover:bg-blue-500 transition "
          >
            Book a demo
            <ArrowRight className="ml-2 h-4 w-4" />
          </motion.a>
        </motion.div>

        {/* Right Content - Preview Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="inline-block w-4 h-4 bg-gray-100 border border-gray-300 rounded-sm" />
                Reports
              </h3>
            </div>

            {/* Tabs */}
            <div className="flex gap-3 text-sm font-medium text-gray-600 border-b mb-4 overflow-x-auto">
              {["All", "Lessee", "Lessor", "IT Agreements", "Ad hoc reports"].map(
                (tab, i) => (
                  <button
                    key={i}
                    className={`pb-2 ${
                      i === 0
                        ? "border-b-2 border-green-700 text-blue-700"
                        : "hover:text-gray-900"
                    }`}
                  >
                    {tab}
                  </button>
                )
              )}
            </div>

            {/* Search + Filter */}
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                placeholder="Search"
                className="flex-1 px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-200 focus:outline-none"
              />
              <button className="px-3 py-2 text-sm border rounded-md hover:bg-gray-50">
                Filter
              </button>
            </div>

            {/* Report Items */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-md">
                  FASB
                </span>
                <div>
                  <p className="font-medium text-gray-800 text-sm">
                    Lessee ASC 842 ERP Reports
                  </p>
                  <p className="text-xs text-gray-500">
                    Run your ERP report, structured and ready to be exported to
                    your ERP/accounting system.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-md">
                  IFRS
                </span>
                <div>
                  <p className="font-medium text-gray-800 text-sm">
                    Lessee IFRS 16 Disclosure Reports
                  </p>
                  <p className="text-xs text-gray-500">
                    Run your disclosure report based on IFRS 16 guidance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

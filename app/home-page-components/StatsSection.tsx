'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

const stats = [
  {
    number: "10,000+",
    label: "Websites Audited",
    description: "Trusted by businesses worldwide"
  },
  {
    number: "99.9%",
    label: "Accuracy Rate",
    description: "Industry-leading precision"
  },
  {
    number: "< 2min",
    label: "Average Scan Time",
    description: "Lightning-fast analysis"
  },
  {
    number: "50+",
    label: "Checks Performed",
    description: "Comprehensive analysis"
  }
];

function AnimatedCounter({ end, duration = 2 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(startValue + (end - startValue) * easeOutQuart);
      
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, isInView]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

export default function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-white/3 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/2 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16 px-4"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            Trusted by Thousands
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            Join the growing community of businesses that trust our platform for their website audits
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="text-center p-4 sm:p-6 lg:p-8 bg-gray-900 rounded-xl sm:rounded-2xl hover:bg-gray-800 transition-all duration-300"
            >
              {/* Animated Number */}
              <motion.div
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : { scale: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                className="text-4xl md:text-5xl font-bold text-white mb-4"
              >
                {stat.number.includes('+') ? (
                  <span>
                    <AnimatedCounter end={parseInt(stat.number.replace(/[^\d]/g, ''))} />
                    {stat.number.replace(/\d/g, '').replace(/[^\D]/g, '')}
                  </span>
                ) : stat.number.includes('<') ? (
                  stat.number
                ) : stat.number.includes('%') ? (
                  <span>
                    <AnimatedCounter end={parseFloat(stat.number.replace('%', ''))} />
                    %
                  </span>
                ) : (
                  stat.number
                )}
              </motion.div>

              {/* Label */}
              <h3 className="text-xl font-semibold text-white mb-2">
                {stat.label}
              </h3>

              {/* Description */}
              <p className="text-gray-400 text-sm">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Additional Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="p-6 bg-gray-900 rounded-xl">
              <div className="text-2xl font-bold text-white mb-2">24/7</div>
              <div className="text-gray-400">Monitoring</div>
            </div>
            <div className="p-6 bg-gray-900 rounded-xl">
              <div className="text-2xl font-bold text-white mb-2">100%</div>
              <div className="text-gray-400">Automated</div>
            </div>
            <div className="p-6 bg-gray-900 rounded-xl">
              <div className="text-2xl font-bold text-white mb-2">Free</div>
              <div className="text-gray-400">Basic Plan</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

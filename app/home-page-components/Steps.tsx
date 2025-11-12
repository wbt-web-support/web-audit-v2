"use client";

import React from "react";
import Link from "next/link";
import { LinkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/hooks/useAuth";

interface Step {
  number: number;
  title: string;
  description: string;
  showButton?: boolean;
}

const steps: Step[] = [
  {
    number: 1,
    title: "Enter URL",
    description:
      "Simply paste your website URL into the audit tool. No registration or setup required.",
    showButton: true,
  },
  {
    number: 2,
    title: "Automated Analysis",
    description:
      "Our system scans your website for SEO, performance, security, and accessibility issues.",
  },
  {
    number: 3,
    title: "Get Results",
    description:
      "Receive detailed insights and actionable recommendations to improve your website.",
  },
];

export default function Steps() {
  const { isAuthenticated } = useAuth();
  
  return (
    <section className="bg-gray-50 py-12 md:py-16 lg:py-20 px-4 md:px-8 lg:px-12">
      <div className="max-w-[90rem] mx-auto">
        {/* Header Section */}
        <div className="mb-12 md:mb-16 lg:mb-20 max-w-4xl">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-black mb-4 raleway leading-tight">
            Audit in 3 Simple Steps
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-black/70 raleway">
            From URL input to insights in under 60 seconds
          </p>
        </div>
        {/* Steps Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-white rounded-xl shadow-sm p-5 md:p-6 lg:p-7 flex flex-col hover:shadow-md transition-shadow duration-300"
            >
              {/* Step Number */}
              <div className="mb-4 md:mb-5">
                <span
                  className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-transparent rounded-lg inline-block px-3 md:px-4 py-1 leading-none"
                  style={{
                    WebkitTextStroke: "3px #ff4b01",
                  }}
                >
                  {step.number}
                </span>
              </div>

              {/* Step Title */}
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-black mb-3 md:mb-4">
                {step.title}
              </h3>

              {/* Step Description */}
              <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 flex-grow">
                {step.description}
              </p>

              {/* Button (only for step 1) */}
              {step.showButton && (
                <Link 
                  href={isAuthenticated ? '/dashboard' : '/login'}
                  className="mt-auto bg-[#ff4b01] hover:bg-[#ff4b01]/90 text-white font-semibold py-2.5 md:py-3 px-4 md:px-5 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 w-full cursor-pointer"
                >
                  <span>Enter URL</span>
                  <LinkIcon className="w-5 h-5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import React from "react";
import { LinkIcon } from "@heroicons/react/24/outline";

interface Step {
  number: number;
  title: string;
  description: string;
  showButton?: boolean;
}

const steps: Step[] = [
  {
    number: 1,
    title: "Enter Your Website URL",
    description: "Just paste your site link into the audit tool. No setup, no technical hassle.",
    showButton: true,
  },
  {
    number: 2,
    title: "Smart Crawling Engine Scans Your Site",
    description: "Our system explores pages, hidden links, and assets the way search engines do.",
  },
  {
    number: 3,
    title: "AI-Powered Analysis Runs Automatically",
    description: "Advanced algorithms check SEO, security, performance, and content in real time.",
  },
  {
    number: 4,
    title: "Get Scores & Detailed Insights",
    description: "Receive an easy-to-read dashboard with clear grades and issue breakdowns.",
  },
  {
    number: 5,
    title: "Fix Issues with Guided Steps",
    description: "Follow prioritized recommendations with actionable fixes tailored to your site.",
  },
];

export default function Steps() {
  return (
    <section className="bg-gray-50 py-12 md:py-16 lg:py-20 px-4 md:px-8 lg:px-12">
      <div className="max-w-[90rem] mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-3 md:mb-4">
            Audit in 5 Simple Steps
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-gray-600">
            From URL input to insights in under 60 seconds
          </p>
        </div>

        {/* Steps Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5 lg:gap-6">
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
                    WebkitTextStroke: '3px #2563eb',
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
                <button className="mt-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 md:py-3 px-4 md:px-5 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 w-full">
                  <span>Enter URL</span>
                  <LinkIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
"use client";

import React from "react";

interface Testimonial {
  quote: string;
  name: string;
  title: string;
}

const testimonials: Testimonial[] = [
  {
    quote: "Web Audit caught issues I never knew existed — it's like having a second pair of expert eyes",
    name: "Aarav Mehta",
    title: "CEO, FinTech Startup",
  },
  {
    quote: "Exporting and sharing reports with my dev team was seamless — we fixed things faster.",
    name: "Isabella Novak",
    title: "CTO, Beta User",
  },
  {
    quote: "Audits that used to take days were completed in minutes. The automation is a lifesaver.",
    name: "Isabella Novak",
    title: "CTO, Beta User",
  },
  {
    quote: "The best part is the clear, step-by-step recommendations. It's not just scores, it's real fixes.",
    name: "Liam Chen",
    title: "Product Designer, SaaS Platform",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-gray-50 py-12 md:py-16 lg:py-20 px-4 md:px-8 lg:px-12">
      <div className="max-w-[90rem] mx-auto">
        {/* Header Section */}
        
        <div className="mb-12 md:mb-16 lg:mb-20 max-w-4xl">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-black mb-4 raleway leading-tight">
          Trusted by Professionals
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-black/70 raleway">
          See what our users are saying
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm p-5 md:p-6 lg:p-7 hover:shadow-md transition-shadow duration-300"
            >
              {/* Quotation Mark Icon */}
              <div className="mb-4 md:mb-5">
                <svg
                  className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>

              {/* Testimonial Text */}
              <p className="text-base md:text-lg text-black mb-5 md:mb-6 leading-relaxed">
                {testimonial.quote}
              </p>

              {/* Name */}
              <p className="text-base md:text-lg font-bold text-black mb-1">
                {testimonial.name}
              </p>

              {/* Title */}
              <p className="text-sm md:text-base text-gray-600">
                {testimonial.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

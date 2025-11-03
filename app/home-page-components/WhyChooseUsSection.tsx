"use client";

import React from "react";
import Image from "next/image";
import { ClockIcon, CheckBadgeIcon, DocumentCheckIcon } from "@heroicons/react/24/outline";

export default function WhyChooseUsSection() {
  return (
    <section className="bg-[#f7f7f7] py-16 md:py-20 lg:py-24 px-4 md:px-8 lg:px-12">
      <div className="max-w-[90rem] mx-auto">
        {/* Heading Section */}
        <div className="mb-12 md:mb-16 lg:mb-20 max-w-4xl">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-black mb-4 raleway leading-tight">
            Why Choose Our Auditly?
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-black/70 raleway">
            Get actionable insights that drive results
          </p>
        </div>

        {/* Bento Box Grid - 60/40 Split */}
        <div className="flex flex-col gap-4 md:gap-5 lg:gap-6">
          {/* Row 1: Improve Rankings (60%) + Protect Your Site (40%) */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-5 lg:gap-6 items-stretch">
            <div className="w-full md:w-[55%] flex">
              <div className="bg-white text-black rounded-[20px]  flex flex-col gap-4 md:gap-2 h-full shadow-lg border border-slate-200">
                <h3 className="font-semibold px-12 pt-12 text-2xl md:text-3xl lg:text-4xl raleway leading-tight">
                  Improve Rankings
                </h3>
                
                <p className="text-sm md:text-base lg:text-lg leading-relaxed flex-grow px-12 text-black/70">
                  Boost SEO visibility with clear fixes. Identify indexing
                  issues and optimize metadata, structure, and internal links.
                  Stay ahead of algorithm changes.
                </p>
                <div className="relative w-full min-h-[400px]  md:max-h-[450px] lg:max-h-[500px]  rounded-lg overflow-hidden ">
                  <Image
                    src="/images/home-page/image.png"
                    alt="Performance and SEO scores dashboard"
                     height={1000}
                     width={1000}
                    className="object-contain object-right w-[80%] absolute  right-0 shadow-lg rounded-tl-lg rounded-bl-lg"
                  />
                </div>
              </div>
            </div>
            <div className="w-full md:w-[45%] flex">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 text-black rounded-[20px]  flex flex-col gap-4 md:gap-2 h-full shadow-md border border-slate-300">
                <h3 className="font-semibold text-2xl md:text-3xl lg:text-4xl raleway leading-tight px-12 pt-12 ">
                  Protect Your Site
                </h3>
                <p className="text-sm md:text-base lg:text-lg leading-relaxed flex-grow text-black/70 px-12">
                  Spot security risks early. Detect vulnerabilities and malware
                  before they become threats. Safeguard user data and maintain
                  trust.
                </p>
                <div className="relative w-full max-h-[400px]   rounded-2xl overflow-hidden ">
                  <Image
                    src="/images/home-page/ProtectYourSite.png"
                    alt="Performance and SEO scores dashboard"
                     height={1000}
                     width={1000}
                    className="object-contain object-right w-full "
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Save Time (40%) + Ensure Brand Consistency (60%) */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-5 lg:gap-6 items-stretch">
            <div className="w-full md:w-[45%] flex">
              <div className="bg-slate-50 text-black rounded-[20px] p-12 md:p-14 lg:p-8 flex flex-col gap-4 md:gap-2 h-full shadow-sm border-2 border-slate-200">
                <h3 className="font-semibold text-2xl md:text-3xl lg:text-4xl raleway leading-tight flex items-center gap-3">
                  <ClockIcon className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-black" />
                  Save Time
                </h3>
                <p className="text-sm md:text-base lg:text-lg leading-relaxed flex-grow text-black/70">
                  Automated crawling saves hours of manual work. Instantly
                  detect issues across every page. Focus on strategic
                  improvements instead of routine monitoring.
                </p>
              </div>
            </div>
            <div className="w-full md:w-[55%] flex">
              <div className="bg-white text-black rounded-[20px] p-12 md:p-14 lg:p-8 flex flex-col gap-4 md:gap-2 h-full ">
                <h3 className="font-semibold text-2xl md:text-3xl lg:text-4xl raleway leading-tight flex items-center gap-3">
                  <CheckBadgeIcon className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-black" />
                  Ensure Consistency
                </h3>
                <p className="text-sm md:text-base lg:text-lg leading-relaxed flex-grow text-black/70">
                  Check content, tone, and messaging. Maintain visual
                  consistency across every page. Spot outdated brand assets and
                  keep voice aligned with your brand identity.
                </p>
              </div>
            </div>
            <div className="w-full md:w-[55%] flex">
              <div className="bg-white text-black rounded-[20px] p-12 md:p-14 lg:p-8 flex flex-col gap-4 md:gap-2 h-full ">
                <h3 className="font-semibold text-2xl md:text-3xl lg:text-4xl raleway leading-tight flex items-center gap-3">
                  <DocumentCheckIcon className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-black" />
                  Grammar Check 
                </h3>
                <p className="text-sm md:text-base lg:text-lg leading-relaxed flex-grow text-black/70">
                  AI-powered grammar and content analysis for every page. Catch
                  spelling errors, punctuation mistakes, and style issues
                  automatically. Ensure professional, polished content across
                  your entire website.
                </p>
              </div>
            </div>
          </div>

          {/* Row 3: Deliver Better UX (60%) + Peace of Mind (40%) */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-5 lg:gap-6 items-stretch">
            <div className="w-full md:w-[55%] flex">
              <div className="bg-gradient-to-tr from-white to-slate-50 text-black rounded-[20px] p-12 md:p-14 lg:p-8 flex flex-col gap-4 md:gap-2 h-full shadow-md border border-slate-200">
                <h3 className="font-semibold text-2xl md:text-3xl lg:text-4xl raleway leading-tight">
                  Deliver Better UX
                </h3>
                <p className="text-sm md:text-base lg:text-lg leading-relaxed flex-grow text-black/70">
                  Identify performance and accessibility issues. Optimize page
                  speed for smoother browsing. Ensure every user can navigate
                  easily and reduce friction points.
                </p>
                <div className="relative w-full min-h-[400px] md:max-h-[450px] lg:max-h-[500px] rounded-lg overflow-hidden">
                  <Image
                    src="/images/home-page/uiquality.png"
                    alt="UI Quality Analysis dashboard"
                    height={1000}
                    width={1000}
                    className="object-contain w-full h-full shadow-lg rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="w-full md:w-[45%] flex">
              <div className="bg-white text-black rounded-[20px] p-12 md:p-14 lg:p-8 flex flex-col gap-4 md:gap-2 h-full shadow-lg ring-2 ring-slate-200 ring-offset-2">
                <h3 className="font-semibold text-2xl md:text-3xl lg:text-4xl raleway leading-tight">
                  SEO and Structure
                </h3>
                <p className="text-sm md:text-base lg:text-lg leading-relaxed flex-grow text-black/70">
                  Enhance search engine visibility with comprehensive SEO audits.
                  Optimize metadata, improve crawlability, and boost rankings.
                  Stay ahead with actionable insights for better search performance.
                </p>
                <div className="relative w-full min-h-[400px] md:max-h-[450px] lg:max-h-[500px] rounded-lg overflow-hidden">
                  <Image
                    src="/images/home-page/sco (2).png"
                    alt="SEO and Structure Analysis dashboard"
                    height={1000}
                    width={1000}
                    className="object-contain w-full h-full shadow-lg rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

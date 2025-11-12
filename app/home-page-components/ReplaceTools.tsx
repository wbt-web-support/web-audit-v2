"use client";

import React, { useState } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import Image from "next/image";

interface FeatureRow {
  feature: string;
  replaces: string[];
  otherToolsPrice: string;
  unique?: boolean;
}

interface ToolIcon {
  name: string;
  color: string;
  bgColor: string;
  letter?: string;
  iconUrl?: string;
}

interface ToolIconDisplayProps {
  icon: ToolIcon;
}

function ToolIconDisplay({ icon }: ToolIconDisplayProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${icon.bgColor} flex items-center justify-center flex-shrink-0 border border-gray-200 overflow-hidden`}
      title={icon.name}
    >
      {icon.iconUrl && !imageError ? (
        <Image
          src={icon.iconUrl}
          alt={icon.name}
          width={32}
          height={32}
          className="w-full h-full object-contain p-1"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className={`text-xs md:text-sm font-semibold ${icon.color}`}>
          {icon.letter}
        </span>
      )}
    </div>
  );
}

const toolIcons: { [key: string]: ToolIcon } = {
  screaminfrog: {
    name: "Screaming Frog",
    color: "text-green-600",
    bgColor: "bg-green-50",
    letter: "SF",
    iconUrl: "/images/tools/screaming-frog-seeklogo.png",
  },
  lighthouse: {
    name: "Lighthouse",
    color: "text-[#ff4b01]",
    bgColor: "bg-[#ff4b01]/10",
    letter: "LH",
    iconUrl: "/images/tools/lighthouse.svg",
  },
  grammarly: {
    name: "Grammarly",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    letter: "G",
    iconUrl: "/images/tools/grammarly.svg",
  },
  yoast: {
    name: "Yoast SEO",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    letter: "Y",
    iconUrl: "/images/tools/yoast.ico",
  },
  rankmath: {
    name: "Rank Math",
    color: "text-red-600",
    bgColor: "bg-red-50",
    letter: "RM",
    iconUrl: "/images/tools/rank-math-logo.png",
  },
  wprocket: {
    name: "WP Rocket",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    letter: "WR",
    iconUrl: "/images/tools/wp-rocket.ico",
  },
  wordfence: {
    name: "Wordfence",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    letter: "WF",
    iconUrl: "/images/tools/wordfence.svg",
  },
  wappalyzer: {
    name: "Wappalyzer",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    letter: "WZ",
    iconUrl: "/images/tools/wappalyzer.svg",
  },
  gtmetrix: {
    name: "GTmetrix",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    letter: "GT",
    iconUrl: "/images/tools/gtmetrix.ico",
  },
  brokenlink: {
    name: "Broken Link Checker",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    letter: "BL",
    iconUrl: "/images/tools/broken-link-checker.png",
  },
  sitebulb: {
    name: "Sitebulb",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    letter: "SB",
    iconUrl: "/images/tools/sitebulb.png",
  },
  ahrefs: {
    name: "Ahrefs",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    letter: "AH",
    iconUrl: "/images/tools/ahrefs.ico",
  },
  semrush: {
    name: "SEMrush",
    color: "text-red-600",
    bgColor: "bg-red-50",
    letter: "SM",
    iconUrl: "/images/tools/semrush.svg",
  },
  languagetool: {
    name: "LanguageTool",
    color: "text-[#ff4b01]",
    bgColor: "bg-[#ff4b01]/10",
    letter: "LT",
    iconUrl: "/images/tools/languagetool.svg",
  },
  // hemingway: {
  //   name: "Hemingway Editor",
  //   color: "text-red-600",
  //   bgColor: "bg-red-50",
  //   letter: "HE",
  //   iconUrl: "/images/tools/hemingway.ico",
  // },
  allinonewp: {
    name: "All in One SEO",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    letter: "AI",
    iconUrl: "/images/tools/all-in-one-seo.svg",
  },
  // sucuri: {
  //   name: "Sucuri",
  //   color: "text-green-600",
  //   bgColor: "bg-green-50",
  //   letter: "SC",
  //   iconUrl: "/images/tools/sucuri.ico",
  // },
  ithemes: {
    name: "iThemes Security",
    color: "text-[#ff4b01]",
    bgColor: "bg-[#ff4b01]/10",
    letter: "IT",
    iconUrl: "/images/tools/ithemes-security.svg",
  },
  // smush: {
  //   name: "Smush",
  //   color: "text-yellow-600",
  //   bgColor: "bg-yellow-50",
  //   letter: "SM",
  //   iconUrl: "/images/tools/smush.svg",
  // },
  pagespeed: {
    name: "PageSpeed Insights",
    color: "text-[#ff4b01]",
    bgColor: "bg-[#ff4b01]/10",
    letter: "PS",
    iconUrl: "/images/tools/google-pagespeed-insights-icon-2021-.svg",
  },
  wave: {
    name: "WAVE",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    letter: "WV",
    iconUrl: "/images/tools/wave.ico",
  },
  // axe: {
  //   name: "axe DevTools",
  //   color: "text-green-600",
  //   bgColor: "bg-green-50",
  //   letter: "AX",
  //   iconUrl: "/images/tools/axe.ico",
  // },
};

const features: FeatureRow[] = [
  {
    feature: "Website Crawling (Single Page, Full Site, Hidden URLs)",
    replaces: ["screaminfrog", "sitebulb"],
    otherToolsPrice: "$109/Monthly",
  },
  {
    feature: "Brand Consistency Check",
    replaces: ["yoast", "rankmath", "allinonewp"],
    otherToolsPrice: "$29/Monthly",
  },
  {
    feature: "Grammar & Content Analysis",
    replaces: ["grammarly", "languagetool", "hemingway"],
    otherToolsPrice: "$22/Monthly",
  },
  {
    feature: "SEO & Structure Analysis",
    replaces: ["yoast", "rankmath", "ahrefs"],
    otherToolsPrice: "$79/Monthly",
  },
  {
    feature: "Security & Compliance (Stripe Keys, Google Tags)",
    replaces: ["wordfence", "wappalyzer", "sucuri"],
    otherToolsPrice: "$250/Monthly",
  },
  {
    feature: "Media & Asset Analysis (Images, Links, Social Preview)",
    replaces: ["brokenlink", "yoast", "smush"],
    otherToolsPrice: "$9/Monthly",
  },
  {
    feature: "Performance Metrics & Core Web Vitals",
    replaces: ["gtmetrix", "lighthouse", "pagespeed"],
    otherToolsPrice: "In one place",
  },
  {
    feature: "UI/UX Quality & Accessibility Check",
    replaces: ["lighthouse", "wave", "axe"],
    otherToolsPrice: "In one place",
  },
];

const totalOtherToolsPrice = "$498/Monthly";
const auditly360Price = "$19 Per Month";

export default function ReplaceTools() {
  return (
    <div className="relative">
      <section className="relative max-w-[90rem] overflow-hidden mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-12 sm:py-16 md:py-20">
        <div className="relative">
          {/* Dark Blue Top Section */}
          <div className="relative z-10 bg-[#ff4b01] rounded-t-2xl sm:rounded-t-3xl h-20 sm:h-24 md:h-32 lg:h-40"></div>
          
          {/* Content Container */}
          <div className="relative mx-auto bg-white rounded-b-2xl sm:rounded-b-3xl -mt-1">
            <div className="relative z-20 -top-16 sm:-top-20 w-[95%] sm:w-[90%] mx-auto bg-slate-100 rounded-2xl sm:rounded-3xl -mt-1 p-4 sm:p-6 md:p-8">
              
              {/* Mobile Cards View - Visible on small screens only */}
              <div className="md:hidden space-y-4">
                {features.map((row, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm"
                  >
                    {/* Feature Header */}
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-800 flex-1 pr-2">
                        {row.feature}
                      </h3>
                      <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    </div>

                    {/* Tools Replaced */}
                    <div className="mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">Replaces:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {row.replaces.length > 0 ? (
                          row.replaces.map((tool, toolIndex) => {
                            const icon = toolIcons[tool];
                            if (!icon) return null;
                            return <ToolIconDisplay key={toolIndex} icon={icon} />;
                          })
                        ) : (
                          <span className="text-gray-400 text-xs sm:text-sm">—</span>
                        )}
                      </div>
                    </div>

                    {/* Price Comparison */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1">Other Tools</span>
                        <span className="text-sm sm:text-base font-semibold text-gray-700">
                          {row.unique ? (
                            <span className="italic text-gray-600">{row.otherToolsPrice}</span>
                          ) : (
                            row.otherToolsPrice
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-500 mb-1">Auditly 360</span>
                        <span className="text-xs sm:text-sm font-medium text-green-600">✓ Included</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Mobile Summary Card */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-gray-200 mt-6">
                  <div className="text-center mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">
                      Total Cost Comparison
                    </h3>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                      <div className="text-center">
                        <div className="text-xs sm:text-sm text-gray-500 mb-1 font-medium">
                          Multiple Tools Combined
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-gray-800">
                          {totalOtherToolsPrice}
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-[#ff4b01]/10 to-gray-50 rounded-lg p-3 sm:p-4 border-2 border-[#ff4b01]/30 relative">
                      <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2">
                        <span className="bg-[#ff4b01] text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Best Value
                        </span>
                      </div>
                      <div className="text-center mt-2">
                        <div className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">
                          Auditly 360
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-gray-900">
                          {auditly360Price}
                        </div>
                        <div className="text-xs sm:text-sm text-green-600 font-semibold mt-1">
                          Save 96%+
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Table View - Hidden on small screens, visible on md and up */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  {/* Header Row */}
                  <thead>
                    <tr className="border-b-2 border-green-500">
                      <th className="text-left px-4 md:px-6 lg:px-8 py-4 md:py-6 text-sm md:text-base lg:text-lg font-semibold text-gray-800">
                        Features
                      </th>
                      <th className="text-left px-4 md:px-6 lg:px-8 py-4 md:py-6 text-sm md:text-base lg:text-lg font-semibold text-gray-800">
                        Replaces
                      </th>
                      <th className="text-left px-4 md:px-6 lg:px-8 py-4 md:py-6 text-sm md:text-base lg:text-lg font-semibold text-gray-800">
                        Other Tools
                      </th>
                      <th className="text-right px-4 md:px-6 lg:px-8 py-4 md:py-6 text-sm md:text-base lg:text-lg font-semibold text-gray-800">
                        <div className="flex items-center justify-end">
                          <Image
                            src="/orange-black-auditly.png"
                            alt="Auditly 360"
                            width={120}
                            height={40}
                            className="h-8  w-auto"
                          />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  
                  {/* Body Rows */}
                  <tbody>
                    {features.map((row, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 md:px-6 lg:px-8 py-4 md:py-6 text-sm md:text-base lg:text-lg text-gray-800 font-medium">
                          {row.feature}
                        </td>
                        <td className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
                          <div className="flex flex-wrap gap-2 max-w-fit">
                            {row.replaces.length > 0 ? (
                              row.replaces.map((tool, toolIndex) => {
                                const icon = toolIcons[tool];
                                if (!icon) return null;
                                return <ToolIconDisplay key={toolIndex} icon={icon} />;
                              })
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 lg:px-8 py-4 md:py-6 text-sm md:text-base lg:text-lg text-gray-800 text-right">
                          {row.unique ? (
                            <span className="text-gray-600 italic">{row.otherToolsPrice}</span>
                          ) : (
                            <span>{row.otherToolsPrice}</span>
                          )}
                        </td>
                        <td className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
                          <div className="flex justify-end">
                            <CheckCircleIcon className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-green-500 flex-shrink-0" />
                          </div>
                        </td>
                      </tr>
                    ))}
                    
                    {/* Summary Row */}
                    <tr className="border-t-2 border-gray-300 bg-gray-50">
                      <td className="px-4 md:px-6 lg:px-8 py-4 md:py-6 text-sm md:text-base lg:text-lg font-semibold text-gray-800">
                        Overall Price
                      </td>
                      <td className="px-4 md:px-6 lg:px-8 py-4 md:py-6"></td>
                      <td className="px-4 md:px-6 lg:px-8 py-4 md:py-6 text-sm md:text-base lg:text-lg font-semibold text-gray-800 text-right">
                        {totalOtherToolsPrice}
                      </td>
                      <td className="px-4 md:px-6 lg:px-8 py-4 md:py-6 text-right">
                        <div className="inline-block bg-gray-100 px-4 py-2 md:px-6 md:py-3 rounded-lg border border-gray-200">
                          <span className="text-sm md:text-base lg:text-lg font-semibold text-gray-800">
                            {auditly360Price}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

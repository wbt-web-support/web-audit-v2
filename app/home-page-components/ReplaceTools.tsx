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
    color: "text-blue-600",
    bgColor: "bg-blue-50",
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
    color: "text-blue-600",
    bgColor: "bg-blue-50",
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
    color: "text-blue-600",
    bgColor: "bg-blue-50",
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
    color: "text-blue-600",
    bgColor: "bg-blue-50",
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
    <section className="relative max-w-[90rem] overflow-hidden mx-auto px-4 md:px-8 lg:px-12 py-12 md:py-16 lg:py-20 ">
      <div className="relative">
        {/* Dark Blue Top Section */}
        <div className="relative z-10 bg-[#2F00FF] rounded-t-3xl h-24 md:h-32 lg:h-40"></div>
        
        {/* White Table Section */}
        <div className="relative   mx-auto bg-white rounded-b-3xl  -mt-1">
        <div className=" relative z-20 -top-20 w-[90%] mx-auto bg-slate-100 rounded-3xl  -mt-1">
          <div className="overflow-x-auto">
            <table className="w-[90%] mx-auto">
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
                    <div className="flex items-center justify-end gap-2 md:gap-3">
                      <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden flex-shrink-0">
                        <div className="absolute left-0 top-0 w-1/2 h-full bg-blue-500"></div>
                        <div className="absolute right-0 top-0 w-1/2 h-full bg-black"></div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm md:text-base lg:text-lg font-semibold">Auditly</div>
                        <div className="text-sm md:text-base lg:text-lg font-semibold">360</div>
                      </div>
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
                      <div className="grid grid-cols-3 gap-2 max-w-fit">
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

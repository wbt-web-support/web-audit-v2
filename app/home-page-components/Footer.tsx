"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

interface NavColumn {
  title: string;
  links: { label: string; href: string }[];
}

const navColumns: NavColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it Works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
      { label: "Free Audit", href: "#free-audit" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "#help" },
      { label: "Contact", href: "#contact" },
      // { label: "Status", href: "#status" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#privacy" },
      { label: "Terms", href: "#terms" },
      
    ],
  },
  // {
  //   title: "Company",
  //   links: [
  //     { label: "About", href: "#about" },
  //     { label: "Teams", href: "#teams" },
  //     { label: "Contact", href: "#contact" },
  //   ],
  // },
];

export default function Footer() {
  const { isAuthenticated } = useAuth();
  
  return (
    <footer className="bg-black text-white">
      <div className="max-w-[90rem] mx-auto px-4 md:px-8 lg:px-12 py-12 md:py-16 lg:py-20">
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12 md:mb-16 lg:mb-20 gap-6 lg:gap-8">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              Audit Smarter. Fix Faster. Rank Higher
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-300">
              From SEO to security, get everything you need to optimize your site
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link 
              href={isAuthenticated ? '/dashboard' : '/login'}
              className="bg-white text-black font-semibold px-6 md:px-8 py-3 md:py-3.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200 whitespace-nowrap inline-block cursor-pointer"
            >
              Get started
            </Link>
          </div>
        </div>

        {/* Middle Section - Logo and Navigation */}
        <div className="mb-8 md:mb-12 lg:mb-16">
          <div className="flex flex-col lg:flex-row gap-8 md:gap-12 lg:gap-16">
            {/* Logo Section */}
            <div className="flex items-start">
              <Link href="#home" className="inline-block">
                <Image
                  src="/whitelogo.svg"
                  alt="Auditly360"
                  width={124}
                  height={43}
                  className="h-8 md:h-10 lg:h-12 w-auto"
                />
              </Link>
            </div>

            {/* Navigation Columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 lg:gap-16 flex-1">
              {navColumns.map((column, index) => (
                <div key={index}>
                  <h3 className="font-bold text-base md:text-lg mb-4 md:mb-5">
                    {column.title}
                  </h3>
                  <ul className="space-y-3 md:space-y-4">
                    {column.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <Link
                          href={link.href}
                          className="text-sm md:text-base text-gray-300 hover:text-white transition-colors duration-200"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="border-t border-gray-700 mb-8 md:mb-12"></div>

        {/* Bottom Section - Social Media and Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-8">
          {/* Social Media Links */}
          <div className="flex items-center gap-4 md:gap-6">
            <span className="text-base md:text-lg font-medium">Follow us</span>
            <div className="flex items-center gap-3 md:gap-4">
              {/* Twitter Icon */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
                aria-label="Twitter"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 text-black"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* Telegram Icon */}
              <a
                href="https://telegram.org"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
                aria-label="Telegram"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 text-black"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.613 7.59c-.12.54-.43.67-.87.42l-2.4-1.77-1.157.11c-.132.012-.254-.085-.254-.22l.014-2.8 4.346-3.92c.19-.168-.041-.261-.295-.095l-5.373 3.38-2.31-.72c-.5-.156-.513-.5.104-.76l9.046-3.49c.417-.158.782.092.647.548z" />
                </svg>
              </a>

              {/* Instagram Icon */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
                aria-label="Instagram"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 text-black"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 md:gap-4">
            
            <Link 
              href="#contact"
              className="bg-white text-black font-semibold px-5 md:px-6 py-2.5 md:py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200 whitespace-nowrap inline-block cursor-pointer"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

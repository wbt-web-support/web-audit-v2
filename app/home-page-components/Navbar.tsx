
"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search } from "lucide-react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="w-full border-b bg-white shadow-sm">
      <div className="mx-auto  flex max-w-7xl items-center justify-between  py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-1  text-xl font-semibold text-blue-500">
          <span className="bg-blue-500 text-white px-2 py-1 rounded-md">B</span>
          <span>Brullion</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8 mx-10">
          <Link href="/platform" className="text-gray-700 hover:text-blue-500">Platform</Link>
          <Link href="/solutions" className="text-gray-700 hover:text-blue-500">Solutions</Link>
          <Link href="/resources" className="text-gray-700 hover:text-blue-500">Resources</Link>
          <Link href="/company" className="text-gray-700 hover:text-blue-500">Company</Link>
        </div>

        {/* Search + Auth */}
        <div className="hidden md:flex items-center space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search or jump to..."
              className="pl-9 pr-3 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          </div>
          <Link href="/signin" className="px-3 py-1 text-gray-700 hover:text-blue-600">Sign in</Link>
          <Link href="/signup" className="px-4 py-1.5 bg-blue-500 text-white rounded-md hover:bg-white hover:text-blue-500 hover:border-blue-500 border-2 border-blue-500">Sign up →</Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="md:hidden flex flex-col space-y-3 px-6 pb-4">
          <Link href="/platform" className="text-gray-700">Platform</Link>
          <Link href="/solutions" className="text-gray-700">Solutions</Link>
          <Link href="/resources" className="text-gray-700">Resources</Link>
          <Link href="/company" className="text-gray-700">Company</Link>
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-3 py-1.5 border rounded-md text-sm focus:ring-1 focus:ring-blue-200 focus:outline-none w-full"
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          </div>
          <Link href="/signin" className="text-gray-700">Sign in</Link>
          <Link href="/signup" className="px-4 py-1.5 bg-blue-500  hover:text-blue-500 hover:bg-white hover:border-blue-500 border-2 border-blue-500  text-white rounded-md w-fit">Sign up →</Link>
        </div>
      )}
    </nav>
  );
}

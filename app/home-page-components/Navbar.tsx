// 'use client';

// import { motion } from 'framer-motion';
// import { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { useSupabase } from '@/contexts/SupabaseContext';

// export default function Navbar() {
//   const [isScrolled, setIsScrolled] = useState(false);
//   const [isHidden, setIsHidden] = useState(false);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [lastScrollY, setLastScrollY] = useState(0);
//   const { user, loading } = useSupabase();

//   useEffect(() => {
//     const handleScroll = () => {
//       const currentScrollY = window.scrollY;
      
//       // Check if scrolled down more than 50px
//       setIsScrolled(currentScrollY > 50);
      
//       // Hide navbar when scrolling down, show when scrolling up
//       // But don't hide if mobile menu is open
//       if (currentScrollY > lastScrollY && currentScrollY > 100 && !isMobileMenuOpen) {
//         setIsHidden(true);
//       } else {
//         setIsHidden(false);
//       }
      
//       // Close mobile menu when scrolling down
//       if (currentScrollY > lastScrollY && currentScrollY > 50 && isMobileMenuOpen) {
//         setIsMobileMenuOpen(false);
//       }
      
//       setLastScrollY(currentScrollY);
//     };
    
//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, [lastScrollY, isMobileMenuOpen]);

//   const navItems = [
//     { name: 'Features', href: '#features' },
//     { name: 'Pricing', href: '#pricing' },
//     { name: 'About', href: '#about' },
//     { name: 'Contact', href: '#contact' }
//   ];

//   return (
//     <motion.nav
//       initial={{ y: -100 }}
//       animate={{ 
//         y: isHidden ? -100 : 0
//       }}
//       transition={{ 
//         duration: 0.3,
//         ease: "easeInOut"
//       }}
//       className="fixed top-2 sm:top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-7xl px-2 sm:px-4"
//     >
//       <motion.div
//         className={`${
//           isScrolled 
//             ? 'bg-gray-900/95 backdrop-blur-md border border-gray-700' 
//             : 'bg-gray-800/90 backdrop-blur-sm border border-gray-600'
//         } shadow-2xl`}
//         animate={{
//           paddingTop: isMobileMenuOpen ? '0.75rem' : '0.75rem',
//           paddingBottom: isMobileMenuOpen ? '0.75rem' : '0.75rem',
//           paddingLeft: isMobileMenuOpen ? '1.25rem' : '1.25rem',
//           paddingRight: isMobileMenuOpen ? '1.25rem' : '1.25rem',
//           borderRadius: isMobileMenuOpen ? '0.375rem' : '9999px' // rounded-md = 0.375rem, rounded-full = 9999px
//         }}
//         transition={{
//           borderRadius: { duration: 0.2, ease: "easeInOut" },
//           paddingTop: { duration: 0.3, delay: isMobileMenuOpen ? 0.1 : 0, ease: "easeInOut" },
//           paddingBottom: { duration: 0.3, delay: isMobileMenuOpen ? 0.1 : 0, ease: "easeInOut" },
//           paddingLeft: { duration: 0.3, delay: isMobileMenuOpen ? 0.1 : 0, ease: "easeInOut" },
//           paddingRight: { duration: 0.3, delay: isMobileMenuOpen ? 0.1 : 0, ease: "easeInOut" }
//         }}
//         whileHover={{ scale: 1.02 }}
//       >
//         <div className="flex items-center justify-between">
//           {/* Logo */}
//           <motion.div
//             whileHover={{ scale: 1.05 }}
//             className="flex items-center space-x-2 sm:space-x-3"
//           >
//             <motion.div 
//               className="relative w-5 h-5"
//             >
//               {/* Overlapping Parallelograms */}
//               <div className="absolute w-4 h-3 bg-white transform rotate-12 top-0 left-0"></div>
//               <div className="absolute w-4 h-3 bg-white transform -rotate-12 top-0.5 left-0.5"></div>
//             </motion.div>
//             <motion.span 
//               className="font-bold text-white text-sm sm:text-base"
//             >
//               <span className="hidden sm:inline">WEB AUDIT</span>
//               <span className="sm:hidden">WA</span>
//             </motion.span>
//           </motion.div>

//           {/* Desktop Navigation */}
//           <motion.div 
//             className="hidden lg:flex items-center space-x-1"
//           >
//             {navItems.map((item, index) => (
//               <motion.a
//                 key={item.name}
//                 href={item.href}
//                 whileHover={{ scale: 1.05 }}
//                 initial={{ opacity: 0, y: -20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.5, delay: index * 0.1 }}
//                 className="px-2 py-1 text-gray-300 hover:text-white transition-colors duration-300 font-medium rounded-full hover:bg-gray-700/50 text-xs"
//               >
//                 {item.name}
//               </motion.a>
//             ))}
//           </motion.div>

//           {/* Right Side Buttons */}
//           <motion.div 
//             className="hidden sm:flex items-center space-x-2"
//           >
//             {loading ? (
//               // Show loading state
//               <motion.div
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 className="px-3 py-1 text-gray-400 text-xs"
//               >
//                 Loading...
//               </motion.div>
//             ) : user ? (
//               // Show Dashboard button when user is logged in
//               <Link href="/dashboard">
//                 <motion.button
//                   whileHover={{ scale: 1.05 }}
//                   whileTap={{ scale: 0.95 }}
//                   initial={{ opacity: 0, x: 20 }}
//                   animate={{ opacity: 1, x: 0 }}
//                   transition={{ duration: 0.5, delay: 0.4 }}
//                   className="px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-300 font-semibold border border-blue-500 text-xs"
//                 >
//                   <span className="hidden md:inline">Dashboard</span>
//                   <span className="md:hidden">Dashboard</span>
//                 </motion.button>
//               </Link>
//             ) : (
//               // Show Login and Sign Up buttons when user is not logged in
//               <>
//                 <Link href="/login">
//                   <motion.button
//                     whileHover={{ scale: 1.05 }}
//                     whileTap={{ scale: 0.95 }}
//                     initial={{ opacity: 0, x: 20 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ duration: 0.5, delay: 0.4 }}
//                     className="px-2 py-1 text-gray-300 hover:text-white transition-colors duration-300 font-medium rounded-full hover:bg-gray-700/50 text-xs"
//                   >
//                     Login
//                   </motion.button>
//                 </Link>
//                 <Link href="/signup">
//                   <motion.button
//                     whileHover={{ scale: 1.05 }}
//                     whileTap={{ scale: 0.95 }}
//                     initial={{ opacity: 0, x: 20 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ duration: 0.5, delay: 0.5 }}
//                     className="px-3 py-1 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors duration-300 font-semibold border border-gray-600 text-xs"
//                   >
//                     <span className="hidden md:inline">Sign Up</span>
//                     <span className="md:hidden">Sign Up</span>
//                   </motion.button>
//                 </Link>
//               </>
//             )}
//           </motion.div>

//           {/* Mobile Menu Button */}
//           <motion.button
//             whileTap={{ scale: 0.95 }}
//             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//             className="sm:hidden p-1 text-white"
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
//                 d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
//               />
//             </svg>
//           </motion.button>
//         </div>

//         {/* Mobile Menu */}
//         <motion.div
//           initial={{ opacity: 0, height: 0 }}
//           animate={{ 
//             opacity: isMobileMenuOpen ? 1 : 0, 
//             height: isMobileMenuOpen ? 'auto' : 0 
//           }}
//           transition={{ duration: 0.3 }}
//           className="sm:hidden overflow-hidden mt-2"
//         >
//           <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-3 space-y-2 border border-gray-600">
//             {navItems.map((item, index) => (
//               <motion.a
//                 key={item.name}
//                 href={item.href}
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ 
//                   opacity: isMobileMenuOpen ? 1 : 0, 
//                   x: isMobileMenuOpen ? 0 : -20 
//                 }}
//                 transition={{ duration: 0.3, delay: index * 0.1 }}
//                 className="block px-3 py-1.5 text-gray-300 hover:text-white transition-colors duration-300 font-medium rounded-full hover:bg-gray-700/50 text-sm"
//                 onClick={() => setIsMobileMenuOpen(false)}
//               >
//                 {item.name}
//               </motion.a>
//             ))}
//             <div className="pt-1 space-y-1">
//               {loading ? (
//                 // Show loading state
//                 <motion.div
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ 
//                     opacity: isMobileMenuOpen ? 1 : 0, 
//                     y: isMobileMenuOpen ? 0 : 20 
//                   }}
//                   transition={{ duration: 0.3, delay: 0.4 }}
//                   className="w-full px-3 py-1.5 text-gray-400 text-sm text-center"
//                 >
//                   Loading...
//                 </motion.div>
//               ) : user ? (
//                 // Show Dashboard button when user is logged in
//                 <Link href="/dashboard">
//                   <motion.button
//                     whileTap={{ scale: 0.95 }}
//                     initial={{ opacity: 0, y: 20 }}
//                     animate={{ 
//                       opacity: isMobileMenuOpen ? 1 : 0, 
//                       y: isMobileMenuOpen ? 0 : 20 
//                     }}
//                     transition={{ duration: 0.3, delay: 0.4 }}
//                     className="w-full px-4 py-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-300 font-semibold border border-blue-500 text-sm"
//                     onClick={() => setIsMobileMenuOpen(false)}
//                   >
//                     Dashboard
//                   </motion.button>
//                 </Link>
//               ) : (
//                 // Show Login and Sign Up buttons when user is not logged in
//                 <>
//                   <Link href="/login">
//                     <motion.button
//                       whileTap={{ scale: 0.95 }}
//                       initial={{ opacity: 0, y: 20 }}
//                       animate={{ 
//                         opacity: isMobileMenuOpen ? 1 : 0, 
//                         y: isMobileMenuOpen ? 0 : 20 
//                       }}
//                       transition={{ duration: 0.3, delay: 0.4 }}
//                       className="w-full px-3 py-1.5 text-gray-300 hover:text-white transition-colors duration-300 font-medium rounded-full hover:bg-gray-700/50 text-sm"
//                       onClick={() => setIsMobileMenuOpen(false)}
//                     >
//                       Login
//                     </motion.button>
//                   </Link>
//                   <Link href="/signup">
//                     <motion.button
//                       whileTap={{ scale: 0.95 }}
//                       initial={{ opacity: 0, y: 20 }}
//                       animate={{ 
//                         opacity: isMobileMenuOpen ? 1 : 0, 
//                         y: isMobileMenuOpen ? 0 : 20 
//                       }}
//                       transition={{ duration: 0.3, delay: 0.5 }}
//                       className="w-full px-4 py-1.5 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors duration-300 font-semibold border border-gray-600 text-sm"
//                       onClick={() => setIsMobileMenuOpen(false)}
//                     >
//                       Sign Up
//                     </motion.button>
//                   </Link>
//                 </>
//               )}
//             </div>
//           </div>
//         </motion.div>
//       </motion.div>
//     </motion.nav>
//   );
// }


// components/Navbar.tsx
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
        <div className="hidden md:flex items-center space-x-8">
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

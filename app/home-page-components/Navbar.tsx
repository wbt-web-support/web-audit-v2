"use client";

import Link from 'next/link'
import Image from 'next/image'
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function Navbar() {
  const [isHeroSection, setIsHeroSection] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();

  const items = [
    {
      name: 'Home',
      href: '#home'
    },
    {
      name: 'Features',
      href: '#features'
    },
    {
      name: 'Pricing',
      href: '#pricing'
    },
    {
      name: 'How it Works',
      href: '#how-it-works'
    },
    {
      name: 'Testimonials',
      href: '#testimonials'
    },
    
  ]

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px 0px 0px', // Trigger when section is near top
      threshold: 0.1
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Check if it's the home/hero section
          if (entry.target.id === 'home') {
            setIsHeroSection(true);
          } else {
            setIsHeroSection(false);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all sections
    const sections = ['home', 'features', 'pricing', 'replace-tools', 'how-it-works', 'testimonials', 'contact'];
    sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        observer.observe(element);
      }
    });

    // Also check initial scroll position
    const checkInitialPosition = () => {
      const homeSection = document.getElementById('home');
      if (homeSection) {
        const rect = homeSection.getBoundingClientRect();
        setIsHeroSection(rect.top <= 150 && rect.bottom >= 0);
      }
    };

    checkInitialPosition();
    window.addEventListener('scroll', checkInitialPosition);

    return () => {
      sections.forEach((sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
          observer.unobserve(element);
        }
      });
      window.removeEventListener('scroll', checkInitialPosition);
    };
  }, []);

  // Handle navbar show/hide on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show navbar when at the top of the page
      if (currentScrollY < 100) {
        setIsVisible(true);
      } else {
        // Hide when scrolling down, show when scrolling up
        if (currentScrollY > lastScrollY) {
          // Scrolling down
          setIsVisible(false);
        } else {
          // Scrolling up
          setIsVisible(true);
        }
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Close mobile menu when link is clicked
      setIsMobileMenuOpen(false);
    }
  };

  // Navbar styling based on section
  const navbarClasses = isHeroSection
    ? 'bg-white/10 backdrop-blur-sm' // Dark hero section style
    : 'bg-white/95 backdrop-blur-md shadow-md'; // Light sections style

  const textClasses = isHeroSection
    ? 'text-white hover:text-[#ff4b01]/80' // White text for dark background
    : 'text-gray-800 hover:text-[#ff4b01]'; // Dark text for light background


  const buttonClasses = isHeroSection
    ? 'bg-transparent border border-white text-white hover:bg-white/10'
    : 'bg-[#ff4b01] border border-[#ff4b01] text-white hover:bg-[#e64401]';

  const secondaryButtonClasses = isHeroSection
    ? 'bg-white/10 border border-white/50 text-white hover:bg-white/20'
    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50';

  return (
    <>
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(20px);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
      <div 
        className={`max-w-[90rem] mx-auto flex justify-between items-center fixed top-0 left-0 right-0 z-[100] mt-2 sm:mt-4 md:mt-8 px-3 sm:px-4 md:px-6 lg:px-8 transition-all duration-500 ease-in-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        {/* Logo */}
        <Link 
          href="/#home" 
          onClick={(e) => handleSmoothScroll(e, '/#home')} 
          className="relative z-[101] cursor-pointer "
        >
          <span className="relative inline-block">
            <span className="absolute inset-0 rounded-lg"></span>
            <Image
              src={isHeroSection ? '/white-orange-auditly.png' : '/orange-black-auditly.png'}
              alt="Auditly360"
              width={124}
              height={43}
              className="relative h-8 sm:h-9 md:h-10 w-auto "
              priority
            />
          </span>
        </Link>

        {/* Desktop Navigation - Hidden on mobile */}
        <div className={`hidden md:flex items-center justify-between py-2 md:py-3 px-4 md:px-8 lg:px-12 ${navbarClasses} gap-4 lg:gap-8 xl:gap-12 rounded-xl md:rounded-2xl transition-all duration-300 hover:shadow-lg`}>
          {items.map((item) => (
            <Link 
              href={item.href} 
              key={item.name} 
              onClick={(e) => handleSmoothScroll(e, item.href)}
              className={` relative text-xs md:text-sm lg:text-base font-medium ${textClasses} transition-all duration-300 cursor-pointer whitespace-nowrap py-1 overflow-hidden`}
            >
              <span className="relative z-10">{item.name}</span>
              <span className={`absolute bottom-0 left-0 h-0.5 w-0 ${isHeroSection ? 'bg-[#ff4b01]/80' : 'bg-[#ff4b01]'} transition-all duration-300 group-hover:w-full`}></span>
              <span className={`absolute inset-0 ${isHeroSection ? 'bg-white/5' : 'bg-[#ff4b01]/10'} scale-0 group-hover:scale-100 transition-transform duration-300 rounded-md -z-10`}></span>
            </Link>
          ))}
        </div>

        {/* Desktop Buttons - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-2 md:gap-3">
          {!loading && (
            <>
              {isAuthenticated ? (
                <Link 
                  href="/dashboard"
                  className={`${buttonClasses} px-4 md:px-6 lg:px-8 py-2 md:py-2.5 lg:py-3 rounded-xl md:rounded-2xl cursor-pointer transition-all duration-300 whitespace-nowrap text-sm md:text-base relative overflow-hidden group hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl`}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                  <span className="relative z-10 font-semibold">Dashboard</span>
                </Link>
              ) : (
                <Link 
                  href="/signup"
                  className={`${buttonClasses} px-4 md:px-6 lg:px-8 py-2 md:py-2.5 lg:py-3 rounded-xl md:rounded-2xl cursor-pointer transition-all duration-300 whitespace-nowrap text-sm md:text-base relative overflow-hidden group hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl`}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                  <span className="relative z-10 font-semibold">Get Started</span>
                </Link>
              )}
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`md:hidden z-[101] p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 ${
            isHeroSection 
              ? 'text-white hover:bg-white/10' 
              : 'text-gray-800 hover:bg-gray-100'
          }`}
          aria-label="Toggle menu"
        >
          <div className="relative w-6 h-6">
            <span className={`absolute top-0 left-0 w-full h-0.5 ${isHeroSection ? 'bg-white' : 'bg-gray-800'} transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2.5' : ''}`}></span>
            <span className={`absolute top-2.5 left-0 w-full h-0.5 ${isHeroSection ? 'bg-white' : 'bg-gray-800'} transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
            <span className={`absolute top-5 left-0 w-full h-0.5 ${isHeroSection ? 'bg-white' : 'bg-gray-800'} transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2.5' : ''}`}></span>
          </div>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-[99] md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Menu - Simple Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-[280px] sm:w-[300px] bg-white z-[100] md:hidden transform transition-transform duration-300 ease-out shadow-xl ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200/50">
            <Link 
              href="#home" 
              onClick={(e) => {
                handleSmoothScroll(e, '#home');
                setIsMobileMenuOpen(false);
              }} 
              className="relative"
            >
              <Image
                src="/orange-black-auditly.png"
                alt="Auditly360"
                width={124}
                height={43}
                className="h-8 w-auto transition-opacity duration-300"
                priority
              />
            </Link>
            
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg transition-colors duration-200 text-gray-800 hover:bg-gray-100"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 py-4 overflow-y-auto">
            {items.map((item) => (
              <Link 
                href={item.href} 
                key={item.name} 
                onClick={(e) => handleSmoothScroll(e, item.href)}
                className="relative block px-6 py-3 text-gray-800 hover:text-[#ff4b01] transition-all duration-200 overflow-hidden"
              >
                <span className="relative z-10">{item.name}</span>
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#ff4b01] transition-all duration-300 group-hover:w-full"></span>
                <span className="absolute inset-0 bg-[#ff4b01]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="p-4 border-t border-gray-200/50 space-y-3">
            {!loading && (
              <>
                {isAuthenticated ? (
                  <Link 
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="bg-[#ff4b01] border border-[#ff4b01] text-white hover:bg-[#e64401] block w-full px-6 py-3 rounded-lg text-base font-medium text-center transition-colors duration-200"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link 
                    href="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="bg-[#ff4b01] border border-[#ff4b01] text-white hover:bg-[#e64401] block w-full px-6 py-3 rounded-lg text-base font-medium text-center transition-colors duration-200"
                  >
                    Get Started
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

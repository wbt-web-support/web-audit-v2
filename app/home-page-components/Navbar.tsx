"use client";

import Link from 'next/link'
import React, { useState, useEffect } from 'react'

export default function Navbar() {
  const [isHeroSection, setIsHeroSection] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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
    {
      name: 'Contact',
      href: '#contact'
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
    }
  };

  // Navbar styling based on section
  const navbarClasses = isHeroSection
    ? 'bg-white/10 backdrop-blur-sm' // Dark hero section style
    : 'bg-white/95 backdrop-blur-md shadow-md'; // Light sections style

  const textClasses = isHeroSection
    ? 'text-white hover:text-blue-200' // White text for dark background
    : 'text-gray-800 hover:text-blue-600'; // Dark text for light background

  const logoClasses = isHeroSection
    ? 'text-[#0D52FF]' // Blue logo for dark background
    : 'text-[#0D52FF]'; // Keep blue logo (or adjust if needed)

  const buttonClasses = isHeroSection
    ? 'bg-transparent border border-white text-white hover:bg-white/10'
    : 'bg-blue-600 border border-blue-600 text-white hover:bg-blue-700';

  return (
    <div 
      className={`max-w-[90rem] mx-auto flex justify-between items-center fixed top-0 left-0 right-0 z-[100] mt-8 px-4 md:px-8 transition-opacity duration-300 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <Link 
        href="#home" 
        onClick={(e) => handleSmoothScroll(e, '#home')} 
        className={`${logoClasses} text-2xl font-bold cursor-pointer transition-colors duration-300`}
      >
        Auditly360
      </Link>
      <div className={`Items justify-between py-4 px-8 md:px-16 ${navbarClasses} gap-8 md:gap-12 flex flex-row rounded-2xl transition-all duration-300`}>
        {items.map((item) => (
          <Link 
            href={item.href} 
            key={item.name} 
            onClick={(e) => handleSmoothScroll(e, item.href)}
            className={`text-sm md:text-md font-medium ${textClasses} transition-colors duration-300 cursor-pointer`}
          >
            {item.name}
          </Link>
        ))}
      </div>
      <div className="get-started-button cursor-pointer hidden md:block">
        <button 
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className={`${buttonClasses} px-6 md:px-8 py-2.5 md:py-4 rounded-2xl cursor-pointer transition-all duration-300 whitespace-nowrap`}
        >
          Get Started
        </button>
      </div>
    </div>
  )
}

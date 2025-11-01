'use client';

import React from 'react';
import LightRays from '../utils/LightRays';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <div className='relative ' style={{ backgroundColor: '#0B1421' }}>
    <div className='min-h-screen relative overflow-hidden ' >
      {/* Background LightRays */}
      <div className="absolute inset-0 w-full h-full z-10">
        <LightRays
          raysOrigin="bottom-center"
          raysColor="#455bd6"
          raysSpeed={1.2}
          lightSpread={1}
          rayLength={3}
          followMouse={false}
          mouseInfluence={0.1}
          noiseAmount={0.4}
          distortion={0.04}
          className="custom-rays"
        />
      </div>
      <div className="absolute inset-0 w-full h-full z-0  left-1/2 -translate-x-1/2">
         <Image src='/images/home-page/star.png' alt='hero-image' width={900} height={900} className="w-full h-full opacity-30" />
      </div>

      {/* Content Layer */}
      <div className="relative flex flex-col text-white z-10 min-h-screen pt-48">
        <div className="content mx-auto text-center  ">
          <div className="batch flex flex-row border border-white/10 rounded-full  p-2 text-center justify-center items-center w-fit mx-auto">
            <div className='text-md bg-white/10 rounded-full px-4 py-2' >
              <span className=' raleway'>AI Powered</span>
            </div>
            <div className='text-sm text-extra-light text-white/50 p-2 text-center justify-center items-center' >
              <span>Explore the future of website audits</span>
            </div>
          </div>
          <div className="content-text mt-4 text-center flex flex-col items-center justify-center gap-8">
            <h1  className='text-7xl  flex flex-col items-center justify-center ' >
              <span className='text-white font-semibold raleway'>Your Website, Audited </span>
              <span className='text-white font-semibold raleway'>in Seconds </span>
            </h1>
            <p className='text-white/50 text-2xl flex flex-col items-center justify-center' >
              <span className=' raleway'>Uncover SEO, performance, and security issues</span>
              <span className=' raleway'>  instantly with AI-powered audits.</span>
            </p>
            <button className='bg-white text-black px-10 py-2 rounded-full mx-auto '>Get Started</button>
          </div>
        </div>
      </div>
    </div>
    <div className="iamges mx-auto -mt-46 max-w-[90rem] bg-[#D9D9D9] rounded-t-lg px-6 pt-6 relative z-[60]">
      <Image src='/images/home-page/hero-sec.png' alt='hero-image' width={1200} height={1200} className='rounded-t-lg shadow-lg w-full' />
    </div>
    </div>
  )
}


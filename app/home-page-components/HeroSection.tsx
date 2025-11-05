'use client';

import React from 'react';
import LightRays from '../utils/LightRays';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <div className='relative ' style={{ backgroundColor: '#0B1421' }}>
    <div className='min-h-screen px-4 relative overflow-hidden ' >
      {/* Background LightRays */}
      <div className="absolute inset-0 w-full h-full z-10">
        <LightRays
          raysOrigin="bottom-center"
          raysColor="#2647b5"
          raysSpeed={1.4}
          lightSpread={0.8}
          rayLength={4}
          followMouse={false}
          mouseInfluence={0.1}
          noiseAmount={0.2}
          distortion={0.2}
          className="custom-rays"
        />
      </div>
      <div className=" hidden md:block absolute inset-0  z-0  left-1/2 -translate-x-1/2 ">
         <Image src='/images/home-page/star.png' alt='hero-image' width={1000} height={1000} className="w-full h-full opacity-30 " />
      </div>

      {/* Content Layer */}
      <div className="relative flex flex-col text-white z-10 min-h-screen pt-48 ">
        <div className="content mx-auto text-center  ">
          <div className="batch flex flex-row border border-white/10 rounded-full  p-2  text-center justify-center items-center w-fit mx-auto">
            <div className='text-md bg-white/10 rounded-full px-2 md:px-4 lg:px-5 py-2 ' >
              <span className='text-sm md:text-base  raleway'>AI Powered</span>
            </div>
            <div className='text-xs  text-extra-light text-white/50 p-2 md:p-2.5 text-center justify-center items-center' >
              <span>Explore the future of website audits</span>
            </div>
          </div>
          <div className="content-text mt-4 md:mt-6  text-center flex flex-col items-center justify-center gap-8 ">
            <h1  className='text-5xl md:text-7xl max-w-2xl flex flex-col items-center raleway justify-center font-bold' >
              Your Website, Audited 
              in Seconds 
            </h1>
            <p className='text-white/50 text-sm md:text-base lg:text-lg  raleway flex flex-col items-center justify-center max-w-xl md:max-w-lg px-4' >
           Uncover SEO, performance, and security Issues
               instantly with AI-powered audits.
            </p>
            <button className='bg-white text-black px-10 md:px-12 lg:px-16 py-2 md:py-3 lg:py-3.5 rounded-full mx-auto text-sm md:text-base lg:text-lg font-medium hover:bg-white/90 transition-colors'>Get Started</button>
          </div>
        </div>
      </div>
    </div>
    <div className="iamges mx-4 md:mx-auto -mt-28 md:-mt-46 lg:-mt-52 xl:-mt-60 max-w-[90rem] bg-[#D9D9D9] rounded-t-lg px-6 md:px-8 lg:px-10 pt-6 md:pt-8 lg:pt-10 relative z-[60] lg:block">
      <Image src='/images/home-page/hero-sec.png' alt='hero-image' width={1200} height={1200} className='rounded-t-lg shadow-lg w-full' />
    </div>
    </div>
  )
}


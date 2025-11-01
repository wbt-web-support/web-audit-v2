import React from 'react'
import CommingSoon from './home-page-components/CommingSoon'
import HeroSection from './home-page-components/HeroSection'
import Navbar from './home-page-components/Navbar'
import WhyChooseUsSection from './home-page-components/WhyChooseUsSection'


export default function page() {
  return (
    <div>
      {/* <CommingSoon /> */}
      <Navbar />
      <HeroSection />
      <WhyChooseUsSection />
    </div>
  )
}
import React from 'react'
import CommingSoon from './home-page-components/CommingSoon'
import HeroSection from './home-page-components/HeroSection'
import Navbar from './home-page-components/Navbar'
import WhyChooseUsSection from './home-page-components/WhyChooseUsSection'
import PricingSection from './home-page-components/PricingSection'
import ReplaceTools from './home-page-components/ReplaceTools'
import Steps from './home-page-components/Steps'
import Testimonials from './home-page-components/Testimonials'
import Footer from './home-page-components/Footer'



export default function page() {
  return (
    <div className='overflow-x-hidden'>
      {/* <CommingSoon /> */}
      <Navbar />
      <section id="home">
        <HeroSection />
      </section>
      <section id="features">
        <WhyChooseUsSection />
      </section>
      <PricingSection />
      <section id="replace-tools">
        <ReplaceTools />
      </section>
      <section id="how-it-works">
        <Steps />
      </section>
      <section id="testimonials">
        <Testimonials />
      </section>
      <section id="contact">
        <Footer />
      </section>
    </div>
  )
}
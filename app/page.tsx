import Navbar from './home-page-components/Navbar';
import HeroSection from './home/heroSection';
import FeaturesSection from './home-page-components/FeaturesSection';
import StatsSection from './home-page-components/StatsSection';
import PricingSection from './home-page-components/PricingSection';
import CallToActionSection from './home-page-components/CallToActionSection';
import FooterSection from './home-page-components/FooterSection';
import FeatureSection from './home/FeatureSection';
import WorkflowSection from './home/WorkflowSection';
import RevenueSection from './home/RevenueSection';
import TrustSection from './home/TrustSection';
import ComplianceSection from './home/ComplianceSection';
import IntegrationSection from './home/IntegrationSection';
import Testimony from './home/Testimony';
import SignupSection from './home/SignupSection';
import Footer from './home/Footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* <Navbar />
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <PricingSection />
      <CallToActionSection />
      <FooterSection /> */}

      {/* started from hhere  */}

      <Navbar/>
      <HeroSection    />
      <FeatureSection/>
      <WorkflowSection/>
      <RevenueSection/> 
          <TrustSection/>
          <ComplianceSection/>
          <IntegrationSection/>
          <Testimony/>
          <SignupSection/>
          <Footer/>
    </main>
  );
}

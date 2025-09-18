import Navbar from './home-page-components/Navbar';
import HeroSection from './home-page-components/HeroSection';
import FeaturesSection from './home-page-components/FeaturesSection';
import StatsSection from './home-page-components/StatsSection';
import PricingSection from './home-page-components/PricingSection';
import CallToActionSection from './home-page-components/CallToActionSection';
import FooterSection from './home-page-components/FooterSection';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <PricingSection />
      <CallToActionSection />
      <FooterSection />
    </main>
  );
}

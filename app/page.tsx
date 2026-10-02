import { Header } from '@/components/header';
import MarqueeBanner from '@/components/marquee-banner';
import HeroSection from '@/components/hero-section';
import AboutSection from '@/components/about-section';
import TokenomicsSection from '@/components/tokenomics-section';
import RoadmapSection from '@/components/roadmap-section';
import FAQSection from '@/components/faq';
import FooterSection from '@/components/footer-section';
import KennelClubSection from '@/components/kennel-club';
import AirdropMechanismsSection from '@/components/airdrop-mechanisms';
import TeamSection from '@/components/team-section';
import PageLoader from '@/components/page-loader';

export default function Home() {
  return (
    <PageLoader>
      <main className='min-h-screen bg-background'>
        <Header />
        {/* <HeroSection /> */}
        {/* Wrapper for Hero, About, and Tokenomics with unified background */}
        <div className='relative'>
          {/* Unified Background Effects */}
          <div className='absolute inset-0 bg-background' />
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(0,243,255,0.15),transparent_50%)]' />
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(188,19,254,0.15),transparent_50%)]' />
          
          {/* Sections */}
          <div className='relative z-10'>
            <HeroSection />
            <AboutSection />
            <MarqueeBanner />
            <TokenomicsSection />
            <KennelClubSection />
          </div>
        </div>
        <MarqueeBanner />
        <AirdropMechanismsSection />
        <RoadmapSection />
        <TeamSection />
        <FAQSection/>
        <FooterSection />
      </main>
    </PageLoader>
  );
}

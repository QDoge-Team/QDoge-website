import type { Metadata } from 'next';
import FooterSection from '@/components/footer-section';
import { Header } from '@/components/header';
import PageLoader from '@/components/page-loader';
import { TokenHoldersPageContent } from '@/components/token-holders-page-content';

export const metadata: Metadata = {
  title: 'Token Holders | QDOGE',
  description:
    'Live on-chain distribution of QDOGE and QTREAT token holders on the Qubic network: rankings, supply breakdown, and distribution map.',
};

export default function HoldersPage() {
  return (
    <PageLoader>
      <main className='min-h-screen bg-black'>
        <Header />
        <TokenHoldersPageContent />
        <FooterSection />
      </main>
    </PageLoader>
  );
}

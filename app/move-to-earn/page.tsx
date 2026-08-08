import type { Metadata } from 'next';
import FooterSection from '@/components/footer-section';
import { Header } from '@/components/header';
import { MoveToEarnPageContent } from '@/components/move-to-earn-page-content';
import PageLoader from '@/components/page-loader';

export const metadata: Metadata = {
  title: 'Move to Earn | QDOGE',
  description:
    'Earn QUBIC by moving: verified steps decide your share of real mining income from the QDOGE rig, paid out every Qubic epoch. No on-device mining, no battery drain.',
};

export default function MoveToEarnPage() {
  return (
    <PageLoader>
      <main className='min-h-screen bg-black'>
        <Header />
        <MoveToEarnPageContent />
        <FooterSection />
      </main>
    </PageLoader>
  );
}

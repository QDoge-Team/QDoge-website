import type { Metadata } from 'next';
import { DividendsPageContent } from '@/components/dividends-page-content';
import FooterSection from '@/components/footer-section';
import { Header } from '@/components/header';
import PageLoader from '@/components/page-loader';

export const metadata: Metadata = {
  title: 'QTREAT Dividends | QDOGE',
  description:
    'QTREAT dividend history: weekly QUBIC payouts per token, total distributed, and yield comparison against other dividend-paying Qubic projects.',
};

export default function DividendsPage() {
  return (
    <PageLoader>
      <main className='min-h-screen bg-black'>
        <Header />
        <DividendsPageContent />
        <FooterSection />
      </main>
    </PageLoader>
  );
}

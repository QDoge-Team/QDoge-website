import type { Metadata } from 'next';
import { DogeStatsPageContent } from '@/components/doge-stats-page-content';
import FooterSection from '@/components/footer-section';
import { Header } from '@/components/header';
import PageLoader from '@/components/page-loader';

export const metadata: Metadata = {
  title: 'Doge Mining Stats | QDOGE',
  description:
    'Live stats for the QDoge ASIC miner on ViaBTC: hashrate, workers, and DOGE merged-mining earnings.',
};

export default function DogeStatsPage() {
  return (
    <PageLoader>
      <main className='min-h-screen bg-black'>
        <Header />
        <DogeStatsPageContent />
        <FooterSection />
      </main>
    </PageLoader>
  );
}

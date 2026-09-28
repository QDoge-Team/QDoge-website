import type { Metadata } from 'next';
import { QubicConnectProvider } from '@/components/connect/QubicConnectContext';
import { WalletConnectProvider } from '@/components/connect/WalletConnectContext';
import FooterSection from '@/components/footer-section';
import { Header } from '@/components/header';
import PageLoader from '@/components/page-loader';
import { StakingPageContent } from '@/components/staking-page-content';

export const metadata: Metadata = {
  title: 'QTREAT Staking | QDOGE',
  description: 'Stake QDOGE into the QTREAT smart contract and earn QTREAT bonus rewards.',
};

export default function StakingPage() {
  return (
    <PageLoader>
      <main className="min-h-screen bg-black">
        <Header />
        <WalletConnectProvider>
          <QubicConnectProvider>
            <StakingPageContent />
          </QubicConnectProvider>
        </WalletConnectProvider>
        <FooterSection />
      </main>
    </PageLoader>
  );
}

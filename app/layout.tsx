import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google';
import './globals.css';
import './styles.css';

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'QDOGE',
  description: 'QDOGE AI CYBER SHIBA TRAINER',
  /**
   * No metadataBase: join icon URLs to it breaks favicons when the visit host
   * does not match (custom domain vs VERCEL_URL, localhost vs 127.0.0.1, etc.).
   */
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-icon.png', type: 'image/png', sizes: '512x512' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${geistMono.className} antialiased`}>{children}</body>
    </html>
  );
}

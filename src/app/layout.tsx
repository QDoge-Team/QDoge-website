import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/provider";
import LoadingIndicator from "@/components/Loading";

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "QDoge Casino",
  description: "Play-to-Earn Casino by QDoge on Qubic",
  icons: { icon: "/assets/image/qdoge-logo-small.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistMono.variable} font-mono max-w-[1920px] bg-black mx-auto antialiased`}>
        <Providers>
          <LoadingIndicator />
          {children}
        </Providers>
      </body>
    </html>
  );
}

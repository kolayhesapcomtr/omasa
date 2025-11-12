import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Omasa - QR Menü ve Restoran Yönetimi',
  description: 'QR menü, sipariş alma, adisyon ve ödeme sistemi',
  keywords: ['qr menü', 'restoran', 'cafe', 'sipariş', 'adisyon', 'ödeme'],
  authors: [{ name: 'Omasa' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

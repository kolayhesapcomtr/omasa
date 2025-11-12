import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

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
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

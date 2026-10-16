import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Smart Flood Detection System',
  description:
    'Real-time IoT dashboard for monitoring water levels and flood risk using ultrasonic sensors.',
  keywords: ['IoT', 'flood detection', 'water level', 'monitoring', 'ESP32'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f1f5f9" />
      </head>
      <body className={`${poppins.className} min-h-screen bg-bg-dark text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}

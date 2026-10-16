import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className="min-h-screen bg-bg-dark text-white antialiased">
        {children}
      </body>
    </html>
  );
}

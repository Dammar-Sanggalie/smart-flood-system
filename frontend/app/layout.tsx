import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Smart Flood Detection System — IoT Telemetry Dashboard',
  description:
    'Real-time IoT engineering dashboard for precision water level monitoring, tank capacity analysis, and flood risk detection using ultrasonic sensors.',
  keywords: ['IoT', 'flood detection', 'water level', 'telemetry', 'ESP32', 'sensor monitoring'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-sky-100 selection:text-sky-900">
        {children}
      </body>
    </html>
  );
}

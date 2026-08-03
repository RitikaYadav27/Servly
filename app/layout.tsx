import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SERVLY — Every Local Service. One App.',
  description: "India's intelligent hyperlocal marketplace for verified, quality local services.",
  keywords: ['local services', 'home services', 'verified professionals', 'India'],
  openGraph: { title: 'SERVLY', description: 'Every Local Service. One App.', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'SERVLY', description: 'Every Local Service. One App.' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" /></head><body>{children}</body></html> }

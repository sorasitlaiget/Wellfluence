import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wellfluence - Health & Beauty Influencer Marketing Platform',
  description: 'The premier B2B2C influencer marketing platform connecting health and wellness brands with influential individuals and their followers.',
  keywords: ['Wellfluence', 'influencer marketing', 'health influencer', 'beauty influencer', 'wellness marketing', 'B2B2C', 'health tech'],
  openGraph: {
    title: 'Wellfluence - Health & Beauty Influencer Marketing Platform',
    description: 'The premier B2B2C influencer marketing platform connecting health and wellness brands with influential individuals and their followers.',
    url: 'https://wellfluence.com', // Replace with actual domain
    siteName: 'Wellfluence',
    images: [
      {
        url: 'https://via.placeholder.com/1200x630?text=Wellfluence+OG', // Replace with actual OG image
        width: 1200,
        height: 630,
        alt: 'Wellfluence - Connecting Health & Beauty',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wellfluence - Health & Beauty Influencer Marketing Platform',
    description: 'The premier B2B2C influencer marketing platform connecting health and wellness brands with influential individuals and their followers.',
    images: ['https://via.placeholder.com/1200x675?text=Wellfluence+Twitter'], // Replace with actual Twitter image
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  creator: 'Wellfluence Team',
  publisher: 'Wellfluence Team',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
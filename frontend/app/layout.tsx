import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wellfluence - Health & Wellness Influencer Marketing Platform',
  description: 'Wellfluence is the premier hub connecting health and wellness brands with credible and influential content creators.',
  keywords: ['health', 'wellness', 'influencer marketing', 'brand', 'influencer', 'fitness', 'nutrition', 'mental health', 'beauty'],
  openGraph: {
    title: 'Wellfluence - Health & Wellness Influencer Marketing Platform',
    description: 'Wellfluence is the premier hub connecting health and wellness brands with credible and influential content creators.',
    url: 'https://www.wellfluence.com', // Replace with actual domain
    siteName: 'Wellfluence',
    images: [
      {
        url: 'https://via.placeholder.com/1200x630/22c55e/ffffff?text=Wellfluence', // Placeholder for OG image
        width: 1200,
        height: 630,
        alt: 'Wellfluence - Health & Wellness Influencer Marketing Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wellfluence - Health & Wellness Influencer Marketing Platform',
    description: 'Wellfluence is the premier hub connecting health and wellness brands with credible and influential content creators.',
    creator: '@wellfluence', // Replace with actual Twitter handle
    images: ['https://via.placeholder.com/1200x675/22c55e/ffffff?text=Wellfluence'], // Placeholder for Twitter image
  },
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
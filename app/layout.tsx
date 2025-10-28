import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SupabaseProvider } from "@/contexts/SupabaseContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Auditly360 - Complete Website Audit & Analysis Platform | SEO, Performance & Security",
  description: "Our platform delivers a complete website audit in just minutes. From single-page checks to full-site crawls, we analyze content, SEO, performance, branding, and security risks. Get insights on hidden URLs, broken links, image optimization, exposed keys, Google tags, and social previews—along with actionable fixes to improve your site's quality, speed, and visibility.",
  keywords: [
    "website audit",
    "SEO analysis",
    "website performance",
    "security audit",
    "website analysis tool",
    "broken link checker",
    "image optimization",
    "Google tags audit",
    "website crawler",
    "content analysis",
    "branding audit",
    "website quality check",
    "site speed test",
    "website visibility",
    "auditly360"
  ],
  authors: [{ name: "Auditly360" }],
  creator: "Auditly360",
  publisher: "Auditly360",
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://auditly360.com',
    siteName: 'Auditly360',
    title: 'Auditly360 - Complete Website Audit & Analysis Platform',
    description: 'Our platform delivers a complete website audit in just minutes. From single-page checks to full-site crawls, we analyze content, SEO, performance, branding, and security risks.',
    images: [
      {
        url: 'https://auditly360.com/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Auditly360 - Complete Website Audit Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@auditly360',
    creator: '@auditly360',
    title: 'Auditly360 - Complete Website Audit & Analysis Platform',
    description: 'Complete website audit in minutes. Analyze SEO, performance, security, and more with actionable insights.',
    images: ['https://auditly360.com/images/twitter-card.jpg'],
  },
  alternates: {
    canonical: 'https://auditly360.com',
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Auditly360",
    "description": "Complete website audit and analysis platform that delivers comprehensive insights in minutes. Analyze SEO, performance, security, content, and branding with actionable recommendations.",
    "url": "https://auditly360.com",
    "applicationCategory": "WebApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free website audit tool"
    },
    "creator": {
      "@type": "Organization",
      "name": "Auditly360",
      "url": "https://auditly360.com"
    },
    "featureList": [
      "Website SEO Analysis",
      "Performance Audit",
      "Security Risk Assessment",
      "Content Analysis",
      "Broken Link Detection",
      "Image Optimization Check",
      "Google Tags Audit",
      "Social Media Preview Analysis",
      "Branding Consistency Check",
      "Hidden URL Discovery"
    ],
    "screenshot": "https://auditly360.com/images/screenshot.jpg",
    "softwareVersion": "1.0",
    "datePublished": "2025-01-01",
    "dateModified": "2025-01-01"
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="canonical" href="https://auditly360.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}

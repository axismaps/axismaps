import "./global.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Navbar } from "./components/nav";
import { Analytics } from "@vercel/analytics/next";
import Footer from "./components/footer";
import { baseUrl } from "./sitemap";
import {
  defaultOgImage,
  ogAlternateLocale,
  ogLocale,
  siteDescription,
  siteName,
  siteTitle,
} from "./lib/metadata";

// Site-wide defaults, which also stand in as the homepage's own metadata.
// Every other page overrides openGraph and twitter through pageMetadata so it
// gets its own title, description, URL and image.
export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: baseUrl,
    siteName,
    locale: ogLocale,
    alternateLocale: ogAlternateLocale,
    type: "website",
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [defaultOgImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cx(
        "text-gray-900 bg-white",
        GeistSans.variable,
        GeistMono.variable,
      )}
    >
      <body className="antialiased max-w-5xl mx-4 mt-8 lg:mx-auto bg-white text-gray-900">
        <main className="flex-auto min-w-0 mt-6 flex flex-col px-4 md:px-6">
          <Navbar />
          {children}
          <Footer />
          <Analytics />
        </main>
      </body>
    </html>
  );
}

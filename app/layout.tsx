import "./global.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Navbar } from "./components/nav";
import { Analytics } from "@vercel/analytics/next";
import Footer from "./components/footer";
import { baseUrl } from "./sitemap";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Axis Maps - Data-Driven Cartography",
    template: "%s | Axis Maps",
  },
  description:
    "Axis Maps brings cartography to interactive mapping. We design custom maps that combine intuitive user interfaces with great cartographic and interactive design.",
  openGraph: {
    title: "Axis Maps - Data-Driven Cartography",
    description:
      "Axis Maps brings cartography to interactive mapping. We design custom maps that combine intuitive user interfaces with great cartographic and interactive design.",
    url: baseUrl,
    siteName: "Axis Maps",
    locale: "en_US",
    type: "website",
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

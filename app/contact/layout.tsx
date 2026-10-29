import type { Metadata } from "next";
import { pageMetadata } from "../lib/metadata";

// The contact page itself is a client component and so cannot export metadata.
// It carries the site-wide title and description; this only gives it its own
// og:url, instead of pointing every shared link back at the homepage.
export const metadata: Metadata = pageMetadata({ path: "/contact" });

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

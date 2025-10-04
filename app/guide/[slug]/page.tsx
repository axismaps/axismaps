import { notFound } from "next/navigation";
import { getGuides, getGuideBySlug, getGuideCategories } from "../utils";
import Link from "next/link";
import Image from "next/image";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import GuideSearchClient from "../GuideSearchClient";
import PageSection from "../../components/page-section";
import ProseWrapper from "../../components/prose-wrapper";

export async function generateStaticParams() {
  const guides = getGuides();
  return guides.map((guide) => ({
    slug: guide.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) {
    return {};
  }

  const { title, summary, publishedAt } = guide.metadata;
  const ogImage = `https://axismaps.com/og?title=${encodeURIComponent(title)}`;

  return {
    title,
    description: summary,
    openGraph: {
      title,
      description: summary,
      type: "article",
      publishedTime: publishedAt,
      url: `https://axismaps.com/guide/${guide.slug}`,
      images: [
        {
          url: ogImage,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: summary,
      images: [ogImage],
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  const categories = getGuideCategories();

  if (!guide) {
    notFound();
  }

  const category = guide.metadata.categorySlug
    ? categories[guide.metadata.categorySlug]
    : null;

  // Get all guides for navigation
  const allGuides = getGuides();
  const currentIndex = allGuides.findIndex(g => g.slug === slug);
  const previousGuide = currentIndex > 0 ? allGuides[currentIndex - 1] : null;
  const nextGuide = currentIndex < allGuides.length - 1 ? allGuides[currentIndex + 1] : null;

  // Evaluate MDX content to get React component
  const { default: MDXContent } = await evaluate(guide.content, {
    ...(runtime as any),
    development: false,
    baseUrl: import.meta.url,
  } as any);

  return (
    <>
      {/* Header Banner - Match main guide page width */}
      <div className="relative -mx-4 md:-mx-6 mb-12">
        <Link
          href="/guide"
          className="block p-6 text-center bg-cover bg-center bg-no-repeat transition-opacity hover:opacity-90"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/images/guide.jpg')`
          }}
        >
          <h2 className="text-3xl font-bold text-white">
            Cartography Guide
          </h2>
        </Link>
      </div>

      <PageSection>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <Link
              href="/guide"
              className="inline-flex items-center text-sm text-gray-800 hover:text-gray-900"
            >
              ← Back to Contents
            </Link>
            <div className="w-full sm:w-1/2">
              <GuideSearchClient />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">
            {guide.metadata.title}
          </h1>
          {category && (
            <div className="mb-4">
              <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                {category.name}
              </span>
            </div>
          )}
          {guide.metadata.summary && (
            <p className="text-lg text-gray-600">{guide.metadata.summary}</p>
          )}
        </header>

        {/* Article Content */}
        <ProseWrapper variant="guide">
          <MDXContent />
        </ProseWrapper>

        {/* Navigation */}
        <nav className="mt-12 flex justify-between gap-4 pt-8">
          {previousGuide ? (
            <Link
              href={`/guide/${previousGuide.slug}`}
              className="group flex items-center gap-3 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all max-w-[45%]"
            >
              <svg
                className="h-5 w-5 flex-shrink-0 transition-transform group-hover:-translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <div className="text-left">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Previous</div>
                <div className="text-sm font-medium text-gray-900 line-clamp-1">
                  {previousGuide.metadata.title}
                </div>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextGuide ? (
            <Link
              href={`/guide/${nextGuide.slug}`}
              className="group flex items-center gap-3 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all ml-auto max-w-[45%]"
            >
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Next</div>
                <div className="text-sm font-medium text-gray-900 line-clamp-1">
                  {nextGuide.metadata.title}
                </div>
              </div>
              <svg
                className="h-5 w-5 flex-shrink-0 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          ) : (
            <div />
          )}
        </nav>

        {/* License Footer */}
        <div className="mt-12 border-t pt-8">
          <Image
            src="/images/88x31.png"
            alt="Creative Commons License"
            width={88}
            height={31}
            className="mb-4"
          />
          <p className="text-sm text-gray-600">
            Cartography Guide by{" "}
            <Link href="/guide" className="text-blue-600 hover:underline">
              Axis Maps
            </Link>{" "}
            is licensed under a{" "}
            <a
              href="http://creativecommons.org/licenses/by-nc-sa/4.0/"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Creative Commons Attribution-NonCommercial-ShareAlike 4.0
              International License
            </a>
            .
          </p>
        </div>
    </PageSection>
    </>
  );
}

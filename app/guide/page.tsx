import { getGuidesGroupedByCategory } from "./utils";
import Link from "next/link";
import Image from "next/image";
import GuideSearchClient from "./GuideSearchClient";

export const metadata = {
  title: "Cartography Guide",
  description:
    "A short, friendly guide to basic principles of map design",
};

export default function GuidePage() {
  const groupedGuides = getGuidesGroupedByCategory();

  return (
    <section className="pb-24 pt-8">
      <div className="container max-w-7xl">
        {/* Hero Section */}
        <div
          className="mb-12 rounded-lg p-16 text-center bg-cover bg-center bg-no-repeat relative"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/images/guide.jpg')`
          }}
        >
          <h1 className="mb-4 text-4xl font-bold text-white">
            Cartography Guide
          </h1>
          <h2 className="text-xl text-white">
            A short, friendly guide to basic principles of map design
          </h2>
        </div>

        <div className="flex items-end justify-between mb-12">
          <h1 className="title text-5xl font-bold">Welcome</h1>
        {/* Search Section */}
        <div className="w-1/2">
          <GuideSearchClient />
        </div>
        </div>

        {/* Introduction */}
        <div className="prose prose-lg mb-12 max-w-none">
          <p>
            In this short guide, we share some
            insights and tips for designing maps. Our goal is to cover
            important concepts in cartography and flag the important decision
            points in the map-making process. {`There isn't always a single best
            answer in cartography, and in those cases we've tried to outline`}
            some of the pros and cons to different solutions.
          </p>
          <p>
            This is by no means a replacement for a full textbook on
            cartography; rather it is a quick reference guide for those moments
            when {`you're stumped, unsure of what to do next, or unfamiliar with`}
            the terminology. While the recommendations on these pages are short
            and not loaded with academic references, please appreciate that
            they represent a thoughtful synthesis of decades of map-making
            research.
          </p>
          <p>
            This guide is maintained by{" "}
            <Link href="/" className="text-blue-600 hover:underline">
              Axis Maps
            </Link>
            , originally adapted from documentation written for indiemapper. However, the content here is about general cartography
            principles, not software-specific tips.
          </p>
        </div>

        {/* Guide Articles by Category */}
        <div className="space-y-8">
          {groupedGuides.map(({ category, guides }) => (
            <div key={category.slug}>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                {category.name}
              </h2>
              <ul className="space-y-1">
                {guides.map((guide) => (
                  <li key={guide.slug}>
                    <Link
                      href={`/guide/${guide.slug}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {guide.metadata.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* More Resources Section */}
        <div className="mt-16 rounded-lg bg-gray-50 p-8">
          <h3 className="mb-4 text-xl font-bold">
            More resources on map design
          </h3>
          <p className="mb-6 text-gray-700">
            Want to dig deeper? See this list of further map design resources for
            links to additional articles, tutorials, textbooks, tools, and more:
          </p>
          <Link
            href="/guide/resources"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Map Design Resources →
          </Link>
        </div>

        {/* License */}
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
      </div>
    </section>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import ProseWrapper from "../../components/prose-wrapper";
import EditionViewer from "../EditionViewer";
import {
  getTypographicMaps,
  getEditions,
  getViewableEditions,
  tileUrl,
} from "../utils";

export async function generateStaticParams() {
  return getTypographicMaps().map((map) => ({ slug: map.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const map = getTypographicMaps().find((m) => m.slug === slug);
  if (!map) return {};

  const title = `Typographic Map of ${map.metadata.city}`;
  return {
    title,
    description: map.metadata.teaser,
    openGraph: {
      title,
      description: map.metadata.teaser,
      type: "article",
    },
  };
}

export default async function TypographicMapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const maps = getTypographicMaps();
  const map = maps.find((m) => m.slug === slug);

  if (!map) {
    notFound();
  }

  const { default: MDXContent } = await evaluate(map.content, {
    ...(runtime as any),
    development: false,
    baseUrl: import.meta.url,
  } as any);

  const allEditions = getEditions(slug);
  const viewable = getViewableEditions(slug).map((edition) => ({
    ...edition,
    url: tileUrl(edition.tilePath),
  }));

  const index = maps.findIndex((m) => m.slug === slug);
  const previous = maps[index - 1];
  const next = maps[index + 1];

  return (
    <section className="pb-24 pt-8">
      <div className="container">
        <Link
          href="/typographic-maps"
          className="mb-8 inline-flex items-center text-sm text-gray-800 hover:text-gray-900"
        >
          ← All typographic maps
        </Link>

        <article>
          <header className="mb-8">
            <h1 className="title mb-3 text-4xl font-bold">
              Typographic Map of {map.metadata.city}
            </h1>
            <p className="text-sm text-gray-700">
              Every street, park, and shoreline drawn entirely in type.
              {map.metadata.printSizes && (
                <>
                  {" "}
                  Printed at {map.metadata.printSizes.replace(/,([^,]*)$/, " and$1")} inches.
                </>
              )}
            </p>
          </header>
        </article>
      </div>

      <div className="container mb-10">
        <EditionViewer city={map.metadata.city} editions={viewable} />
      </div>

      <div className="container">
        <ProseWrapper variant="large">
          <MDXContent />
        </ProseWrapper>

        <p className="mt-6 text-sm text-gray-600">
          The map is based on place names and geography as they appear in{" "}
          <a
            href="https://www.openstreetmap.org"
            target="_blank"
            rel="noopener noreferrer"
            className="link-primary underline"
          >
            OpenStreetMap
          </a>
          .
        </p>

        {allEditions.length > 1 && (
          <div className="mt-12 border-t border-gray-200 pt-8">
            <h2 className="mb-4 text-2xl font-bold">Editions</h2>
            <ul className="space-y-3">
              {allEditions.map((edition) => (
                <li key={edition.id} className="flex flex-wrap gap-x-3 text-sm">
                  <span className="font-semibold">{edition.label}</span>
                  <span className="text-gray-600">{edition.year}</span>
                  <span className="text-gray-600">{edition.printSize}</span>
                  {edition.letterpress && (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                      Letterpress · edition of 50, signed and numbered
                    </span>
                  )}
                  {!edition.tilePath && (
                    <span className="text-xs text-gray-500">
                      (not currently viewable)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <nav className="mt-16 flex justify-between gap-4 border-t border-gray-200 pt-8 text-sm">
          {previous ? (
            <Link
              href={`/typographic-maps/${previous.slug}`}
              className="text-gray-800 hover:text-gray-900"
            >
              ← {previous.metadata.city}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={`/typographic-maps/${next.slug}`}
              className="text-gray-800 hover:text-gray-900"
            >
              {next.metadata.city} →
            </Link>
          )}
        </nav>
      </div>
    </section>
  );
}

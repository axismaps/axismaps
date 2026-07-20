import Link from "next/link";
import type { Metadata } from "next";
import {
  getTypographicMaps,
  getEditions,
  getPress,
  type PressItem,
} from "./utils";

export const metadata: Metadata = {
  title: "Typographic Maps",
  description:
    "Twelve city maps drawn entirely in type — every street, park, and shoreline built from the names of the places themselves. Zoom in to read them.",
  openGraph: {
    title: "Typographic Maps | Axis Maps",
    description:
      "Twelve city maps drawn entirely in type. Every piece of type was placed by hand.",
    type: "website",
  },
};

function formatPressDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

function PressCard({ item }: { item: PressItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-full flex-col rounded-lg border border-gray-200 p-5 transition-all hover:border-gray-400 hover:shadow-lg"
    >
      <p className="text-sm font-semibold">{item.outlet}</p>
      {item.quote && (
        <p className="mt-3 flex-grow text-base text-gray-900">
          “{item.quote}”
        </p>
      )}
      <p className="mt-4 text-xs text-gray-600">
        {item.title} · {formatPressDate(item.date)}
      </p>
    </a>
  );
}

export default function TypographicMapsPage() {
  const maps = getTypographicMaps();
  const press = getPress();
  const featured = press.filter((item) => item.featured);
  const more = press.filter((item) => !item.featured);

  return (
    <section className="pb-24 pt-8">
      <div className="container">
        <h1 className="title mb-4 text-4xl font-bold">Typographic Maps</h1>
        <p className="text-xl text-gray-800">
          Twelve cities drawn entirely in type.
        </p>

        <div className="mt-8 space-y-4 text-base">
          <p>
            The maps accurately depict streets, highways, parks, bodies of water,
            and more using nothing but text bearing the names of those features.
            Only by meticulously weaving together thousands upon thousands of
            words does a full picture of the city emerge. Every single piece of
            type was carefully placed, a process that took hundreds of hours to
            complete for each map.
          </p>
          <p>
            There was nothing automated about making these maps. Everything was
            laid out manually in Adobe Illustrator, from entering names over an
            OpenStreetMap image, to nudging text along curved paths to depict
            flowing water, to selectively erasing text to create a woven street
            pattern. Each city intentionally differs in style, but the end result
            is similar: from a distance it can appear as an accurate reference
            map, and as you get closer you notice the thousands of words it
            comprises.
          </p>
          <p className="text-gray-700">
            The project began in 2010 as a side-project — something to work on
            between hours spent creating interface mock-ups and writing code — and
            grew into a full line of city maps, several hand-printed letterpress
            editions, and fifteen years of press coverage.
          </p>
        </div>

        <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
          <p className="text-sm text-gray-800">
            <strong className="font-semibold">
              The typographic map store has closed
            </strong>{" "}
            and prints are no longer available. The maps live on here — zoom in
            and read them. For licensing,{" "}
            <Link href="/contact" className="link-primary underline">
              get in touch
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="container mt-16">
        <h2 className="mb-6 text-2xl font-bold">The maps</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {maps.map((map) => {
            const editions = getEditions(map.slug);
            const extra = editions.length - 1;
            return (
              <Link
                key={map.slug}
                href={`/typographic-maps/${map.slug}`}
                className="group flex flex-col rounded-lg border border-gray-200 p-5 transition-all hover:border-gray-400 hover:shadow-lg"
              >
                <h3 className="text-lg font-semibold transition-colors group-hover:text-blue-600">
                  {map.metadata.city}
                </h3>
                {map.metadata.teaser && (
                  <p className="mt-2 flex-grow text-sm text-gray-700">
                    {map.metadata.teaser}
                  </p>
                )}
                <p className="mt-4 text-xs text-gray-600">
                  {new Date(
                    `${map.metadata.publishedAt}T00:00:00`,
                  ).getFullYear()}
                  {extra > 0 && ` · ${extra + 1} editions`}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="container mt-20">
        <h2 className="mb-2 text-2xl font-bold">Press</h2>
        <p className="mb-6 text-sm text-gray-700">
          What people wrote about the maps.
        </p>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((item) => (
            <PressCard key={item.url} item={item} />
          ))}
        </div>

        {more.length > 0 && (
          <>
            <h3 className="mb-4 mt-10 text-sm font-semibold tracking-wide text-gray-900">
              More coverage
            </h3>
            <ul className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
              {more.map((item) => (
                <li key={item.url} className="text-sm">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-primary underline"
                  >
                    {item.outlet}
                  </a>
                  <span className="text-gray-600">
                    {" "}
                    — {item.title} ({new Date(
                      `${item.date}T00:00:00`,
                    ).getFullYear()})
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

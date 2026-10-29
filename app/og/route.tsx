import { ImageResponse } from "next/og";
import {
  allowedCardArtworkPath,
  artworkOrigins,
  fetchArtwork,
  largeCardHeight,
  largeCardWidth,
} from "../lib/og-artwork";

const brandBlue = "#4a6ecf";

// A card that came out right is worth caching for as long as the CDN will hold
// it, which is what next/og asks for by default. A card that lost its artwork
// to a timeout or an unreachable host is not: without this, one bad minute
// would pin the artwork-less card at the CDN and in crawler caches for a year.
const degradedCacheControl = "public, max-age=60, s-maxage=60";
const cardBackground = "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)";

// Long project titles would otherwise push the wordmark off the card. The
// character count is the rough cut; the span's own width is what actually
// holds the line, for a title too wide to measure in characters. Counting
// code points rather than UTF-16 units keeps the cut off the middle of an
// emoji or an accented character that happens to land on the limit.
function truncate(title: string, limit = 58): string {
  const characters = Array.from(title);
  return characters.length > limit
    ? `${characters.slice(0, limit - 1).join("").trimEnd()}…`
    : title;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  // The parameter is public and unbounded, and satori lays out every character
  // it is given before anything gets drawn, so the string is cut to a sane
  // length on the way in rather than at the point it is rendered. This cut is
  // by UTF-16 unit and could leave a half character at the end; truncate's own
  // cut, at 58 code points, lands far inside it and takes any such tail off.
  const title = (url.searchParams.get("title") || "Data-Driven Cartography").slice(
    0,
    300,
  );
  const path = allowedCardArtworkPath(url.searchParams.get("image"));
  const artwork = path
    ? await fetchArtwork(artworkOrigins(request.url), path)
    : null;

  // With a picture to show, the card becomes a frame for it: the artwork is
  // letterboxed whole onto a white plate rather than cropped to 1.91:1, which
  // would cut a 975x305 banner down to a slice and most of a portrait cover
  // away. Branding drops to a sign-off line under the plate, where it stays
  // readable at the size a feed shows a card without competing with the map.
  // Artwork that could not be fetched falls through to the plain titled card
  // below, which beats the empty plate this would otherwise draw.
  if (artwork) {
    return new ImageResponse(
      (
        <div
          tw="flex flex-col w-full h-full"
          style={{ backgroundImage: cardBackground }}
        >
          <div tw="flex flex-1 p-7 pb-3">
            <div
              tw="flex w-full h-full bg-white rounded-xl"
              style={{
                border: "1px solid rgba(15, 23, 42, 0.08)",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.18)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={artwork}
                alt=""
                width={largeCardWidth}
                height={largeCardHeight}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  borderRadius: "11px",
                }}
              />
            </div>
          </div>

          <div tw="flex items-center justify-between h-24 px-10 pb-2">
            <span
              tw="text-3xl font-semibold text-gray-900"
              style={{
                maxWidth: "820px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {truncate(title)}
            </span>
            <div tw="flex items-center">
              <div
                tw="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: brandBlue }}
              >
                A
              </div>
              <span tw="ml-3 text-2xl text-gray-700">Axis Maps</span>
            </div>
          </div>
        </div>
      ),
      {
        width: largeCardWidth,
        height: largeCardHeight,
      },
    );
  }

  return new ImageResponse(
    (
      <div
        tw="flex flex-col w-full h-full bg-white relative"
        style={{
          backgroundImage: cardBackground,
        }}
      >
        {/* Background Pattern */}
        <div
          tw="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%234a6ecf' fill-opacity='0.5'%3E%3Cpath d='M0 20L20 0L40 20L20 40z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Content Container */}
        <div tw="flex flex-col w-full h-full p-16 justify-between relative">
          {/* Header with Logo */}
          <div tw="flex items-center">
            <div
              tw="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
              style={{ backgroundColor: brandBlue }}
            >
              A
            </div>
            <div tw="flex flex-col ml-4">
              <span tw="text-3xl font-semibold text-gray-900">Axis Maps</span>
              <span tw="text-lg text-gray-600">Data-Driven Cartography</span>
            </div>
          </div>

          {/* Main Title */}
          <div tw="flex flex-col justify-center flex-1 py-12 max-w-4xl">
            <h1
              tw="text-6xl font-bold text-gray-900 leading-tight"
              style={{
                lineHeight: "1.2",
                wordWrap: "break-word",
              }}
            >
              {title}
            </h1>
          </div>

          {/* Footer */}
          <div tw="flex items-center justify-between">
            <div tw="text-lg text-gray-600">axismaps.com</div>
            <div tw="flex">
              <div
                tw="h-2 w-24 rounded-full"
                style={{ backgroundColor: brandBlue }}
              />
              <div tw="h-2 w-16 bg-gray-300 rounded-full ml-2" />
              <div tw="h-2 w-8 bg-gray-300 rounded-full ml-2" />
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: largeCardWidth,
      height: largeCardHeight,
      // Only when a usable path was asked for and could not be served. A
      // rejected one (a WebP, say) renders this card every time and deserves
      // the long cache next/og asks for by default.
      ...(path ? { headers: { "cache-control": degradedCacheControl } } : {}),
    },
  );
}

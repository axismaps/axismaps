import { ImageResponse } from "next/og";
import { baseUrl } from "../sitemap";
import {
  allowedCardArtworkPath,
  largeCardHeight,
  largeCardWidth,
} from "../lib/metadata";

const brandBlue = "#4a6ecf";
const cardBackground = "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)";

// The host to fetch the artwork from. Satori has no filesystem, and public/
// images are deliberately left out of the serverless bundle, so the picture
// comes back over HTTP from the deployment serving this request. VERCEL_URL is
// set by the platform; the request's own Host header is only trusted for the
// local dev server, since anywhere else it is the caller's to set and would
// turn this route into a fetch of someone else's /images/.
function artworkOrigin(request: Request): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const { origin, hostname } = new URL(request.url);
  return hostname === "localhost" || hostname === "127.0.0.1"
    ? origin
    : baseUrl;
}

// Long project titles would otherwise push the wordmark off the card.
function truncate(title: string, limit = 58): string {
  return title.length > limit ? `${title.slice(0, limit - 1).trimEnd()}…` : title;
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const title = url.searchParams.get("title") || "Data-Driven Cartography";
  const artwork = allowedCardArtworkPath(url.searchParams.get("image"));

  // With a picture to show, the card becomes a frame for it: the artwork is
  // letterboxed whole onto a white plate rather than cropped to 1.91:1, which
  // would cut a 975x305 banner down to a slice and most of a portrait cover
  // away. Branding drops to a sign-off line under the plate, where it stays
  // readable at the size a feed shows a card without competing with the map.
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
                src={`${artworkOrigin(request)}${artwork}`}
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
              style={{ maxWidth: "820px" }}
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
          <div tw="flex items-center gap-4">
            <div
              tw="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
              style={{ backgroundColor: brandBlue }}
            >
              A
            </div>
            <div tw="flex flex-col">
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
            <div tw="flex gap-2">
              <div
                tw="h-2 w-24 rounded-full"
                style={{ backgroundColor: brandBlue }}
              />
              <div tw="h-2 w-16 bg-gray-300 rounded-full" />
              <div tw="h-2 w-8 bg-gray-300 rounded-full" />
            </div>
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

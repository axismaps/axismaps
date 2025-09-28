import { ImageResponse } from "next/og";

export function GET(request: Request) {
  let url = new URL(request.url);
  let title = url.searchParams.get("title") || "Data-Driven Cartography";

  return new ImageResponse(
    (
      <div
        tw="flex flex-col w-full h-full bg-white relative"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
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
              style={{ backgroundColor: "#4a6ecf" }}
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
                style={{ backgroundColor: "#4a6ecf" }}
              />
              <div tw="h-2 w-16 bg-gray-300 rounded-full" />
              <div tw="h-2 w-8 bg-gray-300 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

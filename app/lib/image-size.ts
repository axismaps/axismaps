import fs from "fs";

export type ImageSize = { width: number; height: number };

// Open Graph consumers lay a card out before the picture has downloaded, so
// og:image:width and og:image:height are worth shipping. Dimensions come from
// the file header at build time rather than from a native dependency: the
// site's own images are PNG, JPEG and WebP, and anything else simply reports
// no size instead of failing the page it belongs to.
export function readImageSize(filePath: string): ImageSize | null {
  let fd: number;
  try {
    fd = fs.openSync(filePath, "r");
  } catch {
    return null;
  }

  try {
    const { size } = fs.fstatSync(fd);
    const head = readAt(fd, 0, Math.min(32, size));
    if (!head) {
      return null;
    }

    if (isPng(head)) {
      return readPngSize(head);
    }
    if (isJpeg(head)) {
      return readJpegSize(fd, size);
    }
    if (isWebp(head)) {
      return readWebpSize(fd, size);
    }
    return null;
  } catch {
    return null;
  } finally {
    fs.closeSync(fd);
  }
}

function readAt(fd: number, offset: number, length: number): Buffer | null {
  if (length <= 0) {
    return null;
  }
  const buffer = Buffer.alloc(length);
  const read = fs.readSync(fd, buffer, 0, length, offset);
  return read === length ? buffer : null;
}

function isPng(head: Buffer): boolean {
  return head.length >= 8 && head.readUInt32BE(0) === 0x89504e47;
}

function isJpeg(head: Buffer): boolean {
  return head.length >= 2 && head[0] === 0xff && head[1] === 0xd8;
}

function isWebp(head: Buffer): boolean {
  return (
    head.length >= 12 &&
    head.toString("ascii", 0, 4) === "RIFF" &&
    head.toString("ascii", 8, 12) === "WEBP"
  );
}

// The IHDR chunk is required to come first, so width and height sit at fixed
// offsets right after the signature and the chunk header.
function readPngSize(head: Buffer): ImageSize | null {
  if (head.length < 24 || head.toString("ascii", 12, 16) !== "IHDR") {
    return null;
  }
  return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
}

// Walk the marker segments to the start-of-frame, which is where a JPEG
// records its dimensions. EXIF and colour profiles can push it well past any
// fixed-size header read, so this reads segment by segment.
function readJpegSize(fd: number, size: number): ImageSize | null {
  let offset = 2;

  while (offset + 4 <= size) {
    const header = readAt(fd, offset, 4);
    if (!header || header[0] !== 0xff) {
      return null;
    }

    const marker = header[1];
    const segmentLength = header.readUInt16BE(2);

    // SOF0 through SOF15, less the three markers in that range that carry
    // Huffman tables, arithmetic conditioning or restart intervals instead.
    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;

    if (isStartOfFrame) {
      const frame = readAt(fd, offset + 4, 5);
      return frame
        ? { width: frame.readUInt16BE(3), height: frame.readUInt16BE(1) }
        : null;
    }

    if (segmentLength < 2) {
      return null;
    }
    offset += 2 + segmentLength;
  }

  return null;
}

function readWebpSize(fd: number, size: number): ImageSize | null {
  const chunk = readAt(fd, 12, 8);
  if (!chunk) {
    return null;
  }

  const kind = chunk.toString("ascii", 0, 4);
  const payload = readAt(fd, 20, Math.min(10, Math.max(0, size - 20)));
  if (!payload) {
    return null;
  }

  // An extended file states the canvas size directly; the two bitstream
  // formats each bury it in their own frame header.
  if (kind === "VP8X" && payload.length >= 10) {
    return {
      width: readUInt24LE(payload, 4) + 1,
      height: readUInt24LE(payload, 7) + 1,
    };
  }

  if (kind === "VP8 " && payload.length >= 10) {
    return {
      width: payload.readUInt16LE(6) & 0x3fff,
      height: payload.readUInt16LE(8) & 0x3fff,
    };
  }

  if (kind === "VP8L" && payload.length >= 5) {
    const bits = payload.readUInt32LE(1);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  return null;
}

function readUInt24LE(buffer: Buffer, offset: number): number {
  return (
    buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16)
  );
}

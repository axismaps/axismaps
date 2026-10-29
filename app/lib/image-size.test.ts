import { describe, test, expect } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { readImageSize } from "./image-size";

const publicDir = path.join(process.cwd(), "public");

describe("readImageSize", () => {
  test("reads dimensions from a JPEG", () => {
    expect(
      readImageSize(
        path.join(
          publicDir,
          "images/projects/cpre-on-the-edge/01-national-overview.jpg",
        ),
      ),
    ).toEqual({ width: 1600, height: 1000 });
  });

  test("reads dimensions from a PNG", () => {
    expect(
      readImageSize(path.join(publicDir, "images/projects/hpi-cover.png")),
    ).toEqual({ width: 1590, height: 1514 });
  });

  test("returns null for a file that is not there", () => {
    expect(readImageSize(path.join(publicDir, "no-such-image.png"))).toBeNull();
  });

  test("returns null for a file in a format it cannot read", () => {
    const file = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), "image-size-")),
      "not-an-image.png",
    );
    fs.writeFileSync(file, "this is plain text, whatever the extension says");

    expect(readImageSize(file)).toBeNull();
  });
});

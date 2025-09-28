import fs from "fs";
import path from "path";

export function parseFrontmatter<T extends Record<string, any>>(
  fileContent: string
): { metadata: T; content: string } {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);

  if (!match) {
    throw new Error("No frontmatter found in file");
  }

  const frontMatterBlock = match[1];
  const content = fileContent.replace(frontmatterRegex, "").trim();
  const frontMatterLines = frontMatterBlock.trim().split("\n");
  const metadata: Record<string, any> = {};

  frontMatterLines.forEach((line) => {
    const [key, ...valueArr] = line.split(": ");
    let value = valueArr.join(": ").trim();
    value = value.replace(/^['"](.*)['"]$/, "$1");

    const trimmedKey = key.trim();

    if (value === "true" || value === "false") {
      metadata[trimmedKey] = value === "true";
    } else if (trimmedKey === "order" && !isNaN(Number(value))) {
      metadata[trimmedKey] = parseInt(value, 10);
    } else {
      metadata[trimmedKey] = value;
    }
  });

  return { metadata: metadata as T, content };
}

export function getMDXFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

export function readMDXFile<T extends Record<string, any>>(
  filePath: string
): { metadata: T; content: string } {
  const rawContent = fs.readFileSync(filePath, "utf-8");
  return parseFrontmatter<T>(rawContent);
}

export function getMDXData<T extends Record<string, any>>(
  dir: string
): Array<{ metadata: T; slug: string; content: string }> {
  const mdxFiles = getMDXFiles(dir);
  return mdxFiles.map((file) => {
    const { metadata, content } = readMDXFile<T>(path.join(dir, file));
    const slug = path.basename(file, path.extname(file));

    return {
      metadata,
      slug,
      content,
    };
  });
}
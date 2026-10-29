import { notFound } from "next/navigation";
import Link from "next/link";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import rehypeHighlight from "rehype-highlight";
import { getBlogPosts, getBlogPostBySlug, formatDate } from "../utils";
import ProseWrapper from "../../components/prose-wrapper";
import { pageMetadata, socialCardImage } from "../../lib/metadata";

// socialCardImage measures the cover under public/, which only exists at build
// time: a page rendered on demand would measure nothing and quietly name the
// undersized file. Every post is known up front, so the build is told to fail
// rather than let one of these pages become dynamic.
export const dynamic = "error";

export async function generateStaticParams() {
  const posts = getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {};
  }

  const { title, summary, coverImage, publishedAt } = post.metadata;

  // Most of these covers are too small or too square to carry a large preview
  // on their own — one is a 750x150 strip — so socialCardImage composites
  // those onto a 1200x630 card and leaves the few that already fit pointing
  // at the file itself.
  return pageMetadata({
    title,
    description: summary,
    path: `/blog/${slug}`,
    type: "article",
    publishedTime: publishedAt,
    images: coverImage ? [socialCardImage(coverImage, title)] : undefined,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Evaluate MDX content to get React component
  const { default: MDXContent } = await evaluate(post.content, {
    ...(runtime as any),
    development: false,
    baseUrl: import.meta.url,
    rehypePlugins: [[rehypeHighlight, { detect: true, ignoreMissing: true }]],
  } as any);

  return (
    <section className="pb-24 pt-8">
      <div className="container">
        <Link
          href="/blog"
          className="inline-flex items-center text-sm text-gray-800 hover:text-gray-900 mb-8"
        >
          ← Back to Blog
        </Link>

        <article>
          <header className="mb-8">
            <h1 className="title text-4xl font-bold mb-4">
              {post.metadata.title}
            </h1>

            <p className="text-sm text-gray-600">
              {post.metadata.authorName && <>{post.metadata.authorName} · </>}
              {formatDate(post.metadata.publishedAt)}
            </p>
          </header>

          <ProseWrapper variant="large">
            <MDXContent />
          </ProseWrapper>
        </article>
      </div>
    </section>
  );
}

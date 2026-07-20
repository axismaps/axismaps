import { notFound } from "next/navigation";
import Link from "next/link";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import rehypeHighlight from "rehype-highlight";
import { getBlogPosts, getBlogPostBySlug, formatDate } from "../utils";
import ProseWrapper from "../../components/prose-wrapper";

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

  return {
    title: post.metadata.title,
    description: post.metadata.summary,
  };
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

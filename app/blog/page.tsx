import Link from "next/link";
import { getBlogPosts, formatDate } from "./utils";
import PageSection from "../components/page-section";

export const metadata = {
  title: "Blog Archive",
  description: "Archived posts from the Axis Maps blog.",
};

export default function BlogPage() {
  const posts = getBlogPosts();

  return (
    <PageSection>
      <div className="max-w-3xl">
        <h1 className="title text-4xl font-bold mb-3">Blog Archive</h1>
        <p className="text-gray-700 mb-12">
          A collection of older posts from the Axis Maps blog. These are kept
          here for reference and are no longer actively maintained.
        </p>

        <ul className="space-y-10">
          {posts.map((post) => (
            <li key={post.slug}>
              <article>
                <h2 className="text-2xl font-semibold mb-1">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {post.metadata.title}
                  </Link>
                </h2>
                <p className="text-sm text-gray-600 mb-2">
                  {formatDate(post.metadata.publishedAt)}
                  {post.metadata.authorName && (
                    <> · {post.metadata.authorName}</>
                  )}
                </p>
                {post.metadata.summary && (
                  <p className="text-gray-700 line-clamp-2">
                    {post.metadata.summary}
                  </p>
                )}
              </article>
            </li>
          ))}
        </ul>
      </div>
    </PageSection>
  );
}

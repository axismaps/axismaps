import { notFound } from "next/navigation";
import { getProjects, formatDate } from "../utils";
import Link from "next/link";
import Image from "next/image";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import ProseWrapper from "../../components/prose-wrapper";

/* eslint-disable @next/next/no-img-element */

export async function generateStaticParams() {
  const projects = getProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const projects = getProjects();
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    return {};
  }

  return {
    title: project.metadata.title,
    description: project.metadata.teaser || project.metadata.subtitle,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const projects = getProjects();
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    notFound();
  }

  // Get related projects
  const categoryProjects = project.metadata.categorySlug
    ? projects
        .filter(
          (p) =>
            p.metadata.categorySlug === project.metadata.categorySlug &&
            p.slug !== project.slug,
        )
        .slice(0, 3)
    : [];

  // Evaluate MDX content to get React component
  const { default: MDXContent } = await evaluate(project.content, {
    ...(runtime as any),
    development: false,
    baseUrl: import.meta.url,
  } as any);

  return (
    <section className="pb-24 pt-8">
      <div className="container max-w-4xl">
        <Link
          href="/projects"
          className="inline-flex items-center text-sm text-gray-800 hover:text-gray-900 mb-8"
        >
          ← Back to Projects
        </Link>

        <article>
          <header className="mb-8">
            <h1 className="title text-4xl font-bold mb-4">
              {project.metadata.title}
            </h1>

            {project.metadata.subtitle && (
              <p className="text-xl text-gray-800 mb-4">
                {project.metadata.subtitle}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-800">
              <time dateTime={project.metadata.publishedAt}>
                {formatDate(project.metadata.publishedAt)}
              </time>

              {project.metadata.client && (
                <span>
                  <span className="text-gray-600">•</span> Client:{" "}
                  {project.metadata.client}
                </span>
              )}

              {project.metadata.category && (
                <span>
                  <span className="text-gray-600">•</span>{" "}
                  {project.metadata.category}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mt-4">
              {project.metadata.mapUrl && (
                <a
                  href={project.metadata.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:underline"
                >
                  View Map →
                </a>
              )}

              {project.metadata.githubUrl && (
                <a
                  href={project.metadata.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:underline"
                >
                  View on GitHub →
                </a>
              )}

              {project.metadata.videoUrl && (
                <a
                  href={project.metadata.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:underline"
                >
                  Watch Video →
                </a>
              )}
            </div>
          </header>

          {project.metadata.videoUrl ? (
            <div className="aspect-video mb-8">
              {project.metadata.videoUrl.includes("vimeo") ? (
                <iframe
                  src={`https://player.vimeo.com/video/${project.metadata.videoUrl.match(/vimeo\.com\/(\d+)/)?.[1] || project.metadata.videoUrl.split("/").pop()}`}
                  className="w-full h-full rounded-lg"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : project.metadata.videoUrl.includes("youtube.com") || project.metadata.videoUrl.includes("youtu.be") ? (
                <iframe
                  src={`https://www.youtube.com/embed/${
                    project.metadata.videoUrl.includes("youtube.com")
                      ? project.metadata.videoUrl.split("v=")[1]?.split("&")[0]
                      : project.metadata.videoUrl.split("/").pop()?.split("?")[0]
                  }`}
                  className="w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : null}
            </div>
          ) : project.metadata.coverImage ? (
            <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden">
              <img
                src={project.metadata.coverImage}
                alt={project.metadata.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : null}

          <ProseWrapper variant="large">
            <MDXContent />
          </ProseWrapper>
        </article>

        {/* Related Projects Section */}
        {categoryProjects.length > 0 && (
          <div className="mt-16 pt-16 border-t border-gray-200">
            <h2 className="text-2xl font-bold mb-8">Related Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categoryProjects.map((relatedProject) => (
                <Link
                  key={relatedProject.slug}
                  href={`/projects/${relatedProject.slug}`}
                  className="group block rounded-lg border border-gray-200 hover:border-gray-400 transition-colors overflow-hidden"
                >
                  {relatedProject.metadata.coverImage && (
                    <div className="relative h-32 w-full overflow-hidden bg-gray-100">
                      <img
                        src={relatedProject.metadata.coverImage}
                        alt={relatedProject.metadata.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="font-semibold text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                      {relatedProject.metadata.title}
                    </h4>
                    {relatedProject.metadata.teaser && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {relatedProject.metadata.teaser}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

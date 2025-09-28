"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type ProjectMetadata = {
  title: string;
  slug: string;
  publishedAt: string;
  featured?: boolean;
  subtitle?: string;
  teaser?: string;
  client?: string;
  clientSlug?: string;
  category?: string;
  categorySlug?: string;
  coverImage?: string;
  videoUrl?: string;
  mapUrl?: string;
  githubUrl?: string;
  launchDate?: string;
};

type Project = {
  metadata: ProjectMetadata;
  slug: string;
  content: string;
};

type Category = {
  name: string;
  slug: string;
};

type ProjectsClientProps = {
  featuredProjects: Project[];
  allProjects: Project[];
  categories?: Category[];
};

export default function ProjectsClient({
  featuredProjects,
  allProjects,
  categories = [],
}: ProjectsClientProps) {
  const [showAll, setShowAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter projects based on show all and category
  let projects = showAll ? allProjects : featuredProjects;
  if (selectedCategory) {
    projects = projects.filter(
      (p) => p.metadata.categorySlug === selectedCategory,
    );
  }

  return (
    <>
      {/* Title with inline category filters */}
      <div className="flex items-end justify-between mb-12">
        <h1 className="title text-5xl font-bold">Projects</h1>

        {categories.length > 0 && (
          <div className="hidden sm:flex gap-1.5 pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-2.5 py-1 rounded text-sm transition-colors ${
                selectedCategory === null
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.slug}
                onClick={() => setSelectedCategory(category.slug)}
                className={`px-2.5 py-1 rounded text-sm transition-colors ${
                  selectedCategory === category.slug
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link
            key={project.slug}
            href={`/projects/${project.slug}`}
            className="group block overflow-hidden rounded-lg border border-gray-200 hover:border-gray-400 transition-colors"
          >
            <article>
              {project.metadata.coverImage && (
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  <img
                    src={project.metadata.coverImage}
                    alt={project.metadata.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              )}

              <div className="p-4">
                <h2 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                  {project.metadata.title}
                </h2>

                {project.metadata.teaser && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                    {project.metadata.teaser}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 text-xs">
                  {project.metadata.client && (
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {project.metadata.client}
                    </span>
                  )}
                  {project.metadata.category && (
                    <span className="bg-blue-50 px-2 py-1 rounded text-blue-700">
                      {project.metadata.category}
                    </span>
                  )}
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {!showAll &&
        featuredProjects.length < allProjects.length &&
        !selectedCategory && (
          <div className="mt-12 text-center">
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Show All Projects ({allProjects.length - featuredProjects.length}{" "}
              more)
            </button>
          </div>
        )}
    </>
  );
}

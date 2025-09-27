import { notFound } from 'next/navigation'
import { getProjects, formatDate } from '../utils'
import Link from 'next/link'
import Image from 'next/image'
import { evaluate } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'

export async function generateStaticParams() {
  const projects = getProjects()
  return projects.map((project) => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const projects = getProjects()
  const project = projects.find((p) => p.slug === slug)

  if (!project) {
    return {}
  }

  return {
    title: project.metadata.title,
    description: project.metadata.teaser || project.metadata.subtitle,
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const projects = getProjects()
  const project = projects.find((p) => p.slug === slug)

  if (!project) {
    notFound()
  }

  // Evaluate MDX content to get React component
  const { default: MDXContent } = await evaluate(project.content, {
    ...runtime,
    development: false,
    baseUrl: import.meta.url,
    useDynamicImport: true
  })

  return (
    <section className="pb-24 pt-40">
      <div className="container max-w-4xl">
        <Link
          href="/projects"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8"
        >
          ← Back to Projects
        </Link>

        <article>
          <header className="mb-8">
            <h1 className="title text-4xl font-bold mb-4">{project.metadata.title}</h1>

            {project.metadata.subtitle && (
              <p className="text-xl text-gray-600 mb-4">{project.metadata.subtitle}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <time dateTime={project.metadata.publishedAt}>
                {formatDate(project.metadata.publishedAt)}
              </time>

              {project.metadata.client && (
                <span>
                  <span className="text-gray-400">•</span> Client: {project.metadata.client}
                </span>
              )}

              {project.metadata.category && (
                <span>
                  <span className="text-gray-400">•</span> {project.metadata.category}
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

          {project.metadata.coverImage && (
            <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden">
              <img
                src={project.metadata.coverImage}
                alt={project.metadata.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {project.metadata.videoUrl && project.metadata.videoUrl.includes('vimeo') && (
            <div className="aspect-video mb-8">
              <iframe
                src={`https://player.vimeo.com/video/${project.metadata.videoUrl.split('/').pop()}`}
                className="w-full h-full rounded-lg"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}

          <div className="prose prose-lg max-w-none">
            <MDXContent />
          </div>
        </article>
      </div>
    </section>
  )
}
import { getProjects, getCategories, getClients, formatDate } from './utils'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Projects',
  description: 'Our portfolio of interactive mapping projects',
}

export default function ProjectsPage() {
  const projects = getProjects()
  const categories = getCategories()
  const clients = getClients()

  return (
    <section className="pb-24 pt-40">
      <div className="container max-w-7xl">
        <h1 className="title text-5xl font-bold mb-12">Projects</h1>

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
                    {project.metadata.featured && (
                      <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Featured
                      </span>
                    )}
                  </div>
                )}

                <div className="p-4">
                  <h2 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                    {project.metadata.title}
                  </h2>

                  {project.metadata.subtitle && (
                    <p className="text-sm text-gray-600 mb-2">{project.metadata.subtitle}</p>
                  )}

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

                  <p className="text-xs text-gray-500 mt-3">
                    {formatDate(project.metadata.publishedAt)}
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
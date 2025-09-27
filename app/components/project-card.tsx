import Link from 'next/link'

interface ProjectCardProps {
  project: {
    slug: string
    metadata: {
      title: string
      coverImage?: string
      teaser?: string
      client?: string
      category?: string
    }
  }
  showTags?: boolean
}

export default function ProjectCard({ project, showTags = true }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block overflow-hidden rounded-lg border border-gray-200 hover:border-gray-400 transition-colors"
    >
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
        <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">
          {project.metadata.title}
        </h3>
        {project.metadata.teaser && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-3">
            {project.metadata.teaser}
          </p>
        )}
        {showTags && (
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
        )}
      </div>
    </Link>
  )
}
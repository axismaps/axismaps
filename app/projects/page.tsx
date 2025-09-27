import { getProjects, getCategories, getClients, formatDate } from './utils'
import Link from 'next/link'
import Image from 'next/image'
import ProjectsClient from './ProjectsClient'

export const metadata = {
  title: 'Projects',
  description: 'Our portfolio of interactive mapping projects',
}

export default function ProjectsPage() {
  const allProjects = getProjects()
  const categories = getCategories()
  const clients = getClients()

  const featuredProjects = allProjects.filter(p => p.metadata.featured)

  return (
    <section className="pb-24 pt-40">
      <div className="container max-w-7xl">
        <h1 className="title text-5xl font-bold mb-12">Projects</h1>
        <ProjectsClient
          featuredProjects={featuredProjects}
          allProjects={allProjects}
        />
      </div>
    </section>
  )
}
import fs from 'fs'
import path from 'path'

export type ProjectMetadata = {
  title: string
  slug: string
  publishedAt: string
  featured?: boolean
  subtitle?: string
  teaser?: string
  client?: string
  clientSlug?: string
  category?: string
  categorySlug?: string
  coverImage?: string
  videoUrl?: string
  mapUrl?: string
  githubUrl?: string
  launchDate?: string
}

function parseFrontmatter(fileContent: string) {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/
  const match = frontmatterRegex.exec(fileContent)
  const frontMatterBlock = match![1]
  const content = fileContent.replace(frontmatterRegex, '').trim()
  const frontMatterLines = frontMatterBlock.trim().split('\n')
  const metadata: Partial<ProjectMetadata> = {}

  frontMatterLines.forEach((line) => {
    const [key, ...valueArr] = line.split(': ')
    let value = valueArr.join(': ').trim()
    value = value.replace(/^['"](.*)['"]$/, '$1') // Remove quotes

    // Handle boolean values
    const trimmedKey = key.trim() as keyof ProjectMetadata
    if (value === 'true' || value === 'false') {
      (metadata as any)[trimmedKey] = value === 'true'
    } else {
      (metadata as any)[trimmedKey] = value
    }
  })

  return { metadata: metadata as ProjectMetadata, content }
}

function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === '.mdx')
}

function readMDXFile(filePath: string) {
  const rawContent = fs.readFileSync(filePath, 'utf-8')
  return parseFrontmatter(rawContent)
}

function getMDXData(dir: string) {
  const mdxFiles = getMDXFiles(dir)
  return mdxFiles.map((file) => {
    const { metadata, content } = readMDXFile(path.join(dir, file))
    const slug = path.basename(file, path.extname(file))

    return {
      metadata,
      slug,
      content,
    }
  })
}

export function getProjects() {
  const projects = getMDXData(path.join(process.cwd(), 'app', 'projects', 'posts'))

  // Sort by date, with featured projects first
  return projects.sort((a, b) => {
    // Featured projects come first
    if (a.metadata.featured && !b.metadata.featured) return -1
    if (!a.metadata.featured && b.metadata.featured) return 1

    // Then sort by date
    return new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime()
  })
}

export function getProjectBySlug(slug: string) {
  const projects = getProjects()
  return projects.find((project) => project.slug === slug)
}

export function getProjectsByCategory(categorySlug: string) {
  const projects = getProjects()
  return projects.filter((project) => project.metadata.categorySlug === categorySlug)
}

export function getProjectsByClient(clientSlug: string) {
  const projects = getProjects()
  return projects.filter((project) => project.metadata.clientSlug === clientSlug)
}

export function getFeaturedProjects() {
  const projects = getProjects()
  return projects.filter((project) => project.metadata.featured)
}

// Load client and category data
export function getClients() {
  const clientsPath = path.join(process.cwd(), 'data', 'clients.json')
  if (fs.existsSync(clientsPath)) {
    return JSON.parse(fs.readFileSync(clientsPath, 'utf-8'))
  }
  return {}
}

export function getCategories() {
  const categoriesPath = path.join(process.cwd(), 'data', 'categories.json')
  if (fs.existsSync(categoriesPath)) {
    return JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'))
  }
  return {}
}

export function formatDate(date: string, includeRelative = false) {
  const currentDate = new Date()
  if (!date.includes('T')) {
    date = `${date}T00:00:00`
  }
  const targetDate = new Date(date)

  const yearsAgo = currentDate.getFullYear() - targetDate.getFullYear()
  const monthsAgo = currentDate.getMonth() - targetDate.getMonth()
  const daysAgo = currentDate.getDate() - targetDate.getDate()

  let formattedDate = ''

  if (yearsAgo > 0) {
    formattedDate = `${yearsAgo}y ago`
  } else if (monthsAgo > 0) {
    formattedDate = `${monthsAgo}mo ago`
  } else if (daysAgo > 0) {
    formattedDate = `${daysAgo}d ago`
  } else {
    formattedDate = 'Today'
  }

  const fullDate = targetDate.toLocaleString('en-us', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  if (!includeRelative) {
    return fullDate
  }

  return `${fullDate} (${formattedDate})`
}
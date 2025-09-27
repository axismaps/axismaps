import Link from 'next/link'
import Image from 'next/image'

const navItems = {
  '/projects': {
    name: 'Projects',
  },
  '/about': {
    name: 'About',
  },
  '/blog': {
    name: 'Blog',
  },
  '/guide': {
    name: 'Guide',
  },
  '/contact': {
    name: 'Contact',
  },
}

export function Navbar() {
  return (
    <header className="mb-8">
      <nav className="flex flex-row items-center justify-between">
        {/* Logo and Company Name */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image
            src="/axis-logo.png"
            alt="Axis Maps Logo"
            width={40}
            height={40}
            className="w-10 h-10"
          />
          <span className="text-xl font-semibold tracking-tight">Axis Maps</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex flex-row items-center gap-1">
          {Object.entries(navItems).map(([path, { name }]) => {
            return (
              <Link
                key={path}
                href={path}
                className="transition-all hover:text-neutral-600 dark:hover:text-neutral-300 px-3 py-2 text-sm"
              >
                {name}
              </Link>
            )
          })}
        </div>
      </nav>
    </header>
  )
}

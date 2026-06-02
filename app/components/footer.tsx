import Link from "next/link";

function ArrowIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block ml-1 align-baseline"
    >
      <path
        d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z"
        fill="currentColor"
      />
    </svg>
  );
}

const pages = [
  { name: "Home", href: "/" },
  { name: "Projects", href: "/projects" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
  { name: "Blog Archive", href: "/blog" },
];

const resources = [
  { name: "Cartography Guide", href: "/guide", external: false },
  { name: "Contours", href: "https://contours.axismaps.com", external: true },
  { name: "ColorBrewer", href: "https://colorbrewer2.org", external: true },
  {
    name: "Typographic Map Store",
    href: "https://store.axismaps.com",
    external: true,
  },
];

const linkClasses =
  "text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-neutral-200 dark:border-neutral-800">
      <div className="py-6">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <p className="text-lg font-semibold tracking-tight">Axis Maps</p>
            <a
              href="mailto:info@axismaps.com"
              className={`mt-2 inline-block ${linkClasses}`}
            >
              info@axismaps.com
            </a>
          </div>

          {/* Pages */}
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-neutral-900 dark:text-neutral-100 mb-3">
              Pages
            </h2>
            <ul className="space-y-0">
              {pages.map((page) => (
                <li key={page.href}>
                  <Link href={page.href} className={linkClasses}>
                    {page.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-neutral-900 dark:text-neutral-100 mb-3">
              Resources
            </h2>
            <ul className="space-y-0">
              {resources.map((resource) => (
                <li key={resource.href}>
                  {resource.external ? (
                    <a
                      href={resource.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClasses}
                    >
                      {resource.name}
                      <ArrowIcon />
                    </a>
                  ) : (
                    <Link href={resource.href} className={linkClasses}>
                      {resource.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-12 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
          Copyright © {new Date().getFullYear()} Axis Maps. All rights reserved. The material on this
          site may not be reproduced, distributed, transmitted, or otherwise
          used, except with the prior permission of Axis Maps.
        </p>
      </div>
    </footer>
  );
}

import { getProjects } from "./projects/utils";

export const baseUrl = "https://axismaps.com";

export default async function sitemap() {
  let projects = getProjects().map((project) => ({
    url: `${baseUrl}/projects/${project.slug}`,
    lastModified: project.metadata.publishedAt,
  }));

  let routes = ["", "/projects", "/about", "/guide", "/contact"].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date().toISOString().split("T")[0],
    }),
  );

  return [...routes, ...projects];
}

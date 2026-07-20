import { getProjects } from "./projects/utils";
import { getBlogPosts } from "./blog/utils";
import { getTypographicMaps } from "./typographic-maps/utils";

export const baseUrl = "https://axismaps.com";

export default async function sitemap() {
  let projects = getProjects().map((project) => ({
    url: `${baseUrl}/projects/${project.slug}`,
    lastModified: project.metadata.publishedAt,
  }));

  let blogPosts = getBlogPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }));

  let typographicMaps = getTypographicMaps().map((map) => ({
    url: `${baseUrl}/typographic-maps/${map.slug}`,
    lastModified: map.metadata.publishedAt,
  }));

  let routes = [
    "",
    "/projects",
    "/about",
    "/guide",
    "/contact",
    "/blog",
    "/typographic-maps",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  return [...routes, ...projects, ...blogPosts, ...typographicMaps];
}

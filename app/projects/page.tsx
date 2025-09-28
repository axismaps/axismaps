import { getProjects, getCategories, getClients, formatDate } from "./utils";
import Link from "next/link";
import Image from "next/image";
import ProjectsClient from "./ProjectsClient";
import PageSection from "../components/page-section";

export const metadata = {
  title: "Projects",
  description: "Our portfolio of interactive mapping projects",
};

export default function ProjectsPage() {
  const allProjects = getProjects();
  const categories = getCategories();
  const clients = getClients();

  const featuredProjects = allProjects.filter((p) => p.metadata.featured);

  // Get unique categories that have more than one project
  const projectCategories = Object.values(categories).filter((category) => {
    const projectCount = allProjects.filter(
      (p) => p.metadata.categorySlug === category.slug,
    ).length;
    return projectCount > 1;
  });

  return (
    <PageSection>
      <ProjectsClient
        featuredProjects={featuredProjects}
        allProjects={allProjects}
        categories={projectCategories}
      />
    </PageSection>
  );
}

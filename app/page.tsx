import Link from "next/link";
import Image from "next/image";
import HeroSection from "./components/hero-section";
import ProjectCard from "./components/project-card";
import ResourceCard from "./components/resource-card";
import {
  FaDatabase,
  FaHistory,
  FaMapMarkedAlt,
  FaSlidersH,
  FaUniversalAccess,
  FaUsers,
} from "react-icons/fa";
import { getProjects } from "./projects/utils";
import clientLogos from "./data/client-logos.json";

const howWeWork = [
  {
    icon: FaMapMarkedAlt,
    lead: "Designed by cartographers.",
    body: "Every decision on the map is made so it reads clearly and the data tells its story.",
  },
  {
    icon: FaSlidersH,
    lead: "Interfaces that show what's possible.",
    body: "The controls show what the map can do and what you can ask of it.",
  },
  {
    icon: FaUsers,
    lead: "Interfaces for every level of expertise.",
    body: "Whether the map is for a first-time visitor, an analyst who comes back every week, or everyone in between, we design for whoever the project requires.",
  },
  {
    icon: FaUniversalAccess,
    lead: "Maps that work for everyone.",
    body: "Keyboard navigation and screen reader support, where the project calls for it.",
  },
  {
    icon: FaDatabase,
    lead: "Built around your data.",
    body: "Deep integration with your existing data pipelines and processes, so when the data changes, the map changes with it.",
  },
  {
    icon: FaHistory,
    lead: "Built to last.",
    body: "Maps we built years ago are still live and still in use. We use current technology and an architecture each project can sustain.",
  },
];

export default function Page() {
  // Get the 6 most recent featured projects
  const projects = getProjects();
  const recentProjects = projects
    .filter((p) => p.metadata.featured)
    .slice(0, 6);

  return (
    <>
      <HeroSection />

      {/* Who We Are Section */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Who we are</h2>
        <div className="space-y-4">
          <p className="text-lg">
            Axis Maps is a small team of cartographers and developers in
            Lichfield, England and Hewitt, Texas. Since 2006 we have designed
            and built custom interactive maps for public health, the
            environment, education and history, for clients from national
            museums to campaigning charities. Every map is designed around the
            people who will use it, the people who will run it, and the story
            the data is trying to tell.
          </p>
          <Link href="/about" className="btn-secondary mt-8">
            Learn More
          </Link>
        </div>
      </section>

      {/* Section Break */}
      <hr className="my-16 border-gray-200" />

      {/* Client Logos Section */}
      <section id="clients" className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8">
          {`We're pleased to have partnered with`}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 items-center">
          {clientLogos.map((client) => (
            <div
              key={client.name}
              className="flex items-center justify-center bg-gray-50 rounded-lg p-6 h-24"
            >
              <Image
                src={client.logo}
                alt={client.shortName}
                title={client.name}
                width={200}
                height={48}
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="max-h-12 w-auto opacity-60 hover:opacity-100 transition-opacity grayscale"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Section Break */}
      <hr className="my-16 border-gray-200" />

      {/* Recent Projects Section */}
      <section id="featured-projects" className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8">Recent Projects</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recentProjects.map((project) => (
            <ProjectCard
              key={project.slug}
              project={project}
              showTags={false}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/projects" className="btn-primary">
            Explore All Projects
          </Link>
        </div>
      </section>

      {/* Section Break */}
      <hr className="my-16 border-gray-200" />

      {/* How We Work Section */}
      <section id="services" className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8">How we work</h2>

        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
          {howWeWork.map(({ icon: Icon, lead, body }) => (
            <div key={lead} className="flex gap-4">
              <div className="shrink-0 mt-0.5">
                <Icon
                  className="w-8 h-8"
                  style={{ color: "var(--axismaps-blue)" }}
                />
              </div>
              <p className="text-base">
                <strong>{lead}</strong> {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section Break */}
      <hr className="my-16 border-gray-200" />

      {/* Resources Section */}
      <section id="resources" className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8">Free tools and resources</h2>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <ResourceCard
            title="Cartography Guide"
            description="A short, friendly guide to basic principles of map design. Learn important concepts in cartography and flag important decision points in map-making."
            imageSrc="/images/guide.jpg"
            href="/guide"
          />

          <ResourceCard
            title="Contours"
            description="Draw a contour map of just about anywhere. Pick your area, choose contour lines or illuminated contours, adjust the interval and colors, and export to GeoJSON, PNG, or SVG."
            imageSrc="/images/resources/contours.jpg"
            href="https://contours.axismaps.com"
            isExternal={true}
          />

          <ResourceCard
            title="ColorBrewer"
            description="Color advice for cartography. Choose effective color schemes for your maps based on the nature of your data and your design goals."
            imageSrc="/images/resources/colorbrewer.png"
            href="https://colorbrewer2.org"
            isExternal={true}
          />

          <ResourceCard
            title="Typographic Maps"
            description="Twelve city maps drawn entirely in type, with every street, park, and shoreline built from the names of the places themselves. Zoom in and read them."
            imageSrc="/images/resources/typographic.jpg"
            href="/typographic-maps"
          />
        </div>
      </section>
    </>
  );
}

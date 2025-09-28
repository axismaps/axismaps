import Link from "next/link";
import HeroSection from "./components/hero-section";
import ProjectCard from "./components/project-card";
import ResourceCard from "./components/resource-card";
import {
  FaTools,
  FaLaptopCode,
  FaSlidersH,
  FaDatabase,
  FaChartLine,
} from "react-icons/fa";
import { getProjects } from "./projects/utils";
import clientLogos from "./data/client-logos.json";

/* eslint-disable @next/next/no-img-element */

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
          <p>
            <strong>
              Axis Maps is a creative team of Web designers and developers
            </strong>{" "}
            that specializes in building{" "}
            <Link href="#featured-projects" className="link-primary">
              interactive maps and geospatial problem-solving tools
            </Link>
            .
          </p>
          <p>
            We have 15 years of experience partnering with{" "}
            <Link href="#clients" className="link-primary">
              clients
            </Link>{" "}
            both large and small, across the globe.
          </p>
          <p>
            With a full range of{" "}
            <Link href="#services" className="link-primary">
              custom geographic services
            </Link>
            , we can help put together an entire project or target specific
            needs.{" "}
            <Link href="/contact" className="link-primary">
              Contact us
            </Link>{" "}
            about your spatial data, visual identity, technology set up,
            message, and audience.
          </p>
          <Link href="/about" className="btn-secondary mt-4">
            Learn More
          </Link>
        </div>
      </section>

      {/* Section Break */}
      <hr className="my-16 border-gray-200" />

      {/* Client Logos Section */}
      <section id="clients" className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8">
          {`We're pleased to have worked with`}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 items-center">
          {clientLogos.map((client) => (
            <div
              key={client.name}
              className="flex items-center justify-center bg-gray-50 rounded-lg p-6 h-24"
            >
              <img
                src={client.logo}
                alt={client.shortName}
                title={client.name}
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
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Recent Projects</h2>
          <Link href="/projects" className="btn-secondary">
            View All Projects
          </Link>
        </div>

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

      {/* How We Can Help Section */}
      <section id="services" className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">How we can help</h2>
        <p className="mb-12 text-lg">
          At Axis Maps, we work hard to provide thoughtful and intuitive
          interactive designs with every project we undertake. We want your
          project to look great and work as well as you do. As a small company,
          we are focused on efficiency, speed, quality control, and reproducible
          processes.
        </p>

        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
          {/* Service Items - Left Column */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 mt-0.5">
              <FaTools
                className="w-8 h-8"
                style={{ color: "var(--axismaps-blue)" }}
              />
            </div>
            <p className="text-sm">
              We design and deploy second versions of{" "}
              <strong>popular tools</strong>, modernizing the underlying
              technology and UI while retaining the features that existing users
              know.
            </p>
          </div>

          {/* Right Column */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 mt-0.5">
              <FaLaptopCode
                className="w-8 h-8"
                style={{ color: "var(--axismaps-blue)" }}
              />
            </div>
            <p className="text-sm">
              We build maps and applications that work on a wide{" "}
              <strong>range of devices</strong>, from desktops to tablets and
              smartphones.
            </p>
          </div>

          {/* Left Column */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 mt-0.5">
              <FaSlidersH
                className="w-8 h-8"
                style={{ color: "var(--axismaps-blue)" }}
              />
            </div>
            <p className="text-sm">
              We design simple and <strong>elegant user-interfaces</strong> for
              interactive maps.
            </p>
          </div>

          {/* Right Column */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 mt-0.5">
              <FaDatabase
                className="w-8 h-8"
                style={{ color: "var(--axismaps-blue)" }}
              />
            </div>
            <p className="text-sm">
              We design and build systems that{" "}
              <strong>automate the process</strong> of data updates and data
              additions.
            </p>
          </div>

          {/* Left Column */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 mt-0.5">
              <FaChartLine
                className="w-8 h-8"
                style={{ color: "var(--axismaps-blue)" }}
              />
            </div>
            <p className="text-sm">
              We produce <strong>compelling cartographic visuals</strong> that
              communicate a wide variety of geographic information to end-users.
            </p>
          </div>

          {/* Empty cell to maintain grid alignment */}
          <div></div>
        </div>
      </section>

      {/* Section Break */}
      <hr className="my-16 border-gray-200" />

      {/* Resources Section */}
      <section id="resources" className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Resources by us, for you</h2>
        <p className="text-lg text-gray-600 mb-8">
          Explore our collection of tools and guides designed to help you create better maps and visualizations.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <ResourceCard
            title="Cartography Guide"
            description="A short, friendly guide to basic principles of map design. Learn important concepts in cartography and flag important decision points in map-making."
            imageSrc="/images/guide.jpg"
            href="/guide"
          />

          <ResourceCard
            title="Contours"
            description="Create beautiful contour maps from your data. A modern tool for generating topographic-style visualizations for any numeric dataset."
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
            title="Typographic Map Store"
            description="Beautiful typographic maps of cities around the world. Each map is composed entirely of text labels, creating a unique visualization of place names."
            imageSrc="/images/resources/typographic.jpg"
            href="https://store.axismaps.com"
            isExternal={true}
          />
        </div>
      </section>
    </>
  );
}

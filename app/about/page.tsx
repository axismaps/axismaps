import Link from "next/link";
import ProseWrapper from "../components/prose-wrapper";
import { pageMetadata, siteDescription } from "../lib/metadata";

export const metadata = pageMetadata({
  title: "About",
  description:
    "Axis Maps has designed custom interactive maps since 2006. Meet the co-founders and find out how we work with clients in the UK, Europe and the US.",
  socialDescription: siteDescription,
  path: "/about",
});

export default function AboutPage() {
  return (
    <section className="pb-24">
      {/* Hero Banner - Match homepage width */}
      <div className="relative -mx-4 md:-mx-6 mb-12">
        <div
          className="w-full h-[50vh] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/madison.jpg)" }}
        />
      </div>
      {/* Our Story Section */}
      <div>
        <h1 className="text-5xl font-bold mb-8">Our story</h1>

        <ProseWrapper>
          <p>
            Axis Maps was formed in 2006. Interactive mapping was growing fast
            and most of the attention was on the technology of delivering maps
            over the web. The cartography, the part that makes a map clear, was
            being left behind. We started Axis Maps to bring cartography to
            what was becoming a purely technical field. While other companies
            built software for the broadest possible market, we designed each
            map for its client, its data and its audience.
          </p>

          <h2>Co-founders</h2>

          <p>
            <strong>David Heyman.</strong> Co-founder and technical lead. David
            works closely with clients throughout a project and builds the maps
            and the systems behind them: the data pipelines, the interfaces and
            the infrastructure they run on. Based in Lichfield, England.
          </p>

          <p>
            <strong>Ben Sheesley.</strong> Co-founder and design lead. Ben leads
            the cartography and interface design on every project. How a map
            looks, how it reads and how it feels to use start with him. He also
            runs the company's operations. Based in Hewitt, Texas.
          </p>

          <p>
            We work from Lichfield, England and Hewitt, Texas. UK and European
            clients contract with Axis Maps Limited, registered in England and
            Wales, in pounds sterling. US clients contract with Axis Maps LLC, a
            Texas company, in dollars.
          </p>
        </ProseWrapper>

        <Link href="/contact" className="btn-primary mt-8">
          Contact Us
        </Link>
      </div>
    </section>
  );
}

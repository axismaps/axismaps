import Link from 'next/link'
import HeroSection from './components/hero-section'

export default function Page() {
  return (
    <>
      <HeroSection />

      {/* Who We Are Section */}
      <section className="mb-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Who we are</h2>
        <div className="space-y-4">
          <p>
            <strong>Axis Maps is a creative team of Web designers and developers</strong> that
            specializes in building{' '}
            <Link href="#featured-projects" className="link-primary">
              interactive maps and geospatial problem-solving tools
            </Link>.
          </p>
          <p>
            We have 15 years of experience partnering with{' '}
            <Link href="#clients" className="link-primary">
              clients
            </Link>{' '}
            both large and small, across the globe.
          </p>
          <p>
            With a full range of{' '}
            <Link href="#services" className="link-primary">
              custom geographic services
            </Link>
            , we can help put together an entire project or target specific needs.{' '}
            <Link href="/contact" className="link-primary">
              Contact us
            </Link>{' '}
            about your spatial data, visual identity, technology set up, message, and audience.
          </p>
          <Link href="/about" className="btn-secondary mt-4">
            Learn More
          </Link>
        </div>
      </section>

      {/* Section Break */}
      <hr className="my-16 border-gray-200" />
    </>
  )
}

import Link from 'next/link'
import Image from 'next/image'

export default function Page() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative -mx-4 md:-mx-6 h-[500px] overflow-hidden">
        {/* Contour Background Images */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full max-w-7xl">
            <Image
              src="/contours_0.svg"
              alt=""
              fill
              className="object-cover opacity-20"
              priority
            />
            <Image
              src="/contours_750.svg"
              alt=""
              fill
              className="object-cover opacity-15"
              priority
            />
            <Image
              src="/contours_1500.svg"
              alt=""
              fill
              className="object-cover opacity-10"
              priority
            />
            <Image
              src="/contours_2250.svg"
              alt=""
              fill
              className="object-cover opacity-5"
              priority
            />
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 max-w-4xl">
            We bring the traditions of cartography to the Web
          </h1>
          <Link href="/contact" className="btn-primary">
            Contact Us
          </Link>
        </div>

        {/* Bottom Curve */}
        <div className="absolute bottom-0 left-0 right-0">
          <Image
            src="/contours_curve.svg"
            alt=""
            width={1920}
            height={100}
            className="w-full"
          />
        </div>
      </section>

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

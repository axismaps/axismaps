import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'About',
  description: 'Learn about Axis Maps and our values and vision',
}

export default function AboutPage() {
  return (
    <section className="pb-24">
      {/* Hero Banner - Match homepage width */}
      <div className="relative -mx-4 md:-mx-6 mb-12">
        <div
          className="w-full h-[50vh] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/madison.jpg)' }}
        />
      </div>
        {/* Values and Vision Section */}
        <div className="container max-w-4xl">
          <h1 className="text-5xl font-bold mb-8">Values and vision</h1>

          <div className="prose prose-lg max-w-none">
            <p>
              <strong>Axis Maps</strong> was formed in 2006 and quickly became engaged with the rapidly changing
              field of interactive mapping. Google Maps had launched the previous spring. <strong>We were surprised
              to see that the cartographic fundamentals and traditions we studied in grad school were falling by
              the wayside.</strong> Many new maps focused on the technical aspects of delivering geographic content
              over the web rather than clear communication through cartographic design.
            </p>

            <p>
              We formed Axis Maps to bring Cartography to what was becoming a technical field. While other companies
              focused on algorithms, we developed intuitive user-interfaces. <strong>When they built software to reach
              the broadest market possible, we designed custom maps to make sure each map was right for our
              client.</strong> We believe new map technologies should be used not only for efficiency and delivery,
              but also for great cartographic and interactive design.
            </p>
          </div>

          <Link href="/contact" className="btn-primary mt-8">
            Contact Us
          </Link>
        </div>

        {/* Section Break */}
        <hr className="my-16 border-gray-200" />

        {/* Meet the Team Section */}
        {/*<div className="container max-w-4xl">*/}
        {/*  <h2 className="text-3xl font-bold mb-8">Meet the Team</h2>*/}

        {/*  <div className="grid gap-8">*/}
        {/*    /!* David Heyman *!/*/}
        {/*    <div className="flex gap-6">*/}
        {/*      <div className="flex-1">*/}
        {/*        <h3 className="text-xl font-semibold mb-2">David Heyman</h3>*/}
        {/*        <p className="text-gray-700 mb-3">*/}
        {/*          As Managing Director of Axis Maps, Dave looks after clients, their projects and the Axis Maps team.*/}
        {/*        </p>*/}
        {/*        <ul className="list-disc list-inside text-gray-600">*/}
        {/*          <li>Client relations</li>*/}
        {/*          <li>Technical lead</li>*/}
        {/*          <li>Data organizer</li>*/}
        {/*        </ul>*/}
        {/*      </div>*/}
        {/*    </div>*/}

        {/*    /!* Ben Sheesley *!/*/}
        {/*    <div className="flex gap-6">*/}
        {/*      <div className="flex-1">*/}
        {/*        <h3 className="text-xl font-semibold mb-2">Ben Sheesley</h3>*/}
        {/*        <p className="text-gray-700 mb-3">*/}
        {/*          Ben is Axis Maps' Lead Designer, bringing his thoughtful designs to all of our projects.*/}
        {/*        </p>*/}
        {/*        <ul className="list-disc list-inside text-gray-600">*/}
        {/*          <li>Map & UI designer</li>*/}
        {/*          <li>Shipping magnate</li>*/}
        {/*          <li>Stickler for details</li>*/}
        {/*        </ul>*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</div>*/}
    </section>
  )
}

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm py-4">
        <nav className="container mx-auto flex justify-between items-center px-4">
          <Link href="/" className="text-2xl font-bold text-primary">
            Wellfluence
          </Link>
          <div className="space-x-4">
            <Link href="/login" className="text-dark hover:text-primary">
              Login
            </Link>
            <Link href="/register" className="btn-primary">
              Register
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-500 to-teal-500 text-white py-20 md:py-32">
          <div className="container mx-auto text-center px-4">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Empowering Health & Wellness Connections
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto mb-10">
              Wellfluence is the premier platform connecting Health & Wellness brands with authentic, impactful influencers for measurable marketing campaigns.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/register?role=BRAND" className="btn-primary bg-white text-primary hover:bg-gray-100">
                For Brands
              </Link>
              <Link href="/register?role=INFLUENCER" className="btn-secondary border-white text-white hover:bg-white hover:text-primary">
                For Influencers
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-light">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-dark mb-12">
              How Wellfluence Transforms Marketing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="text-primary mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9h-9m-9 0a9 9 0 01-9-9m9 9a9 9 0 00-9-9m9 9h-9" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-dark mb-4">Targeted Discovery</h3>
                <p className="text-gray-600">
                  Brands effortlessly find health & wellness influencers based on niche, audience demographics, engagement rates, and more.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="text-secondary mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M18 16V6H6v10h12z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-dark mb-4">Seamless Collaboration</h3>
                <p className="text-gray-600">
                  Integrated tools for campaign briefing, content approval, and communication simplify every step of your partnership.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="text-primary mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M18 14V6M6 14V6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-dark mb-4">Transparent Analytics</h3>
                <p className="text-gray-600">
                  Track campaign performance with detailed metrics, ensuring clear ROI and data-driven decisions for brands.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-secondary text-white py-16">
          <div className="container mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Elevate Your Health & Wellness Marketing?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Join Wellfluence today and connect with the right audience through trusted voices.
            </p>
            <Link href="/register" className="btn-primary bg-white text-secondary hover:bg-gray-100">
              Get Started Now
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white py-8">
        <div className="container mx-auto text-center px-4">
          <p className="mb-4">© 2024 Wellfluence. All rights reserved.</p>
          <div className="flex justify-center space-x-6">
            <Link href="#" className="hover:text-primary">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary">Terms of Service</Link>
            <Link href="#" className="hover:text-primary">Contact Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
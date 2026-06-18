import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            Wellfluence
          </Link>
          <div className="space-x-4">
            <Link href="/login" className="text-gray-600 hover:text-primary-600">Login</Link>
            <Link href="/register" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition duration-300">Register</Link>
          </div>
        </nav>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-primary-600 to-green-400 text-white py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Amplify Your Health & Wellness Brand
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto mb-10 opacity-90">
              Wellfluence connects leading health and wellness brands with influential content creators to reach engaged audiences and drive authentic growth.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/register?role=BRAND" className="px-8 py-4 bg-white text-primary-600 font-semibold rounded-full shadow-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105">
                Join as a Brand
              </Link>
              <Link href="/register?role=INFLUENCER" className="px-8 py-4 border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-primary-600 transition duration-300 transform hover:scale-105">
                Join as an Influencer
              </Link>
            </div>
          </div>
        </section>

        {/* Features for Brands */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">For Brands: Discover Your Perfect Influencer</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <div className="mb-4 text-primary-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Targeted Discovery</h3>
                <p className="text-gray-600">Find influencers by niche, audience demographics, and performance metrics, ensuring a perfect match for your campaign.</p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <div className="mb-4 text-primary-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Transparent Campaigns</h3>
                <p className="text-gray-600">Manage campaign objectives, budgets, and deliverables with clear communication and content approval workflows.</p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <div className="mb-4 text-primary-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Measurable ROI</h3>
                <p className="text-gray-600">Track real-time performance, engagement, and ROI with comprehensive analytics and detailed campaign reports.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features for Influencers */}
        <section className="py-20 bg-primary-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">For Influencers: Monetize Your Influence</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <div className="mb-4 text-secondary-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 100 4m-3 13a4 4 0 004 4m6-12a4 4 0 100 8m-11 12a4 4 0 100-8m7-12a4 4 0 100 8" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Relevant Opportunities</h3>
                <p className="text-gray-600">Connect with authentic health and wellness brands that align with your values and content style.</p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <div className="mb-4 text-secondary-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Fair Compensation</h3>
                <p className="text-gray-600">Negotiate and secure fair compensation with a transparent payment system and secure escrow services.</p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <div className="mb-4 text-secondary-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Grow Your Portfolio</h3>
                <p className="text-gray-600">Showcase your expertise with a professional portfolio and gain access to resources for content excellence.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-primary-600 text-white text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Join the Wellfluence Ecosystem?</h2>
            <p className="text-lg md:text-xl max-w-3xl mx-auto mb-10 opacity-90">
              Whether you're a brand seeking impactful partnerships or an influencer ready to elevate your career, Wellfluence is your platform.
            </p>
            <Link href="/register" className="px-10 py-5 bg-white text-primary-600 font-bold rounded-full text-lg shadow-xl hover:bg-gray-100 transition duration-300 transform hover:scale-105">
              Get Started Today
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-10">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Wellfluence</h3>
            <p className="text-sm">Connecting health & wellness with influence.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/for-brands" className="hover:text-primary-400">For Brands</Link></li>
              <li><Link href="/for-influencers" className="hover:text-primary-400">For Influencers</Link></li>
              <li><Link href="/campaigns" className="hover:text-primary-400">Explore Campaigns</Link></li>
              <li><Link href="/influencers" className="hover:text-primary-400">Find Influencers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-primary-400">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary-400">Contact</Link></li>
              <li><Link href="/careers" className="hover:text-primary-400">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy-policy" className="hover:text-primary-400">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-primary-400">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-primary-400">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Wellfluence. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
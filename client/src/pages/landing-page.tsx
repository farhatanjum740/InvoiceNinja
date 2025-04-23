import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BannerAd, InContentAd } from "@/components/ui/adsense";
import { Helmet } from "react-helmet";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Helmet>
        <title>InvoiceGenius - GST Invoicing for Indian Businesses</title>
        <meta name="description" content="Create professional GST-compliant invoices quickly and easily with InvoiceGenius. Manage customers, products, and payments all in one place." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "InvoiceGenius",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "INR"
            },
            "description": "GST-compliant invoicing software for Indian businesses"
          })}
        </script>
      </Helmet>
      
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gray-800">InvoiceGenius</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/auth">
              <Button>Sign Up Free</Button>
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Banner Ad */}
      <div className="container mx-auto">
        <BannerAd client="ca-pub-xxxxxxxxxxxxxxxx" slot="xxxxxxxxxx" />
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
          Effortless GST Invoicing <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            For Indian Businesses
          </span>
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
          Create professional invoices with automatic GST calculations, manage customers,
          and track payments—all in one intuitive platform.
        </p>
        <div className="mt-10">
          <Link href="/auth">
            <Button size="lg" className="px-8 py-6 text-lg">
              Get Started — It's Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Everything You Need for Efficient Invoicing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            title="GST Compliant Invoicing"
            description="Automatically calculate CGST, SGST, and IGST based on your location and your customer's location."
            icon="📝"
          />
          <FeatureCard
            title="Customer Management"
            description="Create and maintain a database of your customers with complete billing and shipping information."
            icon="👥"
          />
          <FeatureCard
            title="Product Catalog"
            description="Manage your products with HSN codes, pricing, and GST rates for quick invoice creation."
            icon="📦"
          />
          <FeatureCard
            title="Professional Templates"
            description="Choose from multiple invoice templates and customize colors to match your brand."
            icon="🎨"
          />
          <FeatureCard
            title="PDF Export"
            description="Generate professional PDF invoices ready to be sent to your customers."
            icon="📄"
          />
          <FeatureCard
            title="Business Insights"
            description="Get valuable insights about your sales, outstanding payments, and customer statistics."
            icon="📊"
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-16 bg-gray-50 rounded-lg my-12">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <StepCard
            number="1"
            title="Create Account"
            description="Sign up for free and set up your company profile with business details."
          />
          <StepCard
            number="2"
            title="Add Products & Customers"
            description="Build your catalog and add your customers to the system."
          />
          <StepCard
            number="3"
            title="Create Invoices"
            description="Generate professional invoices with automatic tax calculations."
          />
          <StepCard
            number="4"
            title="Get Paid"
            description="Download as PDF, send to your customers, and track payments."
          />
        </div>
      </section>

      {/* In-content Ad */}
      <div className="container mx-auto">
        <InContentAd client="ca-pub-xxxxxxxxxxxxxxxx" slot="xxxxxxxxxx" />
      </div>
      
      {/* Testimonials */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          What Our Users Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <TestimonialCard
            quote="This invoicing system has transformed how we handle our GST billing. The automatic tax calculations save us hours every month."
            author="Rajesh Kumar"
            company="Sunrise Electronics"
          />
          <TestimonialCard
            quote="The multiple invoice templates and customization options help us maintain our brand identity while sending professional invoices."
            author="Priya Sharma"
            company="Design Studios"
          />
          <TestimonialCard
            quote="Managing customers and tracking invoices has never been easier. This is exactly what small businesses in India need."
            author="Amit Patel"
            company="Greenleaf Organics"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">
          Ready to Streamline Your Invoicing?
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
          Join thousands of businesses who use InvoiceGenius to simplify their billing process.
          Get started for free today!
        </p>
        <Link href="/auth">
          <Button size="lg" className="px-8 py-6 text-lg">
            Create Your Free Account
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">InvoiceGenius</h3>
              <p className="text-gray-300">
                The complete invoicing solution for Indian businesses. Create GST-compliant invoices quickly and easily.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-300">
                <li>GST Invoicing</li>
                <li>Customer Management</li>
                <li>Product Catalog</li>
                <li>Invoice Templates</li>
                <li>Business Reports</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Blog</li>
                <li>Help Center</li>
                <li>GST Guide</li>
                <li>API Documentation</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-300">
                <li>About Us</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-300">
            <p>© {new Date().getFullYear()} InvoiceGenius. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md transition-all hover:shadow-lg">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function TestimonialCard({ quote, author, company }: { quote: string; author: string; company: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md relative">
      <div className="text-4xl text-gray-200 absolute top-4 left-4">"</div>
      <p className="text-gray-600 mb-6 relative z-10">{quote}</p>
      <div>
        <p className="font-semibold text-gray-800">{author}</p>
        <p className="text-gray-500 text-sm">{company}</p>
      </div>
    </div>
  );
}
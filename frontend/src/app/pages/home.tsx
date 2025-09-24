import type { JSX } from 'react';
import { Link } from '@tanstack/react-router';
import { Star } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardFooter } from '@/shared/components/ui/Card';

export const Home = (): JSX.Element => {
  const professionals = [
    {
      category: "Frontend Developer",
      name: "Erik Andersson",
      location: "Stockholm, Sweden",
      description: "Specialized in React, TypeScript, and modern web technologies. 8+ years crafting scalable applications for Nordic enterprises.",
      status: "available",
      rating: 4.9,
      reviews: 47,
      rate: "€85/hour",
      accent: "bg-accent-blue"
    },
    {
      category: "UX/UI Designer",
      name: "Astrid Hansen",
      location: "Copenhagen, Denmark",
      description: "Expert in user experience design and design systems. Collaborates closely with development teams to create intuitive interfaces.",
      status: "busy",
      rating: 4.8,
      reviews: 32,
      rate: "€70/hour",
      accent: "bg-accent-warm"
    }
  ];

  return (
    <div className="min-h-screen bg-nordic-cream">
      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="max-w-4xl">
            <div className="mb-8">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-nordic-warm text-text-secondary text-xs font-medium uppercase tracking-wider">
                Nordic Professional Marketplace
              </span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-semibold leading-tight text-text-primary mb-8 tracking-tight">
              Connect with master craftspeople of the{' '}
              <span className="bg-gradient-to-r from-accent-blue to-accent-primary bg-clip-text text-transparent">
                digital age
              </span>
            </h1>
            <p className="text-xl text-text-secondary leading-relaxed mb-12 max-w-2xl font-light">
              Just as Völund forged legendary works with unmatched skill, Valunds connects Nordic businesses with exceptional digital professionals who embody the same dedication to craft and excellence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/find-talent">
                <Button size="lg" className="w-full sm:w-auto">
                  Find Professionals
                </Button>
              </Link>
              <Link to="/professionals">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Join as Professional
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Professionals */}
      <section className="py-24 bg-nordic-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <h2 className="text-3xl font-semibold text-text-primary mb-16 tracking-tight">Featured Professionals</h2>

          <div className="grid lg:grid-cols-2 gap-8">
            {professionals.map((pro) => (
              <Card key={pro.name} className="group">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-medium uppercase tracking-wider text-text-muted bg-nordic-warm px-3 py-1 rounded-full">
                    {pro.category}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${pro.accent}`} />
                </div>

                <h3 className="text-2xl font-semibold text-text-primary mb-2 tracking-tight">{pro.name}</h3>
                <p className="text-text-secondary mb-6 font-medium">{pro.location}</p>

                <CardContent>
                  <p className="text-text-secondary leading-relaxed">{pro.description}</p>
                </CardContent>

                <div className="flex flex-wrap items-center gap-6 mb-8">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${pro.status === 'available' ? 'bg-accent-green' : 'bg-accent-warm'}`} />
                    <span className="text-sm text-text-secondary">
                      {pro.status === 'available' ? 'Available' : 'Next available March 2025'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-accent-warm text-accent-warm" />
                    <span className="text-sm text-text-secondary">{pro.rating} ({pro.reviews} reviews)</span>
                  </div>
                  <span className="text-sm font-medium text-text-secondary">{pro.rate}</span>
                </div>

                <CardFooter>
                  <Button className="flex-1">Contact</Button>
                  <Button variant="ghost">Portfolio</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-24 bg-nordic-warm">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <Card>
            <blockquote className="text-2xl lg:text-3xl leading-relaxed text-text-primary mb-8 font-light italic">
              "Working with Valunds feels like teaming up with your own crew, just in another (very cool) office. The professionals go above and beyond to enhance our projects and are genuinely amazing to work with."
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-accent-blue rounded-full flex items-center justify-center text-white font-semibold text-lg">
                MK
              </div>
              <div>
                <h4 className="font-semibold text-text-primary mb-1">Magdalena Kiczek</h4>
                <p className="text-text-secondary text-sm">Head of Marketing, DataFeedWatch</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-accent-primary">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-6 tracking-tight">
            Ready to start your next project?
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed max-w-2xl mx-auto">
            Join thousands of Nordic businesses who trust Valunds to connect them with exceptional talent.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button variant="secondary" size="lg" className="bg-white text-accent-primary hover:bg-gray-100">
                Start Your Project
              </Button>
            </Link>
            <Link to="/find-talent">
              <Button variant="ghost" size="lg" className="text-white border-2 border-blue-200 hover:bg-blue-50 hover:text-accent-primary">
                Browse Talent
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

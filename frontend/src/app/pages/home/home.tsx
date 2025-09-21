import React from 'react';
import { Link } from '@tanstack/react-router';

interface Professional {
  id: string;
  name: string;
  role: string;
  location: string;
  description: string;
  status: 'available' | 'busy' | 'unavailable';
  rating: number;
  reviews: number;
  hourlyRate: number;
  avatar: string;
}

interface Testimonial {
  id: string;
  content: string;
  author: {
    name: string;
    title: string;
    company: string;
    avatar: string;
  };
}

const featuredProfessionals: Professional[] = [
  {
    id: '1',
    name: 'Erik Andersson',
    role: 'Frontend Developer',
    location: 'Stockholm, Sweden',
    description: 'Specialized in React, TypeScript, and modern web technologies. 8+ years crafting scalable applications for Nordic enterprises, with a focus on performance and user experience.',
    status: 'available',
    rating: 4.9,
    reviews: 47,
    hourlyRate: 85,
    avatar: 'EA'
  },
  {
    id: '2',
    name: 'Astrid Hansen',
    role: 'UX/UI Designer',
    location: 'Copenhagen, Denmark',
    description: 'Expert in user experience design and design systems. Collaborates closely with development teams to create intuitive interfaces that drive business results.',
    status: 'busy',
    rating: 4.8,
    reviews: 32,
    hourlyRate: 70,
    avatar: 'AH'
  }
];

const testimonial: Testimonial = {
  id: '1',
  content: "Working with Valunds feels like teaming up with your own crew, just in another (very cool) office. The professionals go above and beyond to enhance our projects and are genuinely amazing to work with.",
  author: {
    name: 'Magdalena Kiczek',
    title: 'Head of Marketing',
    company: 'DataFeedWatch',
    avatar: 'MK'
  }
};

const StatusIndicator: React.FC<{ status: Professional['status']; nextAvailable?: string }> = ({
  status,
  nextAvailable
}) => {
  const statusConfig = {
    available: { color: 'bg-accent-green', text: 'Available' },
    busy: { color: 'bg-accent-warm', text: nextAvailable || 'Busy' },
    unavailable: { color: 'bg-text-muted', text: 'Unavailable' }
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2 text-sm text-text-secondary">
      <span className={`w-2 h-2 rounded-full ${config.color}`}></span>
      {config.text}
    </div>
  );
};

const ProfessionalCard: React.FC<{ professional: Professional }> = ({ professional }) => {
  return (
    <div className="card-nordic group">
      <div className="text-sm font-medium text-text-muted uppercase tracking-wide mb-4">
        {professional.role}
      </div>

      <h3 className="heading-3 mb-1">{professional.name}</h3>
      <div className="text-text-secondary mb-6">{professional.location}</div>

      <p className="text-text-secondary leading-relaxed mb-8">
        {professional.description}
      </p>

      <div className="flex flex-wrap items-center gap-6 mb-8">
        <StatusIndicator
          status={professional.status}
          nextAvailable={professional.status === 'busy' ? 'Next available March 2025' : undefined}
        />
        <div className="flex items-center gap-1 text-sm text-text-secondary">
          <span>★</span>
          <span>{professional.rating} ({professional.reviews} reviews)</span>
        </div>
        <div className="text-sm text-text-secondary">
          €{professional.hourlyRate}/hour
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {professional.status === 'available' ? (
          <Link to={`/professional/${professional.id}`} className="btn-primary">
            Contact
          </Link>
        ) : (
          <Link to={`/professional/${professional.id}`} className="btn-secondary">
            Schedule Consultation
          </Link>
        )}
        <Link to={`/professional/${professional.id}/portfolio`} className="btn-ghost">
          View Portfolio
        </Link>
      </div>
    </div>
  );
};

const TestimonialSection: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => {
  return (
    <div className="bg-bg-warm rounded-xl p-12 my-16">
      <blockquote className="text-xl md:text-2xl leading-relaxed text-text-primary mb-8 font-normal tracking-tight">
        "{testimonial.content}"
      </blockquote>

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-accent-blue flex items-center justify-center text-white font-semibold">
          {testimonial.author.avatar}
        </div>
        <div>
          <div className="font-semibold text-text-primary mb-1">
            {testimonial.author.name}
          </div>
          <div className="text-sm text-text-secondary">
            {testimonial.author.title}, {testimonial.author.company}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Home: React.FC = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="section-padding">
        <div className="container-nordic">
          <div className="max-w-4xl">
            <div className="text-sm font-medium text-text-muted uppercase tracking-widest mb-8">
              Nordic Professional Marketplace
            </div>

            <h1 className="heading-1 mb-8 text-balance">
              Connect with master craftspeople of the digital age
            </h1>

            <p className="body-large max-w-2xl mb-12">
              Just as Völund forged legendary works with unmatched skill, Valunds connects Nordic businesses with exceptional digital professionals who embody the same dedication to craft and excellence.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/find-talent" className="btn-primary">
                Find Professionals
              </Link>
              <Link to="/for-professionals" className="btn-secondary">
                Join as Professional
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Professionals */}
      <section className="section-padding">
        <div className="container-nordic">
          <h2 className="heading-2 mb-12">Featured Professionals</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredProfessionals.map((professional) => (
              <ProfessionalCard key={professional.id} professional={professional} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section>
        <div className="container-nordic">
          <TestimonialSection testimonial={testimonial} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding">
        <div className="container-nordic">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Contact Form Card */}
            <div className="card-nordic">
              <h3 className="heading-3 mb-4">Start a Project</h3>
              <p className="text-text-secondary mb-6">
                Ready to connect with Nordic professionals who share your commitment to excellence?
              </p>

              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your company"
                    className="input-nordic"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="contact@yourcompany.com"
                    className="input-nordic"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Project Type
                  </label>
                  <input
                    type="text"
                    placeholder="Web development, design, etc."
                    className="input-nordic"
                  />
                </div>

                <button type="submit" className="btn-primary w-full">
                  Get Started
                </button>
              </form>
            </div>

            {/* Quality Assurance Card */}
            <div className="card-nordic">
              <div className="text-sm font-medium text-text-muted uppercase tracking-wide mb-4">
                Quality Assurance
              </div>
              <h3 className="heading-3 mb-4">WCAG AA Compliant</h3>
              <div className="text-text-secondary space-y-2">
                <p className="font-medium mb-4">Accessibility Standards:</p>
                <p>• Primary text contrast: 12.6:1 ✓</p>
                <p>• Secondary text contrast: 5.7:1 ✓</p>
                <p>• Interactive elements: 4.5:1+ ✓</p>
                <p>• Focus indicators: 3:1+ ✓</p>
              </div>
            </div>

            {/* Network Card */}
            <div className="card-nordic">
              <div className="text-sm font-medium text-text-muted uppercase tracking-wide mb-4">
                Professional Network
              </div>
              <h3 className="heading-3 mb-4">Nordic Excellence</h3>
              <p className="text-text-secondary mb-6">
                Our marketplace connects you with verified professionals across Sweden, Norway, Denmark, and Finland who embody the Nordic values of quality, reliability, and innovation.
              </p>
              <Link to="/find-talent" className="btn-secondary">
                Browse Talent
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

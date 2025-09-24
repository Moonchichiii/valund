import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Globe, Heart, Lightbulb, Shield } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { JSX } from 'react';

export const About = (): JSX.Element => {
  const values = [
    {
      id: 'craft-excellence',
      icon: <Heart className="w-8 h-8" />,
      title: "Craft & Excellence",
      description: "Just like the legendary smith Völund, we believe in the power of masterful craftsmanship and attention to detail.",
      color: "text-accent-warm"
    },
    {
      id: 'trust-reliability',
      icon: <Shield className="w-8 h-8" />,
      title: "Trust & Reliability",
      description: "Nordic values of honesty, transparency, and reliability form the foundation of every partnership we facilitate.",
      color: "text-accent-blue"
    },
    {
      id: 'innovation-quality',
      icon: <Lightbulb className="w-8 h-8" />,
      title: "Innovation & Quality",
      description: "We connect forward-thinking businesses with professionals who embrace both tradition and innovation.",
      color: "text-accent-green"
    }
  ];

  const stats = [
    { id: 'professionals', number: "500+", label: "Verified Professionals" }, // Fix 4: Add unique IDs
    { id: 'clients', number: "200+", label: "Satisfied Clients" },
    { id: 'rating', number: "4.9/5", label: "Average Rating" },
    { id: 'success', number: "98%", label: "Project Success Rate" }
  ];

  const team = [
    {
      id: 'magnus-eriksson', // Fix 4: Add unique IDs
      name: "Magnus Eriksson",
      title: "Founder & CEO",
      location: "Stockholm, Sweden",
      avatar: "ME",
      description: "Former tech lead at Spotify with 15+ years in Nordic tech industry."
    },
    {
      id: 'ingrid-larsen',
      name: "Ingrid Larsen",
      title: "Head of Community",
      location: "Copenhagen, Denmark",
      avatar: "IL",
      description: "Expert in building professional networks across the Nordic region."
    },
    {
      id: 'olav-hansen',
      name: "Olav Hansen",
      title: "VP of Engineering",
      location: "Oslo, Norway",
      avatar: "OH",
      description: "Platform architect ensuring seamless connections between talent and clients."
    }
  ];

  return (
    <div className="min-h-screen bg-nordic-cream">
      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-semibold leading-tight text-text-primary mb-8 tracking-tight">
              Forging connections through{' '}
              <span className="bg-gradient-to-r from-accent-blue to-accent-green bg-clip-text text-transparent">
                Nordic values
              </span>
            </h1>
            <p className="text-xl text-text-secondary leading-relaxed mb-12 max-w-3xl mx-auto">
              Named after Völund, the master craftsman of Norse mythology, Valunds embodies the same dedication to
              excellence, connecting Nordic businesses with digital professionals who share these timeless values.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24 bg-nordic-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-semibold text-text-primary mb-8 tracking-tight">Our Story</h2>
              <div className="space-y-6 text-text-secondary leading-relaxed">
                <p>
                  In 2019, we recognized a gap in the digital marketplace: while talent platforms existed globally,
                  none truly understood the unique Nordic approach to work and business relationships.
                </p>
                <p>
                  Nordic professionals value quality over quantity, long-term relationships over quick transactions,
                  and sustainable practices over rapid growth. Similarly, Nordic businesses seek partners who share
                  these values and understand their market dynamics.
                </p>
                <p>
                  Valunds was born to bridge this gap, creating a marketplace that honors Nordic traditions of
                  craftsmanship while embracing the digital future.
                </p>
              </div>
            </div>
            <Card variant="warm" className="text-center">
              <div className="text-6xl mb-6">⚒️</div>
              <h3 className="text-2xl font-semibold text-text-primary mb-4">The Völund Legacy</h3>
              <p className="text-text-secondary leading-relaxed">
                In Norse mythology, Völund was the greatest of smiths, known for creating works of unparalleled beauty
                and functionality. His dedication to perfection and mastery of craft inspires our mission today.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-nordic-warm">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-text-primary mb-6 tracking-tight">Our Nordic Values</h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              These core principles guide every decision we make and every connection we facilitate.
            </p>
          </div>

            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value) => (
                <Card key={value.id} className="text-center group">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-nordic-lg bg-nordic-warm ${value.color} mb-6 group-hover:scale-110 transition-transform duration-200`}>
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary mb-4">{value.title}</h3>
                  <p className="text-text-secondary leading-relaxed">{value.description}</p>
                </Card>
              ))}
            </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 bg-accent-primary">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-white mb-6 tracking-tight">Our Impact in Numbers</h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Since our founding, we've built a thriving community of Nordic professionals and businesses.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.id} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-blue-200 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-nordic-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-text-primary mb-6 tracking-tight">Meet Our Team</h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Nordic professionals who understand both the traditional values and modern needs of our community.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member) => (
              <div key={member.id} className="text-center group">
                <div className="w-24 h-24 bg-accent-blue rounded-3xl flex items-center justify-center text-white font-semibold text-xl mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                  {member.avatar}
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">{member.name}</h3>
                <p className="text-text-secondary font-medium mb-2">{member.title}</p>
                <p className="text-sm text-text-muted mb-4">{member.location}</p>
                <p className="text-text-secondary leading-relaxed">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 bg-nordic-warm">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <Card>
            <Globe className="w-16 h-16 text-accent-blue mx-auto mb-8" />
            <h2 className="text-3xl font-semibold text-text-primary mb-6 tracking-tight">Our Mission</h2>
            <p className="text-xl text-text-secondary leading-relaxed mb-8">
              To preserve and celebrate Nordic values of quality, reliability, and innovation in the digital age,
              while creating meaningful connections between businesses and professionals who share these principles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg">
                  Join Our Community
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="secondary" size="lg">
                  Contact Us
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

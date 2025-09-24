import { Link } from '@tanstack/react-router';
import { CheckCircle, Clock, Heart, Shield, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import type { JSX } from 'react';

export const Professionals = (): JSX.Element => {
  const benefits = [
    {
      id: 'premium-rates',
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Premium Rates",
      description: "Earn competitive rates that reflect your Nordic expertise and quality standards.",
      color: "text-accent-blue"
    },
    {
      id: 'quality-clients',
      icon: <Users className="w-8 h-8" />,
      title: "Quality Clients",
      description: "Work with established Nordic businesses that value craftsmanship and long-term partnerships.",
      color: "text-accent-green"
    },
    {
      id: 'flexible-schedule',
      icon: <Clock className="w-8 h-8" />,
      title: "Flexible Schedule",
      description: "Maintain your work-life balance with flexible project arrangements and remote opportunities.",
      color: "text-accent-warm"
    },
    {
      id: 'secure-payments',
      icon: <Shield className="w-8 h-8" />,
      title: "Secure Payments",
      description: "Get paid on time, every time, with our secure payment protection system.",
      color: "text-accent-primary"
    }
  ];

  const steps = [
    {
      id: 'create-profile',
      number: "01",
      title: "Create Your Profile",
      description: "Showcase your skills, experience, and Nordic craftsmanship philosophy."
    },
    {
      id: 'get-verified',
      number: "02",
      title: "Get Verified",
      description: "Our team reviews your profile to ensure quality standards are met."
    },
    {
      id: 'connect-clients',
      number: "03",
      title: "Connect with Clients",
      description: "Receive invitations from businesses seeking your specific expertise."
    },
    {
      id: 'deliver-excellence',
      number: "04",
      title: "Deliver Excellence",
      description: "Complete projects and build lasting relationships with Nordic businesses."
    }
  ];

  return (
    <div className="min-h-screen bg-nordic-cream">
      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-nordic-warm text-text-secondary text-xs font-medium uppercase tracking-wider">
                <Heart className="w-4 h-4 mr-2 text-accent-warm" />
                For Nordic Professionals
              </span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-semibold leading-tight text-text-primary mb-8 tracking-tight">
              Join the Nordic{' '}
              <span className="bg-gradient-to-r from-accent-blue to-accent-green bg-clip-text text-transparent">
                craft community
              </span>
            </h1>
            <p className="text-xl text-text-secondary leading-relaxed mb-12 max-w-3xl mx-auto">
              Connect with businesses that appreciate Nordic values of quality, reliability, and innovation.
              Build your reputation among clients who understand the value of exceptional craftsmanship.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg">
                  Join Now
                </Button>
              </Link>
              <Button variant="secondary" size="lg">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-nordic-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-text-primary mb-6 tracking-tight">Why Nordic Professionals Choose Valunds</h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              We understand what makes Nordic professionals exceptional and connect you with clients who value that quality.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.id} className="text-center group">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-nordic-lg bg-nordic-warm ${benefit.color} mb-6 group-hover:scale-110 transition-transform duration-200`}>
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-4">{benefit.title}</h3>
                <p className="text-text-secondary leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-nordic-warm">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-text-primary mb-6 tracking-tight">How It Works</h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Getting started is simple. We've streamlined the process so you can focus on what you do best.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <Card key={step.id} className="text-center relative">
                <div className="text-6xl font-bold text-border-light mb-4">{step.number}</div>
                <h3 className="text-xl font-semibold text-text-primary mb-4">{step.title}</h3>
                <p className="text-text-secondary leading-relaxed">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-border-medium" />
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-24 bg-nordic-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-text-primary mb-6 tracking-tight">Success Stories</h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Hear from Nordic professionals who have built successful careers through Valunds.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <Card variant="warm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-accent-blue rounded-nordic-lg flex items-center justify-center text-white font-semibold text-lg">
                  EA
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-1">Erik Andersson</h4>
                  <p className="text-text-secondary text-sm">Frontend Developer from Stockholm</p>
                </div>
              </div>
              <blockquote className="text-lg text-text-primary italic mb-4">
                "Valunds connected me with clients who truly appreciate quality code and Nordic design principles.
                I've tripled my income while working on projects I'm passionate about."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-accent-green" />
                  <span className="text-sm text-text-secondary">50+ completed projects</span>
                </div>
                <div className="text-sm text-text-secondary">€85/hour average</div>
              </div>
            </Card>

            <Card variant="warm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-accent-warm rounded-nordic-lg flex items-center justify-center text-white font-semibold text-lg">
                  AH
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-1">Astrid Hansen</h4>
                  <p className="text-text-secondary text-sm">UX Designer from Copenhagen</p>
                </div>
              </div>
              <blockquote className="text-lg text-text-primary italic mb-4">
                "The quality of clients on Valunds is exceptional. They understand design process and value
                the time needed to create thoughtful user experiences."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-accent-green" />
                  <span className="text-sm text-text-secondary">30+ completed projects</span>
                </div>
                <div className="text-sm text-text-secondary">€70/hour average</div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-accent-primary to-accent-blue">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-6 tracking-tight">
            Ready to elevate your career?
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed max-w-2xl mx-auto">
            Join the community of Nordic professionals who are building exceptional careers with clients who value quality.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button variant="secondary" size="lg" className="bg-white text-accent-primary hover:bg-gray-100">
                Apply to Join
              </Button>
            </Link>
            <Button variant="ghost" size="lg" className="text-white border-2 border-blue-200 hover:bg-blue-50 hover:text-accent-primary">
              Schedule a Call
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

import { type JSX, useCallback, useState } from 'react';
import { Briefcase, CheckCircle, Mail, MapPin, Phone, Send, Users } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card } from '@/shared/components/ui/Card';

export const Contact = (): JSX.Element => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: 'client',
    projectType: '',
    message: ''
  });

  const handleSubmit = useCallback((e: React.FormEvent): void => {
    e.preventDefault();
    // Handle form submission here
    // eslint-disable-next-line no-console
    console.log('Form submitted:', formData);
    // You would typically send this to your backend
  }, [formData]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }, [formData]);

  const contactInfo = [
    {
      id: 'email',
      icon: <Mail className="w-6 h-6" />,
      title: "Email",
      content: "hello@valunds.com",
      description: "We'll respond within 24 hours"
    },
    {
      id: 'phone',
      icon: <Phone className="w-6 h-6" />,
      title: "Phone",
      content: "+46 8 123 456 78",
      description: "Mon-Fri, 9:00-17:00 CET"
    },
    {
      id: 'location',
      icon: <MapPin className="w-6 h-6" />,
      title: "Headquarters",
      content: "Stockholm, Sweden",
      description: "Serving all Nordic countries"
    }
  ];

  const reasons = [
    {
      id: 'find-talent',
      icon: <Users className="w-8 h-8" />,
      title: "Find Nordic Talent",
      description: "Connect with verified professionals across Sweden, Norway, Denmark, and Finland."
    },
    {
      id: 'join-professional',
      icon: <Briefcase className="w-8 h-8" />,
      title: "Join as Professional",
      description: "Become part of our exclusive network of Nordic digital craftspeople."
    },
    {
      id: 'partnership',
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Partnership Inquiries",
      description: "Explore collaboration opportunities and strategic partnerships."
    }
  ];

  return (
    <div className="min-h-screen bg-nordic-cream">
      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-semibold leading-tight text-text-primary mb-8 tracking-tight">
              Let's start your{' '}
              <span className="bg-gradient-to-r from-accent-blue to-accent-green bg-clip-text text-transparent">
                Nordic journey
              </span>
            </h1>
            <p className="text-xl text-text-secondary leading-relaxed mb-12 max-w-3xl mx-auto">
              Whether you're a business seeking exceptional talent or a professional ready to showcase your craft,
              we're here to help you make meaningful connections.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-3 gap-12">

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <h2 className="text-2xl font-semibold text-text-primary mb-8">Get in Touch</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Input
                      label="Full Name"
                      name="name"
                      required
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      name="email"
                      required
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <Input
                      label="Company/Organization"
                      name="company"
                      placeholder="Your company name"
                      value={formData.company}
                      onChange={handleChange}
                    />
                    <div className="space-y-2">
                      <label htmlFor="role-select" className="block text-sm font-medium text-text-primary">
                        I am a... <span className="text-error-500">*</span>
                      </label>
                      <select
                        id="role-select"
                        name="role"
                        required
                        className="w-full px-4 py-3 border border-border-medium rounded-nordic-lg focus:outline-none focus:border-accent-primary transition-colors bg-nordic-cream"
                        value={formData.role}
                        onChange={handleChange}
                      >
                        <option value="client">Business looking for talent</option>
                        <option value="professional">Professional seeking opportunities</option>
                        <option value="partner">Potential partner</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <Input
                    label="Project Type / Area of Interest"
                    name="projectType"
                    placeholder="e.g., Web development, UI/UX design, Mobile app"
                    value={formData.projectType}
                    onChange={handleChange}
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-primary">
                      Message <span className="text-error-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-border-medium rounded-nordic-lg focus:outline-none focus:border-accent-primary transition-colors bg-nordic-cream resize-none"
                      placeholder="Tell us about your project or how we can help..."
                      value={formData.message}
                      onChange={handleChange}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full group"
                  >
                    <Send className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                    Send Message
                  </Button>
                </form>
              </Card>
            </div>

            {/* Contact Info & Reasons */}
            <div className="space-y-8">

              {/* Contact Information */}
              <Card>
                <h3 className="text-xl font-semibold text-text-primary mb-6">Contact Information</h3>
                <div className="space-y-6">
                  {contactInfo.map((info) => (
                    <div key={info.id} className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-nordic-warm rounded-nordic-lg flex items-center justify-center text-accent-blue flex-shrink-0">
                        {info.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-text-primary mb-1">{info.title}</h4>
                        <p className="text-text-secondary mb-1">{info.content}</p>
                        <p className="text-sm text-text-muted">{info.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Why Contact Us */}
              <Card variant="warm">
                <h3 className="text-xl font-semibold text-text-primary mb-6">Why Contact Us?</h3>
                <div className="space-y-6">
                  {reasons.map((reason) => (
                    <div key={reason.id} className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-nordic-white rounded-nordic-lg flex items-center justify-center text-accent-blue flex-shrink-0">
                        {reason.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-text-primary mb-2">{reason.title}</h4>
                        <p className="text-sm text-text-secondary leading-relaxed">{reason.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Response Time */}
              <Card variant="dark">
                <div className="text-center">
                  <div className="w-16 h-16 bg-accent-blue rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Quick Response</h3>
                  <p className="text-blue-100 text-sm">
                    We typically respond to all inquiries within 24 hours during business days.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-nordic-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-text-primary mb-6 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xl text-text-secondary">
              Have questions? We've got answers to help you get started.
            </p>
          </div>

          <div className="space-y-8">
            <Card variant="warm" padding="md">
              <h3 className="font-semibold text-text-primary mb-3">How does Valunds ensure quality?</h3>
              <p className="text-text-secondary leading-relaxed">
                Every professional on our platform goes through a rigorous verification process. We review portfolios,
                conduct interviews, and check references to ensure they meet our Nordic standards for quality and reliability.
              </p>
            </Card>

            <Card variant="warm" padding="md">
              <h3 className="font-semibold text-text-primary mb-3">What makes Valunds different from other platforms?</h3>
              <p className="text-text-secondary leading-relaxed">
                We focus exclusively on Nordic markets and values. This means better cultural fit, shared work ethics,
                and professionals who understand the unique needs of Nordic businesses.
              </p>
            </Card>

            <Card variant="warm" padding="md">
              <h3 className="font-semibold text-text-primary mb-3">How quickly can I find talent for my project?</h3>
              <p className="text-text-secondary leading-relaxed">
                Most clients receive qualified candidate profiles within 48 hours of submitting their requirements.
                Our curated approach means you spend less time sorting through applications and more time interviewing the right people.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

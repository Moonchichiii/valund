import { Link } from '@tanstack/react-router';
import { ExternalLink, MessageCircle, Users } from 'lucide-react';

export const Footer = (): React.JSX.Element => (
  <footer className="bg-nordic-white border-t border-border-light">
    <div className="max-w-6xl mx-auto px-6 lg:px-12 py-16">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Company Info */}
        <div className="space-y-4">
          <Link to="/" className="text-2xl font-semibold text-text-primary tracking-tight">
            Valunds
          </Link>
          <p className="text-text-secondary text-sm leading-relaxed">
            Connecting Nordic businesses with exceptional digital professionals who embody dedication to craft and excellence.
          </p>
          <div className="flex space-x-4">
            <a
              href="https://twitter.com/valunds"
              className="w-10 h-10 bg-nordic-warm rounded-full flex items-center justify-center text-text-secondary hover:bg-accent-blue hover:text-white transition-all duration-200"
              aria-label="Follow us on Twitter"
            >
              <MessageCircle size={16} />
            </a>
            <a
              href="https://linkedin.com/company/valunds"
              className="w-10 h-10 bg-nordic-warm rounded-full flex items-center justify-center text-text-secondary hover:bg-accent-blue hover:text-white transition-all duration-200"
              aria-label="Connect with us on LinkedIn"
            >
              <Users size={16} />
            </a>
            <a
              href="https://github.com/valunds"
              className="w-10 h-10 bg-nordic-warm rounded-full flex items-center justify-center text-text-secondary hover:bg-accent-blue hover:text-white transition-all duration-200"
              aria-label="View our GitHub repositories"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

        {/* Services */}
        <div className="space-y-4">
          <h3 className="font-semibold text-text-primary text-sm uppercase tracking-wider">Services</h3>
          <ul className="space-y-3">
            <li>
              <Link to="/find-talent" className="text-text-secondary text-sm hover:text-accent-primary transition-colors">
                Find Talent
              </Link>
            </li>
            <li>
              <Link to="/professionals" className="text-text-secondary text-sm hover:text-accent-primary transition-colors">
                For Professionals
              </Link>
            </li>
            <li>
              <a href="#" className="text-text-secondary text-sm hover:text-accent-primary transition-colors">
                Project Management
              </a>
            </li>
            <li>
              <a href="#" className="text-text-secondary text-sm hover:text-accent-primary transition-colors">
                Quality Assurance
              </a>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div className="space-y-4">
          <h3 className="font-semibold text-text-primary text-sm uppercase tracking-wider">Company</h3>
          <ul className="space-y-3">
            <li>
              <Link to="/about" className="text-text-secondary text-sm hover:text-accent-primary transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-text-secondary text-sm hover:text-accent-primary transition-colors">
                Contact
              </Link>
            </li>
            <li>
              <a href="#" className="text-text-secondary text-sm hover:text-accent-primary transition-colors">
                Careers
              </a>
            </li>
            <li>
              <a href="#" className="text-text-secondary text-sm hover:text-accent-primary transition-colors">
                Press
              </a>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div className="space-y-4">
          <h3 className="font-semibold text-text-primary text-sm uppercase tracking-wider">Support</h3>
          <ul className="space-y-3">
            <li>
              <a href="#" className="text-text-secondary text-sm hover:text-accent-primary transition-colors">
                Help Center
              </a>
            </li>
            <li>
              <a href="#" className="text-text-secondary text-sm hover:text-accent-primary transition-colors">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="text-text-secondary text-sm hover:text-accent-primary transition-colors">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="#" className="text-text-secondary text-sm hover:text-accent-primary transition-colors">
                Security
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border-light mt-16 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-text-secondary text-sm">
            © {new Date().getFullYear()} Valunds. All rights reserved. Made with ❤️ in the Nordics.
          </p>
          <div className="flex items-center space-x-1 text-sm text-text-secondary">
            <span className="w-2 h-2 bg-accent-green rounded-full" />
            <span>WCAG AA Compliant</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

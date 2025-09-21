import { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { useAuthStatus, useLogout } from '@/shared/hooks/useAuth';
import { Button } from '@/shared/components/ui/Button';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStatus();
  const logout = useLogout();

  const navigation = [
    { name: 'Find Talent', href: '/find-talent' },
    { name: 'For Professionals', href: '/professionals' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const firstInitial =
    user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <nav className="bg-nordic-cream border-b border-border-light">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="flex justify-between items-center py-8">
          {/* Logo */}
          <Link to="/" className="text-2xl font-semibold text-text-primary tracking-tight">
            Valunds
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-12">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'text-text-primary border-b-2 border-accent-primary pb-1'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/app/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout.mutate()}
                  data-testid="logout-btn"
                >
                  Sign out
                </Button>

                <div className="w-8 h-8 bg-accent-blue rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {firstInitial}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" data-testid="signin-btn">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" data-testid="signup-btn">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-text-primary p-2 rounded-nordic hover:bg-nordic-warm transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-6 border-t border-border-light pt-6 animate-fade-in">
            <div className="space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block text-sm font-medium transition-colors py-2 px-4 rounded-nordic ${
                    isActive(item.href)
                      ? 'text-text-primary bg-nordic-warm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-nordic-warm'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Auth */}
              <div className="border-t border-border-light pt-4 mt-4 space-y-3">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/app/dashboard"
                      className="block bg-accent-primary text-white px-4 py-3 rounded-nordic-xl text-sm font-medium text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>

                    <button
                      onClick={() => {
                        logout.mutate();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-center px-4 py-3 text-sm font-medium text-text-secondary hover:text-text-primary"
                      data-testid="logout-btn"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block text-center px-4 py-3 text-sm font-medium text-text-secondary hover:text-text-primary"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="block bg-accent-primary text-white px-4 py-3 rounded-nordic-xl text-sm font-medium text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

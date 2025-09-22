// src/features/accounts/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useLogin } from '@/shared/hooks/useAuth';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card } from '@/shared/components/ui/Card';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const loginMutation = useLogin();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await loginMutation.mutateAsync({ email, password });
      toast.success('Welcome back!');
      navigate({ to: '/dashboard' });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to sign in. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-nordic-cream flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">

        {/* Back to Home */}
        <div className="flex items-center">
          <Link
            to="/"
            className="inline-flex items-center text-text-secondary hover:text-accent-blue transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center">
          <Link to="/" className="text-3xl font-bold text-accent-primary">
            Valunds
          </Link>
          <h2 className="mt-6 text-3xl font-semibold text-text-primary">
            Welcome back
          </h2>
          <p className="mt-2 text-text-secondary">
            Sign in to your Nordic professional account
          </p>
        </div>

        {/* Login Form */}
        <Card className="bg-nordic-white">
          <form onSubmit={handleSubmit} className="space-y-6">

            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              error={errors.email}
              required
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                error={errors.password}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[2.75rem] text-text-muted hover:text-text-secondary transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-accent-blue focus:ring-accent-blue border-border-medium rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-text-secondary">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="text-accent-blue hover:text-accent-primary transition-colors">
                  Forgot your password?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              loading={loginMutation.isPending}
              className="w-full"
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
            </Button>

          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-text-secondary">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-accent-blue hover:text-accent-primary font-medium transition-colors"
              >
                Create one here
              </Link>
            </p>
          </div>

          {/* Social Proof */}
          <div className="mt-8 pt-6 border-t border-border-light">
            <div className="text-center">
              <p className="text-sm text-text-muted mb-4">Trusted by Nordic professionals</p>
              <div className="flex justify-center items-center space-x-6 text-text-muted">
                <span className="text-xs">🇸🇪 Sweden</span>
                <span className="text-xs">🇳🇴 Norway</span>
                <span className="text-xs">🇩🇰 Denmark</span>
                <span className="text-xs">🇫🇮 Finland</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

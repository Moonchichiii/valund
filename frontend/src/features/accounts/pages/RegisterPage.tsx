// src/features/accounts/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useRegister } from '@/shared/hooks/useAuth';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card } from '@/shared/components/ui/Card';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  userType: 'professional' | 'client';
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    userType: 'professional',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const registerMutation = useRegister();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await registerMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
      });

      toast.success('Welcome to Valunds! Your account has been created.');
      navigate({ to: '/dashboard' });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create account. Please try again.');
    }
  };

  const passwordStrength = React.useMemo(() => {
    const { password } = formData;
    if (!password) return 0;

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;

    return strength;
  }, [formData.password]);

  const strengthColors = ['bg-error-500', 'bg-error-500', 'bg-warning-500', 'bg-accent-blue', 'bg-success-500'];
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

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
            Join the community
          </h2>
          <p className="mt-2 text-text-secondary">
            Create your Nordic professional account
          </p>
        </div>

        {/* User Type Selection */}
        <Card className="bg-nordic-white">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-text-primary">
              I am a...
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { handleInputChange('userType', 'professional'); }}
                className={`p-4 border-2 rounded-nordic-lg text-center transition-all ${
                  formData.userType === 'professional'
                    ? 'border-accent-blue bg-accent-blue/5 text-accent-blue'
                    : 'border-border-medium text-text-secondary hover:border-border-light'
                }`}
              >
                <div className="font-medium">Professional</div>
                <div className="text-xs mt-1">Looking for projects</div>
              </button>
              <button
                type="button"
                onClick={() => { handleInputChange('userType', 'client'); }}
                className={`p-4 border-2 rounded-nordic-lg text-center transition-all ${
                  formData.userType === 'client'
                    ? 'border-accent-blue bg-accent-blue/5 text-accent-blue'
                    : 'border-border-medium text-text-secondary hover:border-border-light'
                }`}
              >
                <div className="font-medium">Client</div>
                <div className="text-xs mt-1">Looking for talent</div>
              </button>
            </div>
          </div>
        </Card>

        {/* Registration Form */}
        <Card className="bg-nordic-white">
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                value={formData.firstName}
                onChange={(e) => { handleInputChange('firstName', e.target.value); }}
                placeholder="Erik"
                error={errors.firstName}
                required
                autoComplete="given-name"
              />
              <Input
                label="Last name"
                value={formData.lastName}
                onChange={(e) => { handleInputChange('lastName', e.target.value); }}
                placeholder="Andersson"
                error={errors.lastName}
                required
                autoComplete="family-name"
              />
            </div>

            <Input
              label="Email address"
              type="email"
              value={formData.email}
              onChange={(e) => { handleInputChange('email', e.target.value); }}
              placeholder="erik@company.com"
              error={errors.email}
              required
              autoComplete="email"
            />

            <div className="space-y-2">
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => { handleInputChange('password', e.target.value); }}
                  placeholder="Create a strong password"
                  error={errors.password}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => { setShowPassword(!showPassword); }}
                  className="absolute right-3 top-[2.75rem] text-text-muted hover:text-text-secondary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex space-x-1">
                    {[0, 1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-border-light'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-text-muted">
                    Password strength: {strengthLabels[passwordStrength - 1] || 'Enter a password'}
                  </p>
                </div>
              )}
            </div>

            <Input
              label="Confirm password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => { handleInputChange('confirmPassword', e.target.value); }}
              placeholder="Confirm your password"
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
            />

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="accept-terms"
                    name="accept-terms"
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => { handleInputChange('acceptTerms', e.target.checked); }}
                    className="h-4 w-4 text-accent-blue focus:ring-accent-blue border-border-medium rounded"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="accept-terms" className="text-sm text-text-secondary">
                    I accept the{' '}
                    <a href="#" className="text-accent-blue hover:text-accent-primary">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-accent-blue hover:text-accent-primary">
                      Privacy Policy
                    </a>
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-sm text-error-500 mt-1">{errors.acceptTerms}</p>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              loading={registerMutation.isPending}
              className="w-full"
            >
              {registerMutation.isPending ? 'Creating account...' : 'Create account'}
            </Button>

          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-text-secondary">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-accent-blue hover:text-accent-primary font-medium transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

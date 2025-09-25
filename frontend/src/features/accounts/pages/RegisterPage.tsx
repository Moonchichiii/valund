import React, { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useRegister, usePasswordStrength } from '@/features/accounts/hooks/useAuth';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card } from '@/shared/components/ui/Card';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  userType: 'freelancer' | 'client'; // Updated to match backend enum
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
}

export const RegisterPage = (): React.JSX.Element => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    userType: 'freelancer', // Updated to match backend
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const registerMutation = useRegister();

  // Use the password strength hook
  const passwordStrength = usePasswordStrength(formData.password);

  const validateForm = useCallback((): boolean => {
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
    } else if (formData.password.length < 12) { // Updated to match backend requirement
      newErrors.password = 'Password must be at least 12 characters';
    } else if (passwordStrength.score < 3) {
      newErrors.password = 'Password is too weak. Please choose a stronger password.';
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
  }, [formData, passwordStrength]);

  const handleInputChange = useCallback((field: keyof FormData, value: string | boolean): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleSubmit = useCallback((e: React.FormEvent): void => {
    e.preventDefault();

    if (!validateForm()) return;

    // Complete registration payload matching backend serializer requirements
    registerMutation.mutate(
      {
        email: formData.email,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        first_name: formData.firstName,
        last_name: formData.lastName,
        user_type: formData.userType,
        username: formData.email,
        terms_accepted: true,
        privacy_policy_accepted: true,
        marketing_consent: false,
        analytics_consent: false,
      },
      {
        onSuccess: () => {
          void navigate({ to: '/dashboard' });
        },
      }
    );
  }, [formData, registerMutation, navigate, validateForm]);

  const togglePasswordVisibility = useCallback((): void => {
    setShowPassword(!showPassword);
  }, [showPassword]);

  const handleFirstNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    handleInputChange('firstName', e.target.value);
  }, [handleInputChange]);

  const handleLastNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    handleInputChange('lastName', e.target.value);
  }, [handleInputChange]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    handleInputChange('email', e.target.value);
  }, [handleInputChange]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    handleInputChange('password', e.target.value);
  }, [handleInputChange]);

  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    handleInputChange('confirmPassword', e.target.value);
  }, [handleInputChange]);

  const handleTermsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    handleInputChange('acceptTerms', e.target.checked);
  }, [handleInputChange]);

  const selectFreelancer = useCallback((): void => {
    handleInputChange('userType', 'freelancer');
  }, [handleInputChange]);

  const selectClient = useCallback((): void => {
    handleInputChange('userType', 'client');
  }, [handleInputChange]);

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
          <fieldset className="space-y-4">
            <legend className="block text-sm font-medium text-text-primary">
              I am a...
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={selectFreelancer}
                className={`p-4 border-2 rounded-nordic-lg text-center transition-all ${
                  formData.userType === 'freelancer'
                    ? 'border-accent-blue bg-accent-blue/5 text-accent-blue'
                    : 'border-border-medium text-text-secondary hover:border-border-light'
                }`}
                aria-pressed={formData.userType === 'freelancer' ? 'true' : 'false'}
                aria-describedby="freelancer-description"
              >
                <div className="font-medium">Professional</div>
                <div className="text-xs mt-1" id="freelancer-description">
                  Looking for projects
                </div>
              </button>
              <button
                type="button"
                onClick={selectClient}
                className={`p-4 border-2 rounded-nordic-lg text-center transition-all ${
                  formData.userType === 'client'
                    ? 'border-accent-blue bg-accent-blue/5 text-accent-blue'
                    : 'border-border-medium text-text-secondary hover:border-border-light'
                }`}
                aria-pressed={formData.userType === 'client' ? 'true' : 'false'}
                aria-describedby="client-description"
              >
                <div className="font-medium">Client</div>
                <div className="text-xs mt-1" id="client-description">
                  Looking for talent
                </div>
              </button>
            </div>
          </fieldset>
        </Card>

        {/* Registration Form */}
        <Card className="bg-nordic-white">
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                value={formData.firstName}
                onChange={handleFirstNameChange}
                placeholder="Erik"
                error={errors.firstName}
                required
                autoComplete="given-name"
              />
              <Input
                label="Last name"
                value={formData.lastName}
                onChange={handleLastNameChange}
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
              onChange={handleEmailChange}
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
                  onChange={handlePasswordChange}
                  placeholder="Create a strong password (min 12 characters)"
                  error={errors.password}
                  required
                  autoComplete="new-password"
                  aria-describedby="password-strength"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-[2.75rem] text-text-muted hover:text-text-secondary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div
                  className="space-y-2"
                  id="password-strength"
                  role="group"
                  aria-labelledby="password-strength-label"
                >
                  <div className="flex space-x-1">
                    {[0, 1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level < passwordStrength.score ? strengthColors[passwordStrength.score - 1] : 'bg-border-light'
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-text-muted" id="password-strength-label">
                    Password strength: {strengthLabels[passwordStrength.score - 1] ?? 'Enter a password'}
                  </p>
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="text-xs text-text-muted space-y-1">
                      {passwordStrength.feedback.map((feedback) => (
                        <li key={feedback}>• {feedback}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <Input
              label="Confirm password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleConfirmPasswordChange}
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
                    onChange={handleTermsChange}
                    className="h-4 w-4 text-accent-blue focus:ring-accent-blue border-border-medium rounded"
                    aria-describedby="terms-description terms-error"
                    required
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="accept-terms" className="text-sm text-text-secondary" id="terms-description">
                    I accept the{' '}
                    <a
                      href="/terms"
                      className="text-accent-blue hover:text-accent-primary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a
                      href="/privacy"
                      className="text-accent-blue hover:text-accent-primary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Privacy Policy
                    </a>
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-sm text-error-500 mt-1" id="terms-error">{errors.acceptTerms}</p>
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

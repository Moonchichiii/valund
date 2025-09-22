import React, { useEffect, useState } from 'react';
import { BarChart3, Settings, Shield, X } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { cn } from '@/shared/utils/cn';

interface CookieConsentProps {
  onAcceptAll?: () => void;
  onAcceptNecessary?: () => void;
  onReject?: () => void;
  onCustomize?: (preferences: CookiePreferences) => void;
}

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

// Custom Cookie Icon Component with crumbs
const CookieIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("text-cookie-500", className)}
    role="img"
    aria-label="Cookie"
  >
    {/* Main cookie circle */}
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="currentColor"
      stroke="none"
    />
    {/* Cookie bite */}
    <path
      d="M18 8c0-2.2-1.8-4-4-4s-4 1.8-4 4"
      fill="#f7f6f4"
      stroke="none"
    />
    <circle cx="18" cy="8" r="4" fill="#f7f6f4" />

    {/* Chocolate chips/crumbs */}
    <circle cx="9" cy="10" r="1" fill="#8B4513" />
    <circle cx="15" cy="14" r="1.2" fill="#8B4513" />
    <circle cx="10" cy="15" r="0.8" fill="#8B4513" />
    <circle cx="14" cy="9" r="0.9" fill="#8B4513" />
    <circle cx="8" cy="14" r="0.7" fill="#8B4513" />
    <circle cx="16" cy="11" r="0.6" fill="#8B4513" />

    {/* Small crumbs */}
    <circle cx="11" cy="8" r="0.4" fill="#D2691E" />
    <circle cx="13" cy="16" r="0.5" fill="#D2691E" />
    <circle cx="7" cy="11" r="0.3" fill="#D2691E" />
  </svg>
);

export const CookieConsent: React.FC<CookieConsentProps> = ({
  onAcceptAll,
  onAcceptNecessary,
  onReject,
  onCustomize,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const hasConsent = localStorage.getItem('valunds-cookie-consent');
    if (!hasConsent) {
      // Delay to ensure page has loaded
      const timer = setTimeout(() => { setIsVisible(true); }, 1000);
      return () => { clearTimeout(timer); };
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    localStorage.setItem('valunds-cookie-consent', JSON.stringify(allAccepted));
    setIsVisible(false);
    onAcceptAll?.();
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    localStorage.setItem('valunds-cookie-consent', JSON.stringify(necessaryOnly));
    setIsVisible(false);
    onAcceptNecessary?.();
  };

  const handleReject = () => {
    const rejected = {
      necessary: true, // Legally required cookies
      analytics: false,
      marketing: false,
      functional: false,
    };
    localStorage.setItem('valunds-cookie-consent', JSON.stringify(rejected));
    setIsVisible(false);
    onReject?.();
  };

  const handleCustomize = () => {
    localStorage.setItem('valunds-cookie-consent', JSON.stringify(preferences));
    setIsVisible(false);
    onCustomize?.(preferences);
  };

  const handlePreferenceChange = (category: keyof CookiePreferences, value: boolean) => {
    if (category === 'necessary') return; // Cannot disable necessary cookies

    setPreferences(prev => ({
      ...prev,
      [category]: value,
    }));
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        aria-hidden="true"
      />

      {/* Cookie Consent Banner */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-slide-up"
        role="dialog"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
        aria-modal="true"
      >
        <Card className="max-w-4xl mx-auto shadow-nordic-xl border-cookie-200 bg-gradient-to-r from-nordic-white to-cookie-50">
          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* Icon and Text */}
            <div className="flex items-start gap-4 flex-1">
              <div className="flex-shrink-0 p-2 bg-cookie-100 rounded-nordic-lg animate-bounce-gentle">
                <CookieIcon className="w-8 h-8" />
              </div>

              <div className="flex-1 min-w-0">
                <h2
                  id="cookie-consent-title"
                  className="text-lg font-semibold text-text-primary mb-2"
                >
                  We value your privacy
                </h2>
                <p
                  id="cookie-consent-description"
                  className="text-text-secondary leading-relaxed mb-4 lg:mb-0"
                >
                  We use cookies to enhance your browsing experience, provide personalized content, and analyze our traffic.
                  By clicking "Accept All", you consent to our use of cookies.{' '}
                  <button
                    onClick={() => { setShowDetails(!showDetails); }}
                    className="text-accent-blue hover:text-accent-primary underline font-medium focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 rounded"
                    aria-expanded={showDetails}
                    aria-controls="cookie-details"
                  >
                    Learn more
                  </button>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReject}
                className="text-text-muted hover:text-text-primary border-border-medium"
              >
                Reject All
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAcceptNecessary}
                className="border-border-medium"
              >
                Necessary Only
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setShowDetails(!showDetails); }}
                className="border-border-medium"
                aria-expanded={showDetails}
                aria-controls="cookie-details"
              >
                <Settings className="w-4 h-4 mr-2" />
                Customize
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="bg-cookie-500 hover:bg-cookie-600 focus:ring-cookie-500/20"
              >
                Accept All
              </Button>
            </div>
          </div>

          {/* Detailed Settings */}
          {showDetails && (
            <div
              id="cookie-details"
              className="mt-6 pt-6 border-t border-border-light animate-fade-in"
            >
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Necessary Cookies */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-accent-green" />
                      <label
                        htmlFor="necessary-cookies"
                        className="text-sm font-medium text-text-primary"
                      >
                        Necessary
                      </label>
                    </div>
                    <input
                      id="necessary-cookies"
                      type="checkbox"
                      checked={true}
                      disabled={true}
                      className="rounded border-border-medium bg-nordic-warm cursor-not-allowed opacity-60"
                      aria-describedby="necessary-description"
                    />
                  </div>
                  <p id="necessary-description" className="text-xs text-text-muted leading-relaxed">
                    Essential for website functionality and security. Cannot be disabled.
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-accent-blue" />
                      <label
                        htmlFor="analytics-cookies"
                        className="text-sm font-medium text-text-primary"
                      >
                        Analytics
                      </label>
                    </div>
                    <input
                      id="analytics-cookies"
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => { handlePreferenceChange('analytics', e.target.checked); }}
                      className="rounded border-border-medium focus:ring-2 focus:ring-accent-blue focus:ring-offset-2"
                      aria-describedby="analytics-description"
                    />
                  </div>
                  <p id="analytics-description" className="text-xs text-text-muted leading-relaxed">
                    Help us understand how visitors interact with our website.
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CookieIcon className="w-4 h-4" />
                      <label
                        htmlFor="marketing-cookies"
                        className="text-sm font-medium text-text-primary"
                      >
                        Marketing
                      </label>
                    </div>
                    <input
                      id="marketing-cookies"
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => { handlePreferenceChange('marketing', e.target.checked); }}
                      className="rounded border-border-medium focus:ring-2 focus:ring-accent-blue focus:ring-offset-2"
                      aria-describedby="marketing-description"
                    />
                  </div>
                  <p id="marketing-description" className="text-xs text-text-muted leading-relaxed">
                    Used to deliver personalized advertisements and measure effectiveness.
                  </p>
                </div>

                {/* Functional Cookies */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-accent-warm" />
                      <label
                        htmlFor="functional-cookies"
                        className="text-sm font-medium text-text-primary"
                      >
                        Functional
                      </label>
                    </div>
                    <input
                      id="functional-cookies"
                      type="checkbox"
                      checked={preferences.functional}
                      onChange={(e) => { handlePreferenceChange('functional', e.target.checked); }}
                      className="rounded border-border-medium focus:ring-2 focus:ring-accent-blue focus:ring-offset-2"
                      aria-describedby="functional-description"
                    />
                  </div>
                  <p id="functional-description" className="text-xs text-text-muted leading-relaxed">
                    Enable enhanced functionality like live chat and personalized content.
                  </p>
                </div>
              </div>

              {/* Custom Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-border-light">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setShowDetails(false); }}
                  className="order-2 sm:order-1"
                >
                  Close Settings
                </Button>
                <div className="flex gap-3 order-1 sm:order-2 sm:ml-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCustomize}
                    className="flex-1 sm:flex-none"
                  >
                    Save Preferences
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAcceptAll}
                    className="flex-1 sm:flex-none bg-cookie-500 hover:bg-cookie-600 focus:ring-cookie-500/20"
                  >
                    Accept All
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

// Hook to manage cookie consent state
export const useCookieConsent = () => {
  const [consent, setConsent] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('valunds-cookie-consent');
    if (stored) {
      try {
        setConsent(JSON.parse(stored));
      } catch {
        // Invalid stored data, clear it
        localStorage.removeItem('valunds-cookie-consent');
      }
    }
  }, []);

  const clearConsent = () => {
    localStorage.removeItem('valunds-cookie-consent');
    setConsent(null);
  };

  return {
    consent,
    hasConsent: consent !== null,
    clearConsent,
  };
};

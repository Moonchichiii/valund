import { useCallback, useEffect, useState } from 'react';
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

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

// Professional Cookie Icon with scattered crumbs
const CookieIcon: React.FC<{ className?: string }> = ({ className }): React.JSX.Element => (
  <div className={cn("relative", className)}>
    {/* Scattered crumbs around the cookie */}
    <div className="absolute -top-1 -left-2 w-1 h-1 bg-amber-700 rounded-full animate-pulse" />
    <div className="absolute -top-2 right-6 w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse delay-100" />
    <div className="absolute top-8 -right-1 w-1 h-1 bg-amber-800 rounded-full animate-pulse delay-200" />
    <div className="absolute bottom-0 -left-1 w-0.5 h-0.5 bg-amber-700 rounded-full animate-pulse delay-300" />

    {/* Professional cookie SVG */}
    <svg
      width="32"
      height="32"
      viewBox="0 0 122.88 122.25"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-md"
      role="img"
      aria-label="Cookie"
    >
      <g>
        <path
          d="M101.77,49.38c2.09,3.1,4.37,5.11,6.86,5.78c2.45,0.66,5.32,0.06,8.7-2.01c1.36-0.84,3.14-0.41,3.97,0.95 c0.28,0.46,0.42,0.96,0.43,1.47c0.13,1.4,0.21,2.82,0.24,4.26c0.03,1.46,0.02,2.91-0.05,4.35h0v0c0,0.13-0.01,0.26-0.03,0.38 c-0.91,16.72-8.47,31.51-20,41.93c-11.55,10.44-27.06,16.49-43.82,15.69v0.01h0c-0.13,0-0.26-0.01-0.38-0.03 c-16.72-0.91-31.51-8.47-41.93-20C5.31,90.61-0.73,75.1,0.07,58.34H0.07v0c0-0.13,0.01-0.26,0.03-0.38 C1,41.22,8.81,26.35,20.57,15.87C32.34,5.37,48.09-0.73,64.85,0.07V0.07h0c1.6,0,2.89,1.29,2.89,2.89c0,0.4-0.08,0.78-0.23,1.12 c-1.17,3.81-1.25,7.34-0.27,10.14c0.89,2.54,2.7,4.51,5.41,5.52c1.44,0.54,2.2,2.1,1.74,3.55l0.01,0 c-1.83,5.89-1.87,11.08-0.52,15.26c0.82,2.53,2.14,4.69,3.88,6.4c1.74,1.72,3.9,3,6.39,3.78c4.04,1.26,8.94,1.18,14.31-0.55 C99.73,47.78,101.08,48.3,101.77,49.38L101.77,49.38z M59.28,57.86c2.77,0,5.01,2.24,5.01,5.01c0,2.77-2.24,5.01-5.01,5.01 c-2.77,0-5.01-2.24-5.01-5.01C54.27,60.1,56.52,57.86,59.28,57.86L59.28,57.86z M37.56,78.49c3.37,0,6.11,2.73,6.11,6.11 s-2.73,6.11-6.11,6.11s-6.11-2.73-6.11-6.11S34.18,78.49,37.56,78.49L37.56,78.49z M50.72,31.75c2.65,0,4.79,2.14,4.79,4.79 c0,2.65-2.14,4.79-4.79,4.79c-2.65,0-4.79-2.14-4.79-4.79C45.93,33.89,48.08,31.75,50.72,31.75L50.72,31.75z M119.3,32.4 c1.98,0,3.58,1.6,3.58,3.58c0,1.98-1.6,3.58-3.58,3.58s-3.58-1.6-3.58-3.58C115.71,34.01,117.32,32.4,119.3,32.4L119.3,32.4z M93.62,22.91c2.98,0,5.39,2.41,5.39,5.39c0,2.98-2.41,5.39-5.39,5.39c-2.98,0-5.39-2.41-5.39-5.39 C88.23,25.33,90.64,22.91,93.62,22.91L93.62,22.91z M97.79,0.59c3.19,0,5.78,2.59,5.78,5.78c0,3.19-2.59,5.78-5.78,5.78 c-3.19,0-5.78-2.59-5.78-5.78C92.02,3.17,94.6,0.59,97.79,0.59L97.79,0.59z M76.73,80.63c4.43,0,8.03,3.59,8.03,8.03 c0,4.43-3.59,8.03-8.03,8.03s-8.03-3.59-8.03-8.03C68.7,84.22,72.29,80.63,76.73,80.63L76.73,80.63z M31.91,46.78 c4.8,0,8.69,3.89,8.69,8.69c0,4.8-3.89,8.69-8.69,8.69s-8.69-3.89-8.69-8.69C23.22,50.68,27.11,46.78,31.91,46.78L31.91,46.78z M107.13,60.74c-3.39-0.91-6.35-3.14-8.95-6.48c-5.78,1.52-11.16,1.41-15.76-0.02c-3.37-1.05-6.32-2.81-8.71-5.18 c-2.39-2.37-4.21-5.32-5.32-8.75c-1.51-4.66-1.69-10.2-0.18-16.32c-3.1-1.8-5.25-4.53-6.42-7.88c-1.06-3.05-1.28-6.59-0.61-10.35 C47.27,5.95,34.3,11.36,24.41,20.18C13.74,29.69,6.66,43.15,5.84,58.29l0,0.05v0h0l-0.01,0.13v0C5.07,73.72,10.55,87.82,20.02,98.3 c9.44,10.44,22.84,17.29,38,18.1l0.05,0h0v0l0.13,0.01h0c15.24,0.77,29.35-4.71,39.83-14.19c10.44-9.44,17.29-22.84,18.1-38l0-0.05 v0h0l0.01-0.13v0c0.07-1.34,0.09-2.64,0.06-3.91C112.98,61.34,109.96,61.51,107.13,60.74L107.13,60.74z M116.15,64.04L116.15,64.04 L116.15,64.04L116.15,64.04z M58.21,116.42L58.21,116.42L58.21,116.42L58.21,116.42z"
          fill="rgb(97, 81, 81)"
        />
      </g>
    </svg>
  </div>
);

export const CookieConsent: React.FC<CookieConsentProps> = ({
  onAcceptAll,
  onAcceptNecessary,
  onReject,
  onCustomize,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    const hasConsent = localStorage.getItem('valunds-cookie-consent');
    if (!hasConsent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return (): void => {
        clearTimeout(timer);
      };
    }
  }, []);

  const handleAcceptAll = useCallback((): void => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    localStorage.setItem('valunds-cookie-consent', JSON.stringify(allAccepted));
    setIsVisible(false);
    onAcceptAll?.();
  }, [onAcceptAll]);

  const handleAcceptNecessary = useCallback((): void => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    localStorage.setItem('valunds-cookie-consent', JSON.stringify(necessaryOnly));
    setIsVisible(false);
    onAcceptNecessary?.();
  }, [onAcceptNecessary]);

  const handleReject = useCallback((): void => {
    const rejected = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    localStorage.setItem('valunds-cookie-consent', JSON.stringify(rejected));
    setIsVisible(false);
    onReject?.();
  }, [onReject]);

  const handleCustomize = useCallback((): void => {
    localStorage.setItem('valunds-cookie-consent', JSON.stringify(preferences));
    setIsVisible(false);
    onCustomize?.(preferences);
  }, [preferences, onCustomize]);

  const handlePreferenceChange = useCallback((category: keyof CookiePreferences, value: boolean): void => {
    if (category === 'necessary') return;

    setPreferences(prev => ({
      ...prev,
      [category]: value,
    }));
  }, []);

  const handleAnalyticsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    handlePreferenceChange('analytics', e.target.checked);
  }, [handlePreferenceChange]);

  const handleMarketingChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    handlePreferenceChange('marketing', e.target.checked);
  }, [handlePreferenceChange]);

  const handleFunctionalChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    handlePreferenceChange('functional', e.target.checked);
  }, [handlePreferenceChange]);

  const toggleDetails = useCallback((): void => {
    setShowDetails(prev => !prev);
  }, []);

  const handleClose = useCallback((): void => {
    setIsVisible(false);
  }, []);

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
        className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 lg:p-6 animate-slide-up"
        role="dialog"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
        aria-modal="true"
      >
        <Card className="relative max-w-6xl mx-auto shadow-nordic-xl border-border-light bg-gradient-to-r from-nordic-white to-nordic-warm">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 p-2 text-text-muted hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 rounded-lg transition-colors"
            aria-label="Close cookie consent banner"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start pr-10">
            {/* Icon and Text */}
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="flex-shrink-0 p-2 rounded-nordic-lg animate-bounce-gentle">
                <CookieIcon className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>

              <div className="flex-1 min-w-0">
                <h2
                  id="cookie-consent-title"
                  className="text-lg sm:text-xl font-semibold text-text-primary mb-2"
                >
                  We value your privacy
                </h2>
                <p
                  id="cookie-consent-description"
                  className="text-sm sm:text-base text-text-secondary leading-relaxed mb-4 lg:mb-0 pr-2"
                >
                  We use cookies to enhance your browsing experience, provide personalized content, and analyze our traffic.
                  By clicking "Accept All", you consent to our use of cookies.{' '}
                  <button
                    onClick={toggleDetails}
                    className="text-accent-blue hover:text-accent-primary underline font-medium focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 rounded transition-colors"
                    aria-expanded={showDetails ? 'true' : 'false'}
                    aria-controls="cookie-details"
                  >
                    Learn more
                  </button>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full lg:w-auto lg:min-w-0 lg:flex-shrink-0">
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReject}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-2 text-text-muted hover:text-text-primary border-border-medium"
                >
                  Reject All
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAcceptNecessary}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-2 border-border-medium"
                >
                  Necessary Only
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={toggleDetails}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-2 border-border-medium"
                  aria-expanded={showDetails ? 'true' : 'false'}
                  aria-controls="cookie-details"
                >
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Customize
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                  className="text-xs sm:text-sm px-3 sm:px-4 py-2"
                >
                  Accept All
                </Button>
              </div>
            </div>
          </div>

          {/* Detailed Settings */}
          {showDetails && (
            <div
              id="cookie-details"
              className="mt-6 pt-6 border-t border-border-light animate-fade-in"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

                {/* Necessary Cookies */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-accent-green flex-shrink-0" />
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
                      <BarChart3 className="w-4 h-4 text-accent-blue flex-shrink-0" />
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
                      onChange={handleAnalyticsChange}
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
                      <div className="w-4 h-4 flex-shrink-0">
                        <svg
                          viewBox="0 0 122.88 122.25"
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-full h-full"
                        >
                          <g>
                            <path
                              d="M101.77,49.38c2.09,3.1,4.37,5.11,6.86,5.78c2.45,0.66,5.32,0.06,8.7-2.01c1.36-0.84,3.14-0.41,3.97,0.95 c0.28,0.46,0.42,0.96,0.43,1.47c0.13,1.4,0.21,2.82,0.24,4.26c0.03,1.46,0.02,2.91-0.05,4.35h0v0c0,0.13-0.01,0.26-0.03,0.38 c-0.91,16.72-8.47,31.51-20,41.93c-11.55,10.44-27.06,16.49-43.82,15.69v0.01h0c-0.13,0-0.26-0.01-0.38-0.03 c-16.72-0.91-31.51-8.47-41.93-20C5.31,90.61-0.73,75.1,0.07,58.34H0.07v0c0-0.13,0.01-0.26,0.03-0.38 C1,41.22,8.81,26.35,20.57,15.87C32.34,5.37,48.09-0.73,64.85,0.07V0.07h0c1.6,0,2.89,1.29,2.89,2.89c0,0.4-0.08,0.78-0.23,1.12 c-1.17,3.81-1.25,7.34-0.27,10.14c0.89,2.54,2.7,4.51,5.41,5.52c1.44,0.54,2.2,2.1,1.74,3.55l0.01,0 c-1.83,5.89-1.87,11.08-0.52,15.26c0.82,2.53,2.14,4.69,3.88,6.4c1.74,1.72,3.9,3,6.39,3.78c4.04,1.26,8.94,1.18,14.31-0.55 C99.73,47.78,101.08,48.3,101.77,49.38L101.77,49.38z M59.28,57.86c2.77,0,5.01,2.24,5.01,5.01c0,2.77-2.24,5.01-5.01,5.01 c-2.77,0-5.01-2.24-5.01-5.01C54.27,60.1,56.52,57.86,59.28,57.86L59.28,57.86z M37.56,78.49c3.37,0,6.11,2.73,6.11,6.11 s-2.73,6.11-6.11,6.11s-6.11-2.73-6.11-6.11S34.18,78.49,37.56,78.49L37.56,78.49z M50.72,31.75c2.65,0,4.79,2.14,4.79,4.79 c0,2.65-2.14,4.79-4.79,4.79c-2.65,0-4.79-2.14-4.79-4.79C45.93,33.89,48.08,31.75,50.72,31.75L50.72,31.75z M119.3,32.4 c1.98,0,3.58,1.6,3.58,3.58c0,1.98-1.6,3.58-3.58,3.58s-3.58-1.6-3.58-3.58C115.71,34.01,117.32,32.4,119.3,32.4L119.3,32.4z M93.62,22.91c2.98,0,5.39,2.41,5.39,5.39c0,2.98-2.41,5.39-5.39,5.39c-2.98,0-5.39-2.41-5.39-5.39 C88.23,25.33,90.64,22.91,93.62,22.91L93.62,22.91z M97.79,0.59c3.19,0,5.78,2.59,5.78,5.78c0,3.19-2.59,5.78-5.78,5.78 c-3.19,0-5.78-2.59-5.78-5.78C92.02,3.17,94.6,0.59,97.79,0.59L97.79,0.59z M76.73,80.63c4.43,0,8.03,3.59,8.03,8.03 c0,4.43-3.59,8.03-8.03,8.03s-8.03-3.59-8.03-8.03C68.7,84.22,72.29,80.63,76.73,80.63L76.73,80.63z M31.91,46.78 c4.8,0,8.69,3.89,8.69,8.69c0,4.8-3.89,8.69-8.69,8.69s-8.69-3.89-8.69-8.69C23.22,50.68,27.11,46.78,31.91,46.78L31.91,46.78z M107.13,60.74c-3.39-0.91-6.35-3.14-8.95-6.48c-5.78,1.52-11.16,1.41-15.76-0.02c-3.37-1.05-6.32-2.81-8.71-5.18 c-2.39-2.37-4.21-5.32-5.32-8.75c-1.51-4.66-1.69-10.2-0.18-16.32c-3.1-1.8-5.25-4.53-6.42-7.88c-1.06-3.05-1.28-6.59-0.61-10.35 C47.27,5.95,34.3,11.36,24.41,20.18C13.74,29.69,6.66,43.15,5.84,58.29l0,0.05v0h0l-0.01,0.13v0C5.07,73.72,10.55,87.82,20.02,98.3 c9.44,10.44,22.84,17.29,38,18.1l0.05,0h0v0l0.13,0.01h0c15.24,0.77,29.35-4.71,39.83-14.19c10.44-9.44,17.29-22.84,18.1-38l0-0.05 v0h0l0.01-0.13v0c0.07-1.34,0.09-2.64,0.06-3.91C112.98,61.34,109.96,61.51,107.13,60.74L107.13,60.74z M116.15,64.04L116.15,64.04 L116.15,64.04L116.15,64.04z M58.21,116.42L58.21,116.42L58.21,116.42L58.21,116.42z"
                              fill="rgb(97, 81, 81)"
                            />
                          </g>
                        </svg>
                      </div>
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
                      onChange={handleMarketingChange}
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
                      <Settings className="w-4 h-4 text-accent-warm flex-shrink-0" />
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
                      onChange={handleFunctionalChange}
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
                  onClick={toggleDetails}
                  className="order-2 sm:order-1"
                >
                  Close Settings
                </Button>
                <div className="flex flex-wrap gap-2 sm:gap-3 order-1 sm:order-2 sm:ml-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCustomize}
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    Save Preferences
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAcceptAll}
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
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

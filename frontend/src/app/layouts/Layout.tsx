import React from 'react';
import { Header } from './Header';
import { CookieConsent } from '@/shared/components/ui/CookieConsent';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => (
    <>
      <Header />
      <CookieConsent />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );

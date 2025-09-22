import type React from 'react';
import { lazy, Suspense } from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider
} from '@tanstack/react-router';
import { Layout } from '@/app/layouts/Layout';
import { DashboardLayout } from '@/app/layouts/DashboardLayout';
import { Home } from '@/app/pages/Home';

// Lazy load non-critical pages
const About = lazy(() => import('@/app/pages/About').then(module => ({ default: module.About })));
const FindTalent = lazy(() => import('@/app/pages/FindTalent').then(module => ({ default: module.FindTalent })));
const Professionals = lazy(() => import('@/app/pages/Professionals').then(module => ({ default: module.Professionals })));
const Contact = lazy(() => import('@/app/pages/Contact').then(module => ({ default: module.Contact })));
const Dashboard = lazy(() => import('@/app/outlet/Dashboard/Dashboard').then(module => ({ default: module.Dashboard })));

// Loading fallback component
const LoadingSpinner = (): React.ReactElement => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue" />
    <span className="ml-2 text-text-secondary">Loading...</span>
  </div>
);

// Suspense wrapper for lazy routes
const SuspenseWrapper = ({ children }: { children: React.ReactNode }): React.ReactElement => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
);

// Root route - only create this once
const rootRoute = createRootRoute({
  component: () => <Outlet />
});

// Main layout route (marketing pages)
const mainLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'main-layout',
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  )
});

// Marketing pages
const indexRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: '/',
  component: Home
});

const aboutRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: '/about',
  component: () => (
    <SuspenseWrapper>
      <About />
    </SuspenseWrapper>
  )
});

const findTalentRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: '/find-talent',
  component: () => (
    <SuspenseWrapper>
      <FindTalent />
    </SuspenseWrapper>
  )
});

const professionalsRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: '/professionals',
  component: () => (
    <SuspenseWrapper>
      <Professionals />
    </SuspenseWrapper>
  )
});

const contactRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: '/contact',
  component: () => (
    <SuspenseWrapper>
      <Contact />
    </SuspenseWrapper>
  )
});

// Dashboard layout route
const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: () => (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
});

// Dashboard index page
const dashboardIndexRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/',
  component: () => (
    <SuspenseWrapper>
      <Dashboard />
    </SuspenseWrapper>
  )
});

// Build route tree
const routeTree = rootRoute.addChildren([
  mainLayoutRoute.addChildren([
    indexRoute,
    aboutRoute,
    findTalentRoute,
    professionalsRoute,
    contactRoute
  ]),
  dashboardLayoutRoute.addChildren([
    dashboardIndexRoute
  ])
]);

// Create router instance
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0
});

// Type registration for TypeScript
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App(): React.ReactElement {
  return <RouterProvider router={router} />;
}

export default App;

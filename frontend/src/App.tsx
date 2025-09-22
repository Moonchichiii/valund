import { lazy, Suspense } from 'react';
import { createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router';
import { Layout } from '@/app/layout/Layout';
import { DashboardLayout } from '@/app/layout/DashboardLayout';
import { Home } from '@/app/pages/Home';

// Lazy load non-critical pages
const About = lazy(() => import('@/app/pages/About'));
const FindTalent = lazy(() => import('@/app/pages/FindTalent'));
const Professionals = lazy(() => import('@/app/pages/Professionals'));
const Contact = lazy(() => import('@/app/pages/Contact'));
const Dashboard = lazy(() => import('@/app/pages/Dashboard'));

// Loading fallback component
const LoadingSpinner = (): JSX.Element => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue" />
    <span className="ml-2 text-text-secondary">Loading...</span>
  </div>
);

// Suspense wrapper for lazy routes
const SuspenseWrapper = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
);

// Root route
const rootRoute = createRootRoute({
  component: () => <Outlet />
});

// Layout wrapper route
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  )
});

// Marketing pages - Home loads immediately, others are lazy
const homeRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: Home
});

const aboutRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/about',
  component: () => (
    <SuspenseWrapper>
      <About />
    </SuspenseWrapper>
  )
});

const findTalentRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/find-talent',
  component: () => (
    <SuspenseWrapper>
      <FindTalent />
    </SuspenseWrapper>
  )
});

const professionalsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/professionals',
  component: () => (
    <SuspenseWrapper>
      <Professionals />
    </SuspenseWrapper>
  )
});

const contactRoute = createRoute({
  getParentRoute: () => layoutRoute,
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

// Dashboard page - lazy loaded since it's behind authentication
const dashboardRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/',
  component: () => (
    <SuspenseWrapper>
      <Dashboard />
    </SuspenseWrapper>
  )
});

// Route tree
const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([
    homeRoute,
    aboutRoute,
    findTalentRoute,
    professionalsRoute,
    contactRoute
  ]),
  dashboardLayoutRoute.addChildren([
    dashboardRoute
  ])
]);

// Create router
const router = createRouter({
  routeTree,
  defaultPreload: 'intent', // Preload on hover/focus
  defaultPreloadStaleTime: 0
});

// Type registration
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App(): JSX.Element {
  return <RouterProvider router={router} />;
}

export default App;

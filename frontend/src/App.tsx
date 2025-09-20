import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408, 429
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return error?.response?.status === 408 || error?.response?.status === 429
            ? failureCount < 2
            : false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-nordic-cream font-inter antialiased">
        <Suspense fallback={<div className="p-8">Loading...</div>}>
          <div className="p-8">
            <h1 className="text-2xl font-bold text-text-primary">
              Valund Auth System
            </h1>
            <p className="text-text-secondary mt-2">
              TanStack Router + Auth System Ready
            </p>
          </div>
        </Suspense>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: 'nordic-toast',
            style: {
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              fontSize: '0.9rem',
            },
          }}
        />
      </div>

      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}

export default App;

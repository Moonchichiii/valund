import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import App from './App';

interface ApiError {
  response?: {
    status: number;
    data?: {
      detail?: string;
      message?: string;
    };
  };
  message?: string;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount: number, error: unknown): boolean => {
        const apiError = error as ApiError;

        // Don't retry 4xx client errors except for timeout/rate limiting
        if (apiError.response?.status &&
            apiError.response.status >= 400 &&
            apiError.response.status < 500) {
          return apiError.response.status === 408 || apiError.response.status === 429
            ? failureCount < 2
            : false;
        }

        // Retry network/server errors up to 3 times
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1
    },
  },
});

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'nordic-toast',
          style: {
            background: '#f7f6f4',
            color: '#1a1a1a',
            border: '1px solid #e8e6e3',
          }
        }}
      />
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  </StrictMode>
);

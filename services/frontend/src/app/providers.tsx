// ============================================================================
// App Providers - Context and State Providers
// NOVA Agent - Frontend Development Specialist
// ============================================================================

'use client';

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { isDevelopment } from '@/config';

// Create query client with optimized configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 429 (rate limit)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: 1,
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthInitializer>
      {isDevelopment && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

// Auth initialization component
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore(state => state.initialize);

  // Setup automatic token refresh
  useTokenRefresh();

  useEffect(() => {
    // Initialize auth state on app load
    initialize().catch(console.error);
  }, [initialize]);

  return <>{children}</>;
}

// Toast notification provider
function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName="toast-container"
        containerStyle={{
          top: 80,
          right: 20,
        }}
        toastOptions={{
          className: 'toast',
          duration: 5000,
          style: {
            background: '#fff',
            color: '#1f2937',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            maxWidth: '420px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              borderLeftColor: '#10b981',
              borderLeftWidth: '4px',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              borderLeftColor: '#ef4444',
              borderLeftWidth: '4px',
            },
            duration: 8000,
          },
          loading: {
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#fff',
            },
            style: {
              borderLeftColor: '#3b82f6',
              borderLeftWidth: '4px',
            },
          },
        }}
      />
    </>
  );
}
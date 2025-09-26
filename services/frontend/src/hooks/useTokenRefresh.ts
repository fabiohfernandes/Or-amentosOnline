// ============================================================================
// Token Refresh Hook - Automatic Token Management
// Handles proactive token refresh to prevent expiration issues
// ============================================================================

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth';

export function useTokenRefresh() {
  const { isAuthenticated, tokens, checkAndRefreshToken, logout } = useAuthStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only set up refresh checks if user is authenticated
    if (!isAuthenticated || !tokens?.accessToken) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Check token every minute
    const checkToken = async () => {
      try {
        // First check if token is already expired
        if (tokens?.expiresAt) {
          const expiresAt = new Date(tokens.expiresAt);
          const now = new Date();

          // If token is already expired, force logout immediately
          if (now > expiresAt) {
            console.warn('Token has expired, forcing logout');
            logout(true); // Force redirect to login
            return;
          }
        }

        await checkAndRefreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        // If refresh fails, logout user and redirect to login
        logout(true);
      }
    };

    // Initial check
    checkToken();

    // Set up periodic checks every minute
    intervalRef.current = setInterval(checkToken, 60 * 1000); // 1 minute

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, tokens?.accessToken, checkAndRefreshToken, logout]);

  // Return current token status
  return {
    isAuthenticated,
    tokens,
    hasValidToken: tokens?.accessToken && tokens?.expiresAt && new Date(tokens.expiresAt) > new Date()
  };
}
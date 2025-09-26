// ============================================================================
// Auth Store - Authentication State Management
// NOVA Agent - Frontend Development Specialist
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthStore, RegisterData } from './types';
import type { User, AuthTokens } from '@/types';
import { apiClient } from '@/lib/api';
import { apiEndpoints, constants } from '@/config';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial State
      isAuthenticated: false,
      user: null,
      tokens: null,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await apiClient.post(apiEndpoints.auth.login, {
            email,
            password,
          });

          if (response.data.success) {
            const { user, tokens } = response.data.data;

            set({
              isAuthenticated: true,
              user,
              tokens: {
                ...tokens,
                expiresAt: new Date(tokens.expiresAt),
              },
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.data.message || 'Login failed');
          }
        } catch (error: any) {
          set({
            isAuthenticated: false,
            user: null,
            tokens: null,
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Login failed',
          });
          throw error;
        }
      },

      logout: (redirectToLogin = false) => {
        // Call logout API endpoint (fire and forget)
        apiClient.post(apiEndpoints.auth.logout).catch(() => {
          // Ignore errors - we're logging out anyway
        });

        set({
          isAuthenticated: false,
          user: null,
          tokens: null,
          isLoading: false,
          error: null,
        });

        // Redirect to login if requested (usually for forced logouts due to token expiration)
        if (redirectToLogin && typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth/login';
        }
      },

      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true, error: null });

          const response = await apiClient.post(apiEndpoints.auth.register, data);

          if (response.data.success) {
            const { user, tokens } = response.data.data;

            set({
              isAuthenticated: true,
              user,
              tokens: {
                ...tokens,
                expiresAt: new Date(tokens.expiresAt),
              },
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.data.message || 'Registration failed');
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Registration failed',
          });
          throw error;
        }
      },

      refreshToken: async () => {
        const { tokens } = get();

        if (!tokens?.refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          set({ isLoading: true, error: null });

          const response = await apiClient.post(apiEndpoints.auth.refresh, {
            refreshToken: tokens.refreshToken,
          });

          if (response.data.success) {
            const { user, tokens: newTokens } = response.data.data;

            set({
              isAuthenticated: true,
              user,
              tokens: {
                ...newTokens,
                expiresAt: new Date(newTokens.expiresAt),
              },
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.data.message || 'Token refresh failed');
          }
        } catch (error: any) {
          // If refresh fails, logout the user
          get().logout();
          throw error;
        }
      },

      updateProfile: async (data: Partial<User>) => {
        const { user } = get();

        if (!user) {
          throw new Error('No user logged in');
        }

        try {
          set({ isLoading: true, error: null });

          const response = await apiClient.put(apiEndpoints.auth.profile, data);

          if (response.data.success) {
            set({
              user: { ...user, ...response.data.data },
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.data.message || 'Profile update failed');
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Profile update failed',
          });
          throw error;
        }
      },

      forgotPassword: async (email: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await apiClient.post(apiEndpoints.auth.forgotPassword, {
            email,
          });

          if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to send reset email');
          }

          set({ isLoading: false, error: null });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Failed to send reset email',
          });
          throw error;
        }
      },

      resetPassword: async (token: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await apiClient.post(apiEndpoints.auth.resetPassword, {
            token,
            password,
          });

          if (!response.data.success) {
            throw new Error(response.data.message || 'Password reset failed');
          }

          set({ isLoading: false, error: null });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Password reset failed',
          });
          throw error;
        }
      },

      verifyEmail: async (token: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await apiClient.post(apiEndpoints.auth.verifyEmail, {
            token,
          });

          if (response.data.success) {
            const { user } = get();
            if (user) {
              set({
                user: { ...user, emailVerified: true },
                isLoading: false,
                error: null,
              });
            }
          } else {
            throw new Error(response.data.message || 'Email verification failed');
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Email verification failed',
          });
          throw error;
        }
      },

      setUser: (user: User | null) => {
        set({ user });
      },

      setTokens: (tokens: AuthTokens | null) => {
        set({ tokens });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      // Force sync with localStorage (useful when tokens are updated externally)
      syncWithStorage: () => {
        const authData = localStorage.getItem(constants.STORAGE_KEYS.AUTH_TOKENS);
        if (authData) {
          try {
            const { state } = JSON.parse(authData);
            if (state?.tokens && state?.user) {
              set({
                isAuthenticated: state.isAuthenticated || false,
                user: state.user,
                tokens: state.tokens ? {
                  ...state.tokens,
                  expiresAt: new Date(state.tokens.expiresAt),
                } : null,
              });
            }
          } catch (error) {
            console.warn('Failed to sync auth state from localStorage:', error);
          }
        }
      },

      // Check if token needs refresh and do it proactively
      checkAndRefreshToken: async () => {
        const { tokens } = get();

        if (!tokens?.accessToken || !tokens?.refreshToken) {
          return false;
        }

        // Check if token expires in next 2 minutes
        const expiresAt = tokens.expiresAt ? new Date(tokens.expiresAt) : null;
        const now = new Date();
        const timeUntilExpiry = expiresAt ? expiresAt.getTime() - now.getTime() : 0;
        const shouldRefresh = timeUntilExpiry < 2 * 60 * 1000; // 2 minutes

        if (shouldRefresh) {
          try {
            await get().refreshToken();
            return true;
          } catch (error) {
            console.warn('Proactive token refresh failed:', error);
            return false;
          }
        }

        return false;
      },

      initialize: async () => {
        const { tokens } = get();

        if (!tokens) {
          return;
        }

        // Check if token is expired
        if (tokens.expiresAt && new Date() > tokens.expiresAt) {
          try {
            await get().refreshToken();
          } catch {
            get().logout();
          }
        } else {
          // Token is still valid, just verify with server
          try {
            set({ isLoading: true });
            const response = await apiClient.get(apiEndpoints.auth.profile);

            if (response.data.success) {
              set({
                isAuthenticated: true,
                user: response.data.data,
                isLoading: false,
              });
            } else {
              get().logout();
            }
          } catch {
            get().logout();
          }
        }
      },
    }),
    {
      name: constants.STORAGE_KEYS.AUTH_TOKENS,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        tokens: state.tokens,
      }),
    }
  )
);
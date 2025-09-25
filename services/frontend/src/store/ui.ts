// ============================================================================
// UI Store - User Interface State Management
// NOVA Agent - Frontend Development Specialist
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UIStore } from './types';
import type { Toast } from '@/types';
import { constants } from '@/config';

let toastId = 0;

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Initial State
      sidebarOpen: true,
      theme: 'system',
      toasts: [],
      modals: {},

      // Sidebar Actions
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },

      // Theme Actions
      setTheme: (theme: 'light' | 'dark' | 'system') => {
        set({ theme });

        // Apply theme to document
        const root = document.documentElement;
        const isDark = theme === 'dark' ||
          (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (isDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      },

      // Toast Actions
      addToast: (toast: Omit<Toast, 'id'>) => {
        const id = `toast-${++toastId}`;
        const newToast: Toast = {
          id,
          duration: constants.TOAST_DURATION,
          ...toast,
        };

        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));

        // Auto-remove toast after duration
        if (newToast.duration && newToast.duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, newToast.duration);
        }

        return id;
      },

      removeToast: (id: string) => {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
      },

      clearToasts: () => {
        set({ toasts: [] });
      },

      // Modal Actions
      openModal: (modalId: string) => {
        set((state) => ({
          modals: { ...state.modals, [modalId]: true },
        }));
      },

      closeModal: (modalId: string) => {
        set((state) => ({
          modals: { ...state.modals, [modalId]: false },
        }));
      },

      toggleModal: (modalId: string) => {
        set((state) => ({
          modals: { ...state.modals, [modalId]: !state.modals[modalId] },
        }));
      },

      isModalOpen: (modalId: string) => {
        return get().modals[modalId] || false;
      },
    }),
    {
      name: constants.STORAGE_KEYS.USER_PREFERENCES,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
      }),
    }
  )
);

// Theme system integration
if (typeof window !== 'undefined') {
  // Initialize theme on load
  const store = useUIStore.getState();
  store.setTheme(store.theme);

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const currentTheme = useUIStore.getState().theme;
    if (currentTheme === 'system') {
      useUIStore.getState().setTheme('system');
    }
  });
}
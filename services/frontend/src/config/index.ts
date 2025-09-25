// ============================================================================
// Application Configuration
// NOVA Agent - Frontend Development Specialist
// ============================================================================

import type { AppConfig } from '@/types';

/**
 * Application configuration object
 * Centralizes all environment variables and app settings
 */
export const appConfig: AppConfig = {
  // API Configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000',

  // App Information
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'OrçamentosOnline',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

  // File Upload Settings
  maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760'), // 10MB default
  supportedFileTypes: (
    process.env.NEXT_PUBLIC_SUPPORTED_FILE_TYPES ||
    'image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ).split(','),

  // Feature Flags
  features: {
    realTimeCollaboration: true,
    fileUploads: true,
    emailNotifications: true,
  },
};

/**
 * API endpoints configuration
 */
export const apiEndpoints = {
  // Authentication
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
  },

  // Users
  users: {
    list: '/users',
    create: '/users',
    get: (id: string) => `/users/${id}`,
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
    avatar: (id: string) => `/users/${id}/avatar`,
  },

  // Proposals
  proposals: {
    list: '/proposals',
    create: '/proposals',
    get: (id: string) => `/proposals/${id}`,
    update: (id: string) => `/proposals/${id}`,
    delete: (id: string) => `/proposals/${id}`,
    submit: (id: string) => `/proposals/${id}/submit`,
    approve: (id: string) => `/proposals/${id}/approve`,
    reject: (id: string) => `/proposals/${id}/reject`,
    duplicate: (id: string) => `/proposals/${id}/duplicate`,
    export: (id: string) => `/proposals/${id}/export`,

    // Proposal Items
    items: {
      list: (proposalId: string) => `/proposals/${proposalId}/items`,
      create: (proposalId: string) => `/proposals/${proposalId}/items`,
      update: (proposalId: string, itemId: string) => `/proposals/${proposalId}/items/${itemId}`,
      delete: (proposalId: string, itemId: string) => `/proposals/${proposalId}/items/${itemId}`,
      reorder: (proposalId: string) => `/proposals/${proposalId}/items/reorder`,
    },

    // Comments
    comments: {
      list: (proposalId: string) => `/proposals/${proposalId}/comments`,
      create: (proposalId: string) => `/proposals/${proposalId}/comments`,
      update: (proposalId: string, commentId: string) => `/proposals/${proposalId}/comments/${commentId}`,
      delete: (proposalId: string, commentId: string) => `/proposals/${proposalId}/comments/${commentId}`,
    },

    // Attachments
    attachments: {
      list: (proposalId: string) => `/proposals/${proposalId}/attachments`,
      upload: (proposalId: string) => `/proposals/${proposalId}/attachments`,
      delete: (proposalId: string, attachmentId: string) => `/proposals/${proposalId}/attachments/${attachmentId}`,
    },

    // Collaborators
    collaborators: {
      list: (proposalId: string) => `/proposals/${proposalId}/collaborators`,
      add: (proposalId: string) => `/proposals/${proposalId}/collaborators`,
      update: (proposalId: string, collaboratorId: string) => `/proposals/${proposalId}/collaborators/${collaboratorId}`,
      remove: (proposalId: string, collaboratorId: string) => `/proposals/${proposalId}/collaborators/${collaboratorId}`,
    },
  },

  // File uploads
  uploads: {
    avatar: '/uploads/avatar',
    proposal: '/uploads/proposal',
  },

  // Health check
  health: '/health',
};

/**
 * Application constants
 */
export const constants = {
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // File Upload
  MAX_FILE_SIZE_MB: appConfig.maxFileSize / (1024 * 1024),
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  SUPPORTED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],

  // Validation
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 254,
  MAX_DESCRIPTION_LENGTH: 2000,

  // UI
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,

  // WebSocket
  WS_RECONNECT_INTERVAL: 5000,
  WS_MAX_RECONNECT_ATTEMPTS: 5,
  WS_HEARTBEAT_INTERVAL: 30000,

  // Local Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKENS: 'orcamentos_auth_tokens',
    USER_PREFERENCES: 'orcamentos_user_preferences',
    THEME: 'orcamentos_theme',
  },

  // Date Formats
  DATE_FORMATS: {
    SHORT: 'dd/MM/yyyy',
    LONG: 'dd/MM/yyyy HH:mm',
    TIME: 'HH:mm',
    ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  },

  // Currency
  DEFAULT_CURRENCY: 'BRL',
  CURRENCY_SYMBOL: 'R$',

  // Status Colors
  STATUS_COLORS: {
    draft: 'secondary',
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
    expired: 'secondary',
  } as const,

  // User Roles
  USER_ROLES: {
    ADMIN: 'admin',
    MANAGER: 'manager',
    USER: 'user',
    CLIENT: 'client',
  } as const,
};

/**
 * Responsive breakpoints (matching Tailwind CSS)
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Development environment check
 */
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

/**
 * Feature flag checker
 */
export const isFeatureEnabled = (feature: keyof typeof appConfig.features): boolean => {
  return appConfig.features[feature];
};

/**
 * Get API URL with endpoint
 */
export const getApiUrl = (endpoint: string): string => {
  return `${appConfig.apiUrl}${endpoint}`;
};

/**
 * Get WebSocket URL
 */
export const getWsUrl = (): string => {
  return appConfig.wsUrl;
};
// ============================================================================
// Store Types for Zustand State Management
// NOVA Agent - Frontend Development Specialist
// ============================================================================

import type {
  AuthState,
  AuthTokens,
  User,
  Proposal,
  ProposalFilters,
  PaginationMeta,
  Toast,
  WebSocketMessage,
  TypingIndicator,
} from '@/types';

// ============================================================================
// Auth Store Types
// ============================================================================

export interface AuthStore extends AuthState {
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: (redirectToLogin?: boolean) => void;
  register: (data: RegisterData) => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  syncWithStorage: () => void;
  checkAndRefreshToken: () => Promise<boolean>;
  initialize: () => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  company?: string;
  phone?: string;
}

// ============================================================================
// Proposal Store Types
// ============================================================================

export interface ProposalStore {
  // State
  proposals: Proposal[];
  currentProposal: Proposal | null;
  isLoading: boolean;
  error: string | null;
  filters: ProposalFilters;
  pagination: PaginationMeta | null;

  // Actions
  fetchProposals: (params?: ProposalFetchParams) => Promise<void>;
  fetchProposal: (id: string) => Promise<void>;
  createProposal: (data: CreateProposalData) => Promise<Proposal>;
  updateProposal: (id: string, data: Partial<Proposal>) => Promise<void>;
  deleteProposal: (id: string) => Promise<void>;
  submitProposal: (id: string) => Promise<void>;
  approveProposal: (id: string) => Promise<void>;
  rejectProposal: (id: string, reason?: string) => Promise<void>;
  duplicateProposal: (id: string) => Promise<Proposal>;
  exportProposal: (id: string, format: 'pdf' | 'excel') => Promise<string>;

  // Items
  addProposalItem: (proposalId: string, item: CreateProposalItemData) => Promise<void>;
  updateProposalItem: (proposalId: string, itemId: string, data: Partial<CreateProposalItemData>) => Promise<void>;
  deleteProposalItem: (proposalId: string, itemId: string) => Promise<void>;
  reorderProposalItems: (proposalId: string, itemIds: string[]) => Promise<void>;

  // Comments
  addComment: (proposalId: string, content: string, isInternal?: boolean) => Promise<void>;
  updateComment: (proposalId: string, commentId: string, content: string) => Promise<void>;
  deleteComment: (proposalId: string, commentId: string) => Promise<void>;

  // Attachments
  uploadAttachment: (proposalId: string, file: File) => Promise<void>;
  deleteAttachment: (proposalId: string, attachmentId: string) => Promise<void>;

  // Collaborators
  addCollaborator: (proposalId: string, email: string, role: string) => Promise<void>;
  updateCollaborator: (proposalId: string, collaboratorId: string, role: string) => Promise<void>;
  removeCollaborator: (proposalId: string, collaboratorId: string) => Promise<void>;

  // Utility
  setCurrentProposal: (proposal: Proposal | null) => void;
  setFilters: (filters: Partial<ProposalFilters>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export interface ProposalFetchParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: ProposalFilters;
}

export interface CreateProposalData {
  title: string;
  description: string;
  clientName: string;
  clientEmail: string;
  validUntil: Date;
  currency?: string;
}

export interface CreateProposalItemData {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  category?: string;
}

// ============================================================================
// UI Store Types
// ============================================================================

export interface UIStore {
  // State
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  toasts: Toast[];
  modals: Record<string, boolean>;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;
  isModalOpen: (modalId: string) => boolean;
}

// ============================================================================
// WebSocket Store Types
// ============================================================================

export interface WebSocketStore {
  // State
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
  lastMessage: WebSocketMessage | null;
  typingIndicators: TypingIndicator[];

  // Actions
  connect: () => void;
  disconnect: () => void;
  send: (message: Omit<WebSocketMessage, 'timestamp'>) => void;
  subscribe: (callback: (message: WebSocketMessage) => void) => () => void;
  startTyping: (proposalId: string) => void;
  stopTyping: (proposalId: string) => void;
  addTypingIndicator: (indicator: TypingIndicator) => void;
  removeTypingIndicator: (userId: string, proposalId: string) => void;
  clearTypingIndicators: (proposalId?: string) => void;
  setConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  setError: (error: string | null) => void;
  setLastMessage: (message: WebSocketMessage) => void;
}
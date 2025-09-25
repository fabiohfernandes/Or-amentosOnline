// ============================================================================
// Core Types for OrçamentosOnline Frontend
// NOVA Agent - Frontend Development Specialist
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  company?: string;
  phone?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  CLIENT = 'client',
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Proposal Types
// ============================================================================

export interface Proposal {
  id: string;
  title: string;
  description: string;
  status: ProposalStatus;
  clientId: string;
  clientName: string;
  clientEmail: string;
  totalAmount: number;
  currency: string;
  validUntil: Date;
  items: ProposalItem[];
  attachments: Attachment[];
  comments: ProposalComment[];
  collaborators: ProposalCollaborator[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
}

export enum ProposalStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export interface ProposalItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  order: number;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ProposalComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  isInternal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalCollaborator {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: CollaboratorRole;
  permissions: CollaboratorPermission[];
  addedAt: Date;
}

export enum CollaboratorRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export enum CollaboratorPermission {
  READ = 'read',
  WRITE = 'write',
  COMMENT = 'comment',
  DELETE = 'delete',
  SHARE = 'share',
}

// ============================================================================
// API Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ApiError[];
  pagination?: PaginationMeta;
}

export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// ============================================================================
// UI Types
// ============================================================================

export interface FormError {
  field: string;
  message: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

export interface TableColumn<T = any> {
  key: keyof T | string;
  header: string;
  accessor?: (item: T) => any;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, item: T) => React.ReactNode;
}

export interface FileUploadState {
  files: File[];
  uploading: boolean;
  progress: number;
  errors: string[];
}

// ============================================================================
// Real-time Types
// ============================================================================

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp: Date;
  userId?: string;
}

export enum WebSocketMessageType {
  PROPOSAL_UPDATED = 'proposal_updated',
  COMMENT_ADDED = 'comment_added',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  TYPING_START = 'typing_start',
  TYPING_STOP = 'typing_stop',
  ERROR = 'error',
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  proposalId: string;
  timestamp: Date;
}

// ============================================================================
// Store Types
// ============================================================================

export interface AppState {
  auth: AuthState;
  proposals: ProposalState;
  ui: UIState;
  websocket: WebSocketState;
}

export interface ProposalState {
  items: Proposal[];
  currentProposal: Proposal | null;
  isLoading: boolean;
  error: string | null;
  filters: ProposalFilters;
  pagination: PaginationMeta | null;
}

export interface ProposalFilters {
  status?: ProposalStatus;
  clientName?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  minAmount?: number;
  maxAmount?: number;
}

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  toasts: Toast[];
  modals: {
    [key: string]: boolean;
  };
}

export interface WebSocketState {
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
  lastMessage: WebSocketMessage | null;
  typingIndicators: TypingIndicator[];
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AppConfig {
  apiUrl: string;
  wsUrl: string;
  appName: string;
  appVersion: string;
  maxFileSize: number;
  supportedFileTypes: string[];
  features: {
    realTimeCollaboration: boolean;
    fileUploads: boolean;
    emailNotifications: boolean;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> & {
  [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
}[Keys];

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

// Re-export common React types
export type {
  ReactNode,
  ReactElement,
  ComponentProps,
  ComponentType,
  MouseEvent,
  KeyboardEvent,
  ChangeEvent,
  FormEvent,
} from 'react';
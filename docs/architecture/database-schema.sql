-- OrçamentosOnline Database Schema
-- Version: 1.0
-- Date: September 25, 2025
-- Multi-tenant PostgreSQL schema for proposal management platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text search
CREATE EXTENSION IF NOT EXISTS "unaccent";  -- For accent-insensitive search

-- ============================================================================
-- CORE TENANT MANAGEMENT
-- ============================================================================

-- Organizations serve as the primary tenant boundary
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,  -- URL-friendly identifier
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),  -- Custom domain (optional)
    settings JSONB DEFAULT '{}',  -- Organization preferences
    subscription_tier VARCHAR(20) DEFAULT 'basic',
    subscription_status VARCHAR(20) DEFAULT 'active',
    max_users INTEGER DEFAULT 5,
    max_proposals INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT org_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT valid_subscription_tier CHECK (subscription_tier IN ('basic', 'professional', 'enterprise')),
    CONSTRAINT valid_subscription_status CHECK (subscription_status IN ('active', 'suspended', 'cancelled'))
);

-- Create index for performance
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_domain ON organizations(domain) WHERE domain IS NOT NULL;

-- ============================================================================
-- USER MANAGEMENT
-- ============================================================================

-- Users belong to organizations with specific roles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    avatar_url VARCHAR(500),
    preferences JSONB DEFAULT '{}',
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'manager', 'member')),
    CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Ensure unique email per organization
CREATE UNIQUE INDEX idx_users_org_email ON users(organization_id, email);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);

-- ============================================================================
-- CLIENT MANAGEMENT
-- ============================================================================

-- Clients are the recipients of proposals
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    address TEXT,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clients_organization ON clients(organization_id);
CREATE INDEX idx_clients_email ON clients(email) WHERE email IS NOT NULL;
CREATE INDEX idx_clients_name ON clients USING gin(to_tsvector('portuguese', name));

-- ============================================================================
-- PROPOSAL MANAGEMENT
-- ============================================================================

-- Core proposals table
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id),

    -- Proposal metadata
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft',

    -- Content and design
    content JSONB NOT NULL DEFAULT '{}',  -- Proposal content structure
    design_settings JSONB DEFAULT '{}',   -- Visual customization

    -- Financial information
    total_amount DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'BRL',

    -- Dates and timeline
    valid_until DATE,
    expected_start_date DATE,
    expected_end_date DATE,

    -- Approval and signature
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id),
    signed_at TIMESTAMP WITH TIME ZONE,
    signature_data JSONB,  -- Digital signature information

    -- Access and sharing
    public_token UUID DEFAULT uuid_generate_v4(),  -- For client access
    password_protected BOOLEAN DEFAULT FALSE,
    access_password VARCHAR(255),

    -- Tracking
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_status CHECK (status IN ('draft', 'sent', 'viewed', 'approved', 'rejected', 'signed', 'expired')),
    CONSTRAINT valid_currency CHECK (currency IN ('BRL', 'USD', 'EUR'))
);

CREATE INDEX idx_proposals_organization ON proposals(organization_id);
CREATE INDEX idx_proposals_client ON proposals(client_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_created_by ON proposals(created_by);
CREATE INDEX idx_proposals_public_token ON proposals(public_token);
CREATE INDEX idx_proposals_title ON proposals USING gin(to_tsvector('portuguese', title));

-- ============================================================================
-- PROPOSAL SECTIONS AND ITEMS
-- ============================================================================

-- Proposal sections (services, products, terms, etc.)
CREATE TABLE proposal_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    section_type VARCHAR(50) DEFAULT 'content',  -- content, pricing, terms, etc.
    order_index INTEGER NOT NULL DEFAULT 0,
    content JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_proposal_sections_proposal ON proposal_sections(proposal_id);
CREATE INDEX idx_proposal_sections_order ON proposal_sections(proposal_id, order_index);

-- Individual items within sections (line items, services, products)
CREATE TABLE proposal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES proposal_sections(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(12,2),
    total_price DECIMAL(12,2),
    order_index INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',  -- Additional item properties
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_proposal_items_section ON proposal_items(section_id);
CREATE INDEX idx_proposal_items_order ON proposal_items(section_id, order_index);

-- ============================================================================
-- FILE AND MEDIA MANAGEMENT
-- ============================================================================

-- File attachments for proposals
CREATE TABLE proposal_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_type VARCHAR(50) NOT NULL,  -- image, document, video, etc.
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_proposal_files_proposal ON proposal_files(proposal_id);
CREATE INDEX idx_proposal_files_type ON proposal_files(file_type);

-- ============================================================================
-- ACTIVITY AND AUDIT LOGGING
-- ============================================================================

-- Activity log for all system actions
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,

    action VARCHAR(100) NOT NULL,  -- created, updated, viewed, approved, etc.
    entity_type VARCHAR(50) NOT NULL,  -- proposal, user, organization, etc.
    entity_id UUID,

    details JSONB DEFAULT '{}',  -- Additional context
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_organization ON activity_logs(organization_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_proposal ON activity_logs(proposal_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- ============================================================================
-- AUTHENTICATION AND SESSIONS
-- ============================================================================

-- User session management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(refresh_token_hash);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_token ON password_reset_tokens(token_hash);

-- ============================================================================
-- NOTIFICATION SYSTEM
-- ============================================================================

-- Notification preferences and delivery
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,

    type VARCHAR(50) NOT NULL,  -- proposal_viewed, proposal_approved, etc.
    title VARCHAR(255) NOT NULL,
    content TEXT,

    channels JSONB DEFAULT '[]',  -- ['email', 'whatsapp', 'telegram']
    delivery_status JSONB DEFAULT '{}',  -- Channel delivery status

    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_organization ON notifications(organization_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proposal_sections_updated_at BEFORE UPDATE ON proposal_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proposal_items_updated_at BEFORE UPDATE ON proposal_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log activities
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the activity (implementation would depend on specific requirements)
    -- This is a placeholder for activity logging logic
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- ============================================================================
-- SAMPLE DATA AND INITIAL SETUP
-- ============================================================================

-- Insert default organization for development
INSERT INTO organizations (id, slug, name, subscription_tier)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo',
    'Demo Organization',
    'professional'
) ON CONFLICT (id) DO NOTHING;

-- Insert default admin user for development
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, role, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'admin@demo.com',
    '$2b$10$PLACEHOLDER_HASH',  -- Replace with actual bcrypt hash
    'System',
    'Administrator',
    'owner',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Additional indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposals_org_status_created ON proposals(organization_id, status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_org_role ON users(organization_id, role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_recent ON activity_logs(organization_id, created_at DESC) WHERE created_at > NOW() - INTERVAL '30 days';

-- ============================================================================
-- SECURITY AND PERMISSIONS
-- ============================================================================

-- Row Level Security (RLS) policies would be implemented here
-- This ensures multi-tenant data isolation at the database level

-- Enable RLS on all tenant-scoped tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Note: Actual RLS policies would be created based on application authentication context
-- These would ensure users can only access data within their organization

COMMENT ON DATABASE current_database() IS 'OrçamentosOnline - Multi-tenant proposal management platform database';
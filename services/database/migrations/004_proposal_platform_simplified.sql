-- Migration 004: Proposal Platform Simplified Schema
-- OrçamentosOnline - Simplified Proposal Platform Implementation
-- Phase 3A: Core Platform Implementation
-- Date: September 26, 2025

BEGIN;

-- ============================================================================
-- SIMPLIFIED SCHEMA FOR PROPOSAL PLATFORM
-- ============================================================================

-- Drop complex multi-tenant tables to simplify for proposal platform focus
DROP TABLE IF EXISTS proposal_files CASCADE;
DROP TABLE IF EXISTS proposal_items CASCADE;
DROP TABLE IF EXISTS proposal_sections CASCADE;
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS proposal_templates CASCADE;

-- Keep core tables but simplify them
-- Organizations table remains for future scaling
-- Users table remains for user management
-- Clients table remains for client management

-- ============================================================================
-- SIMPLIFIED PROPOSALS TABLE
-- ============================================================================

-- Drop existing proposals table to recreate simplified version
DROP TABLE IF EXISTS proposals CASCADE;

CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Core proposal information
    proposal_name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    job_name VARCHAR(255) NOT NULL,

    -- Four-page content URLs
    presentation_url TEXT,
    commercial_proposal_url TEXT,

    -- Text content for pages 3 and 4
    scope_text TEXT NOT NULL DEFAULT '',
    terms_text TEXT NOT NULL DEFAULT '',

    -- Client authentication
    client_username VARCHAR(100) NOT NULL,
    client_password_hash VARCHAR(255) NOT NULL,

    -- Proposal status
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived')),

    -- Financial information (optional)
    proposal_value DECIMAL(12,2) DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE,

    -- Public access token for client viewing
    public_token UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL
);

-- Create unique index for client usernames across all proposals
CREATE UNIQUE INDEX idx_proposals_client_username ON proposals(client_username);

-- Performance indexes
CREATE INDEX idx_proposals_organization ON proposals(organization_id);
CREATE INDEX idx_proposals_user ON proposals(user_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_created ON proposals(created_at DESC);
CREATE INDEX idx_proposals_public_token ON proposals(public_token);

-- Full-text search on proposal content
CREATE INDEX idx_proposals_search ON proposals USING gin(
    to_tsvector('portuguese',
        proposal_name || ' ' ||
        client_name || ' ' ||
        job_name || ' ' ||
        COALESCE(scope_text, '')
    )
);

COMMENT ON TABLE proposals IS 'Simplified proposals table for Phase 3A implementation';
COMMENT ON COLUMN proposals.client_username IS 'Unique username for client access to this specific proposal';
COMMENT ON COLUMN proposals.client_password_hash IS 'Hashed password for client access';
COMMENT ON COLUMN proposals.public_token IS 'UUID token for secure client access';

-- ============================================================================
-- CLIENT COMMENTS TABLE
-- ============================================================================

CREATE TABLE client_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Performance indexes
CREATE INDEX idx_client_comments_proposal ON client_comments(proposal_id);
CREATE INDEX idx_client_comments_created ON client_comments(created_at DESC);

COMMENT ON TABLE client_comments IS 'Client feedback comments on proposals';

-- ============================================================================
-- PROPOSAL ANALYTICS TABLE
-- ============================================================================

CREATE TABLE proposal_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,

    -- Page tracking
    page_number INTEGER NOT NULL CHECK (page_number BETWEEN 1 AND 4),
    page_name VARCHAR(50) NOT NULL CHECK (page_name IN ('presentation', 'commercial', 'scope', 'terms')),

    -- Session tracking
    session_id UUID NOT NULL,

    -- View details
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    time_spent_seconds INTEGER DEFAULT 0,
    ip_address INET,
    user_agent TEXT,

    -- Device information
    device_type VARCHAR(20) DEFAULT 'desktop' CHECK (device_type IN ('desktop', 'tablet', 'mobile')),
    browser VARCHAR(50),

    -- Interaction tracking
    interactions_count INTEGER DEFAULT 0,
    scrolled_to_bottom BOOLEAN DEFAULT FALSE
);

-- Performance indexes
CREATE INDEX idx_proposal_analytics_proposal ON proposal_analytics(proposal_id);
CREATE INDEX idx_proposal_analytics_session ON proposal_analytics(session_id);
CREATE INDEX idx_proposal_analytics_page ON proposal_analytics(proposal_id, page_number);
CREATE INDEX idx_proposal_analytics_viewed ON proposal_analytics(viewed_at DESC);

COMMENT ON TABLE proposal_analytics IS 'Detailed analytics tracking for proposal viewing sessions';

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to proposals table
CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA FOR DEVELOPMENT
-- ============================================================================

-- Insert sample organization if not exists
INSERT INTO organizations (id, slug, name, domain, subscription_tier, subscription_status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo-org',
    'Empresa Demo',
    'demo.orcamentosonline.com',
    'professional',
    'active'
) ON CONFLICT (slug) DO NOTHING;

-- Insert sample user if not exists
INSERT INTO users (
    id,
    organization_id,
    email,
    password_hash,
    first_name,
    last_name,
    role,
    email_verified
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'demo@orcamentosonline.com',
    '$2b$10$example.hash.for.password123',  -- password: "demo123"
    'Demo',
    'User',
    'owner',
    true
) ON CONFLICT (organization_id, email) DO NOTHING;

-- Insert sample client if not exists
INSERT INTO clients (
    id,
    organization_id,
    name,
    email,
    company,
    status,
    created_by
) VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'João Silva',
    'joao@empresaclient.com',
    'Empresa Cliente Ltda',
    'active',
    '00000000-0000-0000-0000-000000000002'
) ON CONFLICT DO NOTHING;

-- Insert sample proposal for demonstration
INSERT INTO proposals (
    id,
    organization_id,
    user_id,
    proposal_name,
    client_name,
    job_name,
    presentation_url,
    commercial_proposal_url,
    scope_text,
    terms_text,
    client_username,
    client_password_hash,
    status,
    proposal_value
) VALUES (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'Proposta Website Institucional',
    'João Silva',
    'Desenvolvimento Website Empresarial',
    'https://docs.google.com/presentation/d/example/embed',
    'https://docs.google.com/document/d/example/embed',
    E'**Escopo do Projeto:**\n\n1. **Desenvolvimento do Website:**\n   - Design responsivo e moderno\n   - 5 páginas principais (Home, Sobre, Serviços, Portfólio, Contato)\n   - Integração com formulários de contato\n   - Otimização para SEO\n\n2. **Funcionalidades Incluídas:**\n   - Painel administrativo\n   - Blog integrado\n   - Galeria de imagens\n   - Integração com redes sociais\n\n3. **Entrega:**\n   - Prazo: 30 dias\n   - Treinamento incluído\n   - 3 meses de suporte gratuito',
    E'**Termos e Condições:**\n\n**1. Pagamento:**\n- 50% na assinatura do contrato\n- 50% na entrega final do projeto\n\n**2. Prazos:**\n- Início: Imediatamente após confirmação\n- Entrega: 30 dias corridos\n- Revisões: Até 3 rodadas de ajustes incluídas\n\n**3. Garantia:**\n- 90 dias de garantia contra defeitos\n- Suporte técnico por 3 meses incluído\n\n**4. Responsabilidades do Cliente:**\n- Fornecimento de conteúdo e imagens\n- Aprovações em até 48h\n- Pagamento conforme cronograma\n\n**5. Propriedade Intelectual:**\n- Código-fonte será de propriedade do cliente\n- Design e arquitetura seguem padrões de mercado\n\n**Valor Total: R$ 5.500,00**\n\n*Ao clicar em "Aceitar e Fechar Negócio", você concorda com todos os termos acima.*',
    'joao_silva_2024',
    '$2b$10$example.hash.for.clientpass',  -- password: "cliente123"
    'open',
    5500.00
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMPLETION
-- ============================================================================

COMMIT;

-- Show simplified schema
\echo 'Simplified Proposal Platform Schema Created:'
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('proposals', 'client_comments', 'proposal_analytics')
ORDER BY table_name, ordinal_position;
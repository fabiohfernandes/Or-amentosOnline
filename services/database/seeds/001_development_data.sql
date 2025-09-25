-- Development Seed Data
-- OrçamentosOnline - Database Development Data
-- CASSANDRA Agent - Database Engineering
-- Version: 1.0
-- Date: September 25, 2025

-- This script populates the database with realistic development and testing data
-- Run this after the core schema migration

BEGIN;

-- ============================================================================
-- SEED DATA TRACKING
-- ============================================================================

INSERT INTO maintenance.migration_history (
    version,
    description,
    applied_at
) VALUES (
    '001_seed',
    'Insert development seed data for testing and demonstration',
    NOW()
);

-- ============================================================================
-- DEMO ORGANIZATIONS
-- ============================================================================

-- Demo organization for development
INSERT INTO organizations (
    id,
    slug,
    name,
    domain,
    settings,
    subscription_tier,
    subscription_status,
    max_users,
    max_proposals
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'demo-empresa',
    'Demo Empresa Ltda',
    NULL,
    jsonb_build_object(
        'timezone', 'America/Sao_Paulo',
        'language', 'pt_BR',
        'currency', 'BRL',
        'theme', 'default',
        'notifications', jsonb_build_object(
            'email', true,
            'whatsapp', true,
            'telegram', false
        )
    ),
    'professional',
    'active',
    25,
    500
),
(
    '00000000-0000-0000-0000-000000000002',
    'agencia-criativa',
    'Agência Criativa Digital',
    'criativa.infigital.net',
    jsonb_build_object(
        'timezone', 'America/Sao_Paulo',
        'language', 'pt_BR',
        'currency', 'BRL',
        'theme', 'creative',
        'brand_color', '#FF6B35',
        'logo_url', 'https://example.com/logo.png'
    ),
    'enterprise',
    'active',
    50,
    1000
),
(
    '00000000-0000-0000-0000-000000000003',
    'consultoria-tech',
    'Tech Solutions Consultoria',
    NULL,
    jsonb_build_object(
        'timezone', 'America/Sao_Paulo',
        'language', 'pt_BR',
        'currency', 'BRL',
        'theme', 'modern'
    ),
    'basic',
    'active',
    5,
    50
);

-- ============================================================================
-- DEMO USERS
-- ============================================================================

-- Users for Demo Empresa
INSERT INTO users (
    id,
    organization_id,
    email,
    password_hash,
    first_name,
    last_name,
    role,
    email_verified,
    preferences,
    last_login_at
) VALUES
-- Owner user
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'admin@demo.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewUOxprHgzGvY.Wm', -- password: admin123
    'Administrador',
    'Sistema',
    'owner',
    TRUE,
    jsonb_build_object(
        'dashboard', 'advanced',
        'notifications', jsonb_build_object(
            'email', true,
            'browser', true
        )
    ),
    NOW() - INTERVAL '2 hours'
),
-- Manager user
(
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'gerente@demo.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewUOxprHgzGvY.Wm', -- password: admin123
    'Maria',
    'Silva',
    'manager',
    TRUE,
    jsonb_build_object(
        'dashboard', 'standard',
        'theme', 'light'
    ),
    NOW() - INTERVAL '1 day'
),
-- Regular member
(
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'vendedor@demo.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewUOxprHgzGvY.Wm', -- password: admin123
    'João',
    'Santos',
    'member',
    TRUE,
    jsonb_build_object(
        'dashboard', 'simple'
    ),
    NOW() - INTERVAL '6 hours'
);

-- Users for Agência Criativa
INSERT INTO users (
    id,
    organization_id,
    email,
    password_hash,
    first_name,
    last_name,
    role,
    email_verified
) VALUES
(
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    'diretor@criativa.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewUOxprHgzGvY.Wm',
    'Ana',
    'Costa',
    'owner',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000002',
    'designer@criativa.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewUOxprHgzGvY.Wm',
    'Carlos',
    'Mendes',
    'member',
    TRUE
);

-- ============================================================================
-- DEMO CLIENTS
-- ============================================================================

INSERT INTO clients (
    id,
    organization_id,
    name,
    email,
    phone,
    company,
    document,
    address,
    city,
    state,
    postal_code,
    notes,
    tags,
    created_by
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Roberto Oliveira',
    'roberto@techstart.com.br',
    '+55 11 99999-1234',
    'TechStart Solutions',
    '12345678901',
    'Av. Paulista, 1000, Conjunto 101',
    'São Paulo',
    'SP',
    '01310-100',
    'Cliente interessado em modernização de sistemas legados',
    ARRAY['tecnologia', 'startup', 'prioritario'],
    '00000000-0000-0000-0000-000000000002'
),
(
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Fernanda Lima',
    'fernanda@ecoverse.com.br',
    '+55 11 98888-5678',
    'EcoVerse Sustentabilidade',
    '98765432100',
    'Rua Augusta, 500, 8º andar',
    'São Paulo',
    'SP',
    '01305-000',
    'Empresa focada em soluções sustentáveis. Orçamento para plataforma de carbono.',
    ARRAY['sustentabilidade', 'esg', 'carbono'],
    '00000000-0000-0000-0000-000000000002'
),
(
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Pedro Santos',
    'pedro@lojavarejo.com.br',
    '+55 11 97777-9012',
    'Loja Varejo Plus',
    '11223344556',
    'Rua das Flores, 200',
    'São Paulo',
    'SP',
    '01234-567',
    'Rede de varejo interessada em e-commerce',
    ARRAY['varejo', 'ecommerce'],
    '00000000-0000-0000-0000-000000000003'
),
(
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    'Mariana Rodrigues',
    'mariana@belezanatura.com',
    '+55 21 96666-3456',
    'Beleza & Natura',
    '55667788990',
    'Rua Copacabana, 800',
    'Rio de Janeiro',
    'RJ',
    '22070-000',
    'Marca de cosméticos naturais',
    ARRAY['cosmeticos', 'beleza', 'natura'],
    '00000000-0000-0000-0000-000000000004'
);

-- ============================================================================
-- DEMO PROPOSALS
-- ============================================================================

INSERT INTO proposals (
    id,
    organization_id,
    client_id,
    created_by,
    assigned_to,
    title,
    description,
    status,
    proposal_number,
    content,
    design_settings,
    currency,
    subtotal,
    tax_amount,
    total_amount,
    valid_until,
    expected_start_date,
    expected_end_date,
    estimated_hours,
    public_token,
    view_count,
    last_viewed_at,
    internal_notes
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    'Modernização do Sistema ERP - TechStart',
    'Proposta para modernização completa do sistema ERP existente, incluindo migração para cloud, novas funcionalidades e treinamento da equipe.',
    'sent',
    'PROP-2025-001',
    jsonb_build_object(
        'executive_summary', 'Modernização completa do sistema ERP com tecnologias cloud-native',
        'objectives', ARRAY['Melhorar performance', 'Reduzir custos operacionais', 'Aumentar segurança'],
        'deliverables', ARRAY['Sistema migrado', 'Documentação técnica', 'Treinamento da equipe']
    ),
    jsonb_build_object(
        'theme', 'professional',
        'primary_color', '#2563eb',
        'font_family', 'Inter',
        'logo_position', 'top-left'
    ),
    'BRL',
    250000.00,
    37500.00,
    287500.00,
    CURRENT_DATE + INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '45 days',
    CURRENT_DATE + INTERVAL '120 days',
    800.00,
    uuid_generate_v4(),
    15,
    NOW() - INTERVAL '2 days',
    'Cliente muito interessado. Aguardando aprovação da diretoria.'
),
(
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Plataforma de Carbono - EcoVerse',
    'Desenvolvimento de plataforma digital para gestão e comercialização de créditos de carbono.',
    'draft',
    'PROP-2025-002',
    jsonb_build_object(
        'executive_summary', 'Plataforma inovadora para o mercado de créditos de carbono',
        'scope', 'Desenvolvimento full-stack com blockchain integration'
    ),
    jsonb_build_object(
        'theme', 'eco',
        'primary_color', '#059669',
        'font_family', 'Poppins'
    ),
    'BRL',
    180000.00,
    27000.00,
    207000.00,
    CURRENT_DATE + INTERVAL '45 days',
    CURRENT_DATE + INTERVAL '60 days',
    CURRENT_DATE + INTERVAL '180 days',
    600.00,
    uuid_generate_v4(),
    3,
    NOW() - INTERVAL '1 day',
    'Primeira reunião muito positiva. Preparando versão detalhada.'
),
(
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    NULL,
    'E-commerce Loja Varejo Plus',
    'Desenvolvimento de plataforma e-commerce completa com integração a sistemas existentes.',
    'approved',
    'PROP-2025-003',
    jsonb_build_object(
        'executive_summary', 'Solução e-commerce integrada para expansão digital',
        'features', ARRAY['Catálogo de produtos', 'Pagamentos online', 'Gestão de estoque', 'Analytics']
    ),
    jsonb_build_object(
        'theme', 'modern',
        'primary_color', '#7c3aed',
        'font_family', 'Roboto'
    ),
    'BRL',
    95000.00,
    14250.00,
    109250.00,
    CURRENT_DATE + INTERVAL '15 days',
    CURRENT_DATE + INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '90 days',
    320.00,
    uuid_generate_v4(),
    25,
    NOW() - INTERVAL '4 hours',
    'Aprovado! Aguardando assinatura do contrato.'
),
(
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000005',
    'Website Institucional - Beleza & Natura',
    'Desenvolvimento de website institucional com e-commerce integrado e sistema de assinatura.',
    'viewed',
    'PROP-2025-004',
    jsonb_build_object(
        'executive_summary', 'Website moderno com foco na experiência do usuário e conversão',
        'sections', ARRAY['Home', 'Produtos', 'Sobre', 'Blog', 'Contato', 'Loja']
    ),
    jsonb_build_object(
        'theme', 'beauty',
        'primary_color', '#ec4899',
        'secondary_color', '#059669',
        'font_family', 'Playfair Display'
    ),
    'BRL',
    45000.00,
    6750.00,
    51750.00,
    CURRENT_DATE + INTERVAL '20 days',
    CURRENT_DATE + INTERVAL '35 days',
    CURRENT_DATE + INTERVAL '75 days',
    150.00,
    uuid_generate_v4(),
    8,
    NOW() - INTERVAL '6 hours',
    'Cliente gostou muito do design. Negociando prazos de entrega.'
);

-- ============================================================================
-- PROPOSAL SECTIONS AND ITEMS
-- ============================================================================

-- Sections for ERP Modernization Proposal
INSERT INTO proposal_sections (
    id,
    proposal_id,
    title,
    description,
    section_type,
    order_index,
    content
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Análise e Planejamento',
    'Fase inicial de análise do sistema atual e planejamento da migração',
    'content',
    1,
    jsonb_build_object(
        'duration', '4 semanas',
        'deliverables', ARRAY['Relatório de análise', 'Plano de migração', 'Cronograma detalhado']
    )
),
(
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Desenvolvimento e Migração',
    'Desenvolvimento da nova solução e migração dos dados',
    'content',
    2,
    jsonb_build_object(
        'duration', '12 semanas',
        'technologies', ARRAY['Node.js', 'React', 'PostgreSQL', 'AWS']
    )
),
(
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Investimento',
    'Detalhamento dos custos do projeto',
    'pricing',
    3,
    jsonb_build_object(
        'payment_terms', '40% na assinatura, 40% na entrega, 20% após 30 dias',
        'warranty', '6 meses de suporte incluído'
    )
);

-- Items for Analysis and Planning Section
INSERT INTO proposal_items (
    section_id,
    title,
    description,
    quantity,
    unit,
    unit_price,
    total_price,
    order_index
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'Análise do Sistema Atual',
    'Auditoria completa do sistema ERP existente, identificação de gaps e oportunidades',
    80,
    'horas',
    200.00,
    16000.00,
    1
),
(
    '00000000-0000-0000-0000-000000000001',
    'Planejamento de Arquitetura',
    'Definição da nova arquitetura, tecnologias e estratégia de migração',
    60,
    'horas',
    250.00,
    15000.00,
    2
),
(
    '00000000-0000-0000-0000-000000000001',
    'Documentação Técnica',
    'Elaboração de documentação técnica e funcional detalhada',
    40,
    'horas',
    180.00,
    7200.00,
    3
);

-- Items for Development Section
INSERT INTO proposal_items (
    section_id,
    title,
    description,
    quantity,
    unit,
    unit_price,
    total_price,
    order_index
) VALUES
(
    '00000000-0000-0000-0000-000000000002',
    'Desenvolvimento Backend',
    'API REST, integração com bancos de dados e serviços externos',
    300,
    'horas',
    220.00,
    66000.00,
    1
),
(
    '00000000-0000-0000-0000-000000000002',
    'Desenvolvimento Frontend',
    'Interface de usuário responsiva e intuitiva',
    250,
    'horas',
    200.00,
    50000.00,
    2
),
(
    '00000000-0000-0000-0000-000000000002',
    'Migração de Dados',
    'Migração segura e validação de dados do sistema antigo',
    100,
    'horas',
    300.00,
    30000.00,
    3
),
(
    '00000000-0000-0000-0000-000000000002',
    'Testes e QA',
    'Testes automatizados, testes de carga e validação de qualidade',
    80,
    'horas',
    180.00,
    14400.00,
    4
),
(
    '00000000-0000-0000-0000-000000000002',
    'Treinamento da Equipe',
    'Treinamento completo da equipe no novo sistema',
    40,
    'horas',
    150.00,
    6000.00,
    5
);

-- ============================================================================
-- ACTIVITY LOGS SAMPLE DATA
-- ============================================================================

INSERT INTO activity_logs (
    organization_id,
    user_id,
    proposal_id,
    action,
    entity_type,
    entity_id,
    changes_summary,
    ip_address,
    session_id,
    severity,
    category
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'proposal_created',
    'proposal',
    '00000000-0000-0000-0000-000000000001',
    'Criada proposta "Modernização do Sistema ERP - TechStart"',
    '192.168.1.10',
    'sess_abc123',
    'info',
    'proposal_management'
),
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'proposal_sent',
    'proposal',
    '00000000-0000-0000-0000-000000000001',
    'Proposta enviada para cliente Roberto Oliveira',
    '192.168.1.10',
    'sess_abc123',
    'info',
    'proposal_management'
),
(
    '00000000-0000-0000-0000-000000000001',
    NULL,
    '00000000-0000-0000-0000-000000000001',
    'proposal_viewed',
    'proposal',
    '00000000-0000-0000-0000-000000000001',
    'Proposta visualizada pelo cliente (token público)',
    '201.23.45.67',
    'public_access',
    'info',
    'client_interaction'
);

-- ============================================================================
-- NOTIFICATION SAMPLE DATA
-- ============================================================================

INSERT INTO notifications (
    organization_id,
    user_id,
    proposal_id,
    type,
    title,
    content,
    channels,
    priority,
    delivery_status,
    sent_at
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'proposal_viewed',
    'Proposta foi visualizada',
    'A proposta "Modernização do Sistema ERP - TechStart" foi visualizada pelo cliente.',
    '["email", "browser"]',
    'normal',
    jsonb_build_object('email', 'delivered', 'browser', 'pending'),
    NOW() - INTERVAL '2 days'
),
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'proposal_approved',
    'Proposta aprovada!',
    'A proposta "E-commerce Loja Varejo Plus" foi aprovada pelo cliente.',
    '["email", "browser", "whatsapp"]',
    'high',
    jsonb_build_object('email', 'delivered', 'browser', 'delivered', 'whatsapp', 'delivered'),
    NOW() - INTERVAL '4 hours'
);

-- ============================================================================
-- PROPOSAL TEMPLATES
-- ============================================================================

INSERT INTO proposal_templates (
    id,
    organization_id,
    created_by,
    name,
    description,
    category,
    template_data,
    design_settings,
    usage_count,
    last_used_at
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'Template E-commerce Padrão',
    'Template para propostas de desenvolvimento de e-commerce com seções pré-definidas',
    'ecommerce',
    jsonb_build_object(
        'sections', ARRAY[
            jsonb_build_object('name', 'Análise de Requisitos', 'type', 'content'),
            jsonb_build_object('name', 'Desenvolvimento', 'type', 'content'),
            jsonb_build_object('name', 'Investimento', 'type', 'pricing'),
            jsonb_build_object('name', 'Cronograma', 'type', 'timeline')
        ],
        'default_items', ARRAY[
            jsonb_build_object('name', 'Design UI/UX', 'unit', 'horas', 'price', 150),
            jsonb_build_object('name', 'Desenvolvimento Frontend', 'unit', 'horas', 'price', 200),
            jsonb_build_object('name', 'Desenvolvimento Backend', 'unit', 'horas', 'price', 220),
            jsonb_build_object('name', 'Integração de Pagamentos', 'unit', 'horas', 'price', 250)
        ]
    ),
    jsonb_build_object(
        'theme', 'modern',
        'primary_color', '#3b82f6',
        'font_family', 'Inter'
    ),
    3,
    NOW() - INTERVAL '1 week'
),
(
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    'Template Website Institucional',
    'Template para propostas de websites institucionais com foco em branding',
    'website',
    jsonb_build_object(
        'sections', ARRAY[
            jsonb_build_object('name', 'Conceito e Estratégia', 'type', 'content'),
            jsonb_build_object('name', 'Design e Desenvolvimento', 'type', 'content'),
            jsonb_build_object('name', 'Investimento', 'type', 'pricing')
        ]
    ),
    jsonb_build_object(
        'theme', 'creative',
        'primary_color', '#ec4899',
        'font_family', 'Playfair Display'
    ),
    1,
    NOW() - INTERVAL '3 days'
);

-- ============================================================================
-- COMPLETION AND VERIFICATION
-- ============================================================================

-- Update seed data migration record
UPDATE maintenance.migration_history
SET execution_time_ms = EXTRACT(EPOCH FROM (NOW() - applied_at)) * 1000
WHERE version = '001_seed';

-- Record successful seed data insertion
INSERT INTO maintenance.health_checks (check_name, status, details)
VALUES (
    'seed_data_001',
    'healthy',
    jsonb_build_object(
        'message', 'Development seed data inserted successfully',
        'organizations', 3,
        'users', 5,
        'clients', 4,
        'proposals', 4,
        'proposal_sections', 3,
        'proposal_items', 8,
        'templates', 2,
        'notifications', 2
    )
);

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

\echo 'Seed data insertion completed successfully!'
\echo ''
\echo 'Summary of inserted data:'

SELECT
    'Organizations' as entity,
    COUNT(*) as count
FROM organizations
UNION ALL
SELECT
    'Users',
    COUNT(*)
FROM users
UNION ALL
SELECT
    'Clients',
    COUNT(*)
FROM clients
UNION ALL
SELECT
    'Proposals',
    COUNT(*)
FROM proposals
UNION ALL
SELECT
    'Proposal Sections',
    COUNT(*)
FROM proposal_sections
UNION ALL
SELECT
    'Proposal Items',
    COUNT(*)
FROM proposal_items
UNION ALL
SELECT
    'Templates',
    COUNT(*)
FROM proposal_templates
UNION ALL
SELECT
    'Notifications',
    COUNT(*)
FROM notifications;

\echo ''
\echo 'Test login credentials:'
\echo 'Demo Empresa:'
\echo '  Owner: admin@demo.com / admin123'
\echo '  Manager: gerente@demo.com / admin123'
\echo '  Member: vendedor@demo.com / admin123'
\echo ''
\echo 'Agência Criativa:'
\echo '  Owner: diretor@criativa.com / admin123'
\echo '  Member: designer@criativa.com / admin123'
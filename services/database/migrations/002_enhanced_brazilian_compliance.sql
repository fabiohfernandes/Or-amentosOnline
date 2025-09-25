-- Migration 002: Enhanced Brazilian Compliance Features
-- OrçamentosOnline - Enhanced Brazilian Market Compliance
-- CASSANDRA Agent - Database Engineering
-- Version: 2.0
-- Date: September 25, 2025

-- This migration enhances Brazilian compliance with improved CPF/CNPJ validation,
-- LGPD data governance, and Brazilian business logic

BEGIN;

-- ============================================================================
-- MIGRATION TRACKING
-- ============================================================================

INSERT INTO maintenance.migration_history (
    version,
    description,
    applied_at
) VALUES (
    '002',
    'Enhanced Brazilian compliance with full CPF/CNPJ validation and LGPD improvements',
    NOW()
);

-- ============================================================================
-- ENHANCED CPF/CNPJ VALIDATION FUNCTIONS
-- ============================================================================

-- Complete CPF validation with check digits algorithm
CREATE OR REPLACE FUNCTION validate_cpf(cpf TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    clean_cpf TEXT;
    digit1 INTEGER;
    digit2 INTEGER;
    sum1 INTEGER := 0;
    sum2 INTEGER := 0;
    i INTEGER;
BEGIN
    -- Remove non-numeric characters
    clean_cpf := regexp_replace(cpf, '[^0-9]', '', 'g');

    -- Check length
    IF length(clean_cpf) != 11 THEN
        RETURN FALSE;
    END IF;

    -- Check for known invalid CPFs (all same digits)
    IF clean_cpf IN ('00000000000', '11111111111', '22222222222', '33333333333',
                     '44444444444', '55555555555', '66666666666', '77777777777',
                     '88888888888', '99999999999') THEN
        RETURN FALSE;
    END IF;

    -- Calculate first check digit
    FOR i IN 1..9 LOOP
        sum1 := sum1 + (substring(clean_cpf, i, 1)::integer * (11 - i));
    END LOOP;

    digit1 := 11 - (sum1 % 11);
    IF digit1 >= 10 THEN
        digit1 := 0;
    END IF;

    -- Verify first digit
    IF digit1 != substring(clean_cpf, 10, 1)::integer THEN
        RETURN FALSE;
    END IF;

    -- Calculate second check digit
    FOR i IN 1..10 LOOP
        sum2 := sum2 + (substring(clean_cpf, i, 1)::integer * (12 - i));
    END LOOP;

    digit2 := 11 - (sum2 % 11);
    IF digit2 >= 10 THEN
        digit2 := 0;
    END IF;

    -- Verify second digit
    RETURN digit2 = substring(clean_cpf, 11, 1)::integer;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Complete CNPJ validation with check digits algorithm
CREATE OR REPLACE FUNCTION validate_cnpj(cnpj TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    clean_cnpj TEXT;
    digit1 INTEGER;
    digit2 INTEGER;
    sum1 INTEGER := 0;
    sum2 INTEGER := 0;
    weights1 INTEGER[] := ARRAY[5,4,3,2,9,8,7,6,5,4,3,2];
    weights2 INTEGER[] := ARRAY[6,5,4,3,2,9,8,7,6,5,4,3,2];
    i INTEGER;
BEGIN
    -- Remove non-numeric characters
    clean_cnpj := regexp_replace(cnpj, '[^0-9]', '', 'g');

    -- Check length
    IF length(clean_cnpj) != 14 THEN
        RETURN FALSE;
    END IF;

    -- Check for known invalid CNPJs (all same digits)
    IF clean_cnpj ~ '^(.)\1*$' THEN
        RETURN FALSE;
    END IF;

    -- Calculate first check digit
    FOR i IN 1..12 LOOP
        sum1 := sum1 + (substring(clean_cnpj, i, 1)::integer * weights1[i]);
    END LOOP;

    digit1 := sum1 % 11;
    IF digit1 < 2 THEN
        digit1 := 0;
    ELSE
        digit1 := 11 - digit1;
    END IF;

    -- Verify first digit
    IF digit1 != substring(clean_cnpj, 13, 1)::integer THEN
        RETURN FALSE;
    END IF;

    -- Calculate second check digit
    FOR i IN 1..13 LOOP
        sum2 := sum2 + (substring(clean_cnpj, i, 1)::integer * weights2[i]);
    END LOOP;

    digit2 := sum2 % 11;
    IF digit2 < 2 THEN
        digit2 := 0;
    ELSE
        digit2 := 11 - digit2;
    END IF;

    -- Verify second digit
    RETURN digit2 = substring(clean_cnpj, 14, 1)::integer;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Enhanced CPF/CNPJ validation function (replaces the basic one)
CREATE OR REPLACE FUNCTION validate_cpf_cnpj(document TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    clean_doc TEXT;
    doc_length INTEGER;
BEGIN
    -- Handle NULL input
    IF document IS NULL THEN
        RETURN TRUE; -- Allow NULL documents
    END IF;

    -- Remove non-numeric characters
    clean_doc := regexp_replace(document, '[^0-9]', '', 'g');
    doc_length := length(clean_doc);

    -- Validate based on length
    IF doc_length = 11 THEN
        RETURN validate_cpf(clean_doc);
    ELSIF doc_length = 14 THEN
        RETURN validate_cnpj(clean_doc);
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_cpf_cnpj(TEXT) IS 'Complete validation for Brazilian CPF (11 digits) and CNPJ (14 digits) with check digit algorithm';

-- Function to format CPF/CNPJ for display
CREATE OR REPLACE FUNCTION format_cpf_cnpj(document TEXT)
RETURNS TEXT AS $$
DECLARE
    clean_doc TEXT;
    doc_length INTEGER;
BEGIN
    IF document IS NULL THEN
        RETURN NULL;
    END IF;

    clean_doc := regexp_replace(document, '[^0-9]', '', 'g');
    doc_length := length(clean_doc);

    IF doc_length = 11 THEN
        -- Format as CPF: 000.000.000-00
        RETURN substring(clean_doc, 1, 3) || '.' ||
               substring(clean_doc, 4, 3) || '.' ||
               substring(clean_doc, 7, 3) || '-' ||
               substring(clean_doc, 10, 2);
    ELSIF doc_length = 14 THEN
        -- Format as CNPJ: 00.000.000/0000-00
        RETURN substring(clean_doc, 1, 2) || '.' ||
               substring(clean_doc, 3, 3) || '.' ||
               substring(clean_doc, 6, 3) || '/' ||
               substring(clean_doc, 9, 4) || '-' ||
               substring(clean_doc, 13, 2);
    ELSE
        RETURN clean_doc; -- Return as-is if invalid format
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION format_cpf_cnpj(TEXT) IS 'Format CPF/CNPJ documents for Brazilian standard display (XXX.XXX.XXX-XX or XX.XXX.XXX/XXXX-XX)';

-- ============================================================================
-- ENHANCED LGPD COMPLIANCE FEATURES
-- ============================================================================

-- Data classification and retention policies
CREATE TABLE IF NOT EXISTS data_classification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_category VARCHAR(100) NOT NULL UNIQUE,
    sensitivity_level VARCHAR(20) NOT NULL CHECK (sensitivity_level IN ('public', 'internal', 'confidential', 'restricted')),
    retention_period_months INTEGER NOT NULL,
    legal_basis TEXT NOT NULL,
    purpose TEXT NOT NULL,
    data_subjects TEXT[] NOT NULL, -- Array of data subject types
    processing_activities TEXT[] NOT NULL, -- Array of processing activities
    international_transfer BOOLEAN DEFAULT FALSE,
    automated_decision_making BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert standard data classifications for Brazilian market
INSERT INTO data_classification (
    data_category,
    sensitivity_level,
    retention_period_months,
    legal_basis,
    purpose,
    data_subjects,
    processing_activities,
    international_transfer,
    automated_decision_making
) VALUES
-- User personal data
(
    'user_personal_data',
    'confidential',
    60, -- 5 years
    'Art. 7º, I - consentimento do titular',
    'Cadastro e autenticação de usuários na plataforma',
    ARRAY['usuários da plataforma'],
    ARRAY['coleta', 'armazenamento', 'processamento', 'transmissão'],
    FALSE,
    FALSE
),
-- Client business data
(
    'client_business_data',
    'confidential',
    84, -- 7 years (business records retention)
    'Art. 7º, IV - para o atendimento de interesses legítimos',
    'Gestão de relacionamento comercial e propostas',
    ARRAY['clientes empresariais', 'representantes legais'],
    ARRAY['coleta', 'armazenamento', 'processamento', 'transmissão', 'análise'],
    FALSE,
    TRUE
),
-- Financial data
(
    'financial_data',
    'restricted',
    120, -- 10 years (tax and accounting requirements)
    'Art. 7º, II - para o cumprimento de obrigação legal',
    'Cumprimento de obrigações fiscais e contábeis',
    ARRAY['clientes', 'usuários'],
    ARRAY['coleta', 'armazenamento', 'processamento', 'transmissão'],
    FALSE,
    FALSE
),
-- Proposal documents
(
    'proposal_documents',
    'internal',
    36, -- 3 years
    'Art. 7º, IV - para o atendimento de interesses legítimos',
    'Gestão de propostas comerciais e contratos',
    ARRAY['clientes', 'prospects'],
    ARRAY['coleta', 'armazenamento', 'processamento', 'transmissão'],
    FALSE,
    TRUE
),
-- Activity logs
(
    'activity_logs',
    'internal',
    24, -- 2 years
    'Art. 7º, IV - para o atendimento de interesses legítimos',
    'Auditoria e segurança da plataforma',
    ARRAY['usuários', 'clientes'],
    ARRAY['coleta', 'armazenamento', 'análise'],
    FALSE,
    TRUE
);

-- Data subject rights requests tracking
CREATE TABLE IF NOT EXISTS data_subject_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN (
        'access', 'rectification', 'deletion', 'portability',
        'restriction', 'objection', 'withdraw_consent', 'information'
    )),
    data_subject_email CITEXT NOT NULL,
    data_subject_name VARCHAR(255),
    data_subject_document VARCHAR(20), -- CPF/CNPJ for identification
    request_details TEXT NOT NULL,
    legal_basis_claimed TEXT,
    status VARCHAR(20) DEFAULT 'received' CHECK (status IN (
        'received', 'under_review', 'approved', 'partially_approved',
        'denied', 'completed', 'cancelled'
    )),
    received_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 days'), -- LGPD 15-day response requirement
    completed_date TIMESTAMP WITH TIME ZONE,
    response_details TEXT,
    evidence_files TEXT[], -- Array of file references
    assigned_to UUID REFERENCES users(id),
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes for data subject requests
CREATE INDEX idx_data_subject_requests_organization ON data_subject_requests(organization_id);
CREATE INDEX idx_data_subject_requests_type ON data_subject_requests(request_type);
CREATE INDEX idx_data_subject_requests_status ON data_subject_requests(status);
CREATE INDEX idx_data_subject_requests_due_date ON data_subject_requests(due_date) WHERE status NOT IN ('completed', 'cancelled');
CREATE INDEX idx_data_subject_requests_email ON data_subject_requests(data_subject_email);
CREATE INDEX idx_data_subject_requests_document ON data_subject_requests(data_subject_document) WHERE data_subject_document IS NOT NULL;

COMMENT ON TABLE data_subject_requests IS 'LGPD data subject rights requests tracking and management';

-- Enhanced audit log with data classification
ALTER TABLE audit.data_access_log ADD COLUMN IF NOT EXISTS data_categories TEXT[];
ALTER TABLE audit.data_access_log ADD COLUMN IF NOT EXISTS legal_basis TEXT;
ALTER TABLE audit.data_access_log ADD COLUMN IF NOT EXISTS processing_purpose TEXT;
ALTER TABLE audit.data_access_log ADD COLUMN IF NOT EXISTS data_classification_id UUID REFERENCES data_classification(id);

-- ============================================================================
-- BRAZILIAN BUSINESS LOGIC ENHANCEMENTS
-- ============================================================================

-- Brazilian states table for address validation
CREATE TABLE IF NOT EXISTS brazilian_states (
    code VARCHAR(2) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    region VARCHAR(20) NOT NULL CHECK (region IN ('Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul')),
    capital VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Brazilian states
INSERT INTO brazilian_states (code, name, region, capital, timezone) VALUES
('AC', 'Acre', 'Norte', 'Rio Branco', 'America/Rio_Branco'),
('AL', 'Alagoas', 'Nordeste', 'Maceió', 'America/Maceio'),
('AP', 'Amapá', 'Norte', 'Macapá', 'America/Belem'),
('AM', 'Amazonas', 'Norte', 'Manaus', 'America/Manaus'),
('BA', 'Bahia', 'Nordeste', 'Salvador', 'America/Bahia'),
('CE', 'Ceará', 'Nordeste', 'Fortaleza', 'America/Fortaleza'),
('DF', 'Distrito Federal', 'Centro-Oeste', 'Brasília', 'America/Sao_Paulo'),
('ES', 'Espírito Santo', 'Sudeste', 'Vitória', 'America/Sao_Paulo'),
('GO', 'Goiás', 'Centro-Oeste', 'Goiânia', 'America/Sao_Paulo'),
('MA', 'Maranhão', 'Nordeste', 'São Luís', 'America/Fortaleza'),
('MT', 'Mato Grosso', 'Centro-Oeste', 'Cuiabá', 'America/Cuiaba'),
('MS', 'Mato Grosso do Sul', 'Centro-Oeste', 'Campo Grande', 'America/Campo_Grande'),
('MG', 'Minas Gerais', 'Sudeste', 'Belo Horizonte', 'America/Sao_Paulo'),
('PA', 'Pará', 'Norte', 'Belém', 'America/Belem'),
('PB', 'Paraíba', 'Nordeste', 'João Pessoa', 'America/Fortaleza'),
('PR', 'Paraná', 'Sul', 'Curitiba', 'America/Sao_Paulo'),
('PE', 'Pernambuco', 'Nordeste', 'Recife', 'America/Recife'),
('PI', 'Piauí', 'Nordeste', 'Teresina', 'America/Fortaleza'),
('RJ', 'Rio de Janeiro', 'Sudeste', 'Rio de Janeiro', 'America/Sao_Paulo'),
('RN', 'Rio Grande do Norte', 'Nordeste', 'Natal', 'America/Fortaleza'),
('RS', 'Rio Grande do Sul', 'Sul', 'Porto Alegre', 'America/Sao_Paulo'),
('RO', 'Rondônia', 'Norte', 'Porto Velho', 'America/Porto_Velho'),
('RR', 'Roraima', 'Norte', 'Boa Vista', 'America/Boa_Vista'),
('SC', 'Santa Catarina', 'Sul', 'Florianópolis', 'America/Sao_Paulo'),
('SP', 'São Paulo', 'Sudeste', 'São Paulo', 'America/Sao_Paulo'),
('SE', 'Sergipe', 'Nordeste', 'Aracaju', 'America/Maceio'),
('TO', 'Tocantins', 'Norte', 'Palmas', 'America/Araguaina')
ON CONFLICT (code) DO NOTHING;

-- Brazilian CEP (postal code) validation function
CREATE OR REPLACE FUNCTION validate_brazilian_cep(cep TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    clean_cep TEXT;
BEGIN
    IF cep IS NULL THEN
        RETURN TRUE; -- Allow NULL CEP
    END IF;

    -- Remove non-numeric characters
    clean_cep := regexp_replace(cep, '[^0-9]', '', 'g');

    -- Check length and format
    RETURN length(clean_cep) = 8 AND clean_cep ~ '^[0-9]{8}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Format Brazilian CEP for display
CREATE OR REPLACE FUNCTION format_brazilian_cep(cep TEXT)
RETURNS TEXT AS $$
DECLARE
    clean_cep TEXT;
BEGIN
    IF cep IS NULL THEN
        RETURN NULL;
    END IF;

    clean_cep := regexp_replace(cep, '[^0-9]', '', 'g');

    IF length(clean_cep) = 8 THEN
        RETURN substring(clean_cep, 1, 5) || '-' || substring(clean_cep, 6, 3);
    ELSE
        RETURN clean_cep;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Brazilian phone number validation and formatting
CREATE OR REPLACE FUNCTION validate_brazilian_phone(phone TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    clean_phone TEXT;
    phone_length INTEGER;
BEGIN
    IF phone IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Remove non-numeric characters
    clean_phone := regexp_replace(phone, '[^0-9]', '', 'g');
    phone_length := length(clean_phone);

    -- Valid lengths: 10 digits (landline) or 11 digits (mobile with 9)
    -- With country code: 12 digits (landline) or 13 digits (mobile)
    RETURN phone_length IN (10, 11, 12, 13);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- UPDATE EXISTING CONSTRAINTS
-- ============================================================================

-- Update clients table to use enhanced validation
DO $$
BEGIN
    -- Drop old constraint if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'valid_document'
        AND table_name = 'clients'
    ) THEN
        ALTER TABLE clients DROP CONSTRAINT valid_document;
    END IF;

    -- Add new enhanced constraint
    ALTER TABLE clients ADD CONSTRAINT valid_document
        CHECK (document IS NULL OR validate_cpf_cnpj(document));

    -- Add CEP validation if postal_code column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clients'
        AND column_name = 'postal_code'
    ) THEN
        ALTER TABLE clients ADD CONSTRAINT valid_postal_code
            CHECK (postal_code IS NULL OR validate_brazilian_cep(postal_code));
    END IF;

    -- Add state validation if state column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clients'
        AND column_name = 'state'
    ) THEN
        ALTER TABLE clients ADD CONSTRAINT valid_state
            CHECK (state IS NULL OR EXISTS (SELECT 1 FROM brazilian_states WHERE code = state));
    END IF;

    -- Add phone validation if phone column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clients'
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE clients ADD CONSTRAINT valid_phone
            CHECK (phone IS NULL OR validate_brazilian_phone(phone));
    END IF;
END $$;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Trigger for data_classification updated_at
CREATE TRIGGER update_data_classification_updated_at
    BEFORE UPDATE ON data_classification
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for data_subject_requests updated_at
CREATE TRIGGER update_data_subject_requests_updated_at
    BEFORE UPDATE ON data_subject_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ENHANCED SECURITY PERMISSIONS
-- ============================================================================

-- Grant permissions for new tables to application role
GRANT SELECT, INSERT, UPDATE, DELETE ON data_classification TO orcamentos_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON data_subject_requests TO orcamentos_app;
GRANT SELECT ON brazilian_states TO orcamentos_app;

-- Grant read-only access to readonly role
GRANT SELECT ON data_classification TO orcamentos_readonly;
GRANT SELECT ON data_subject_requests TO orcamentos_readonly;
GRANT SELECT ON brazilian_states TO orcamentos_readonly;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO orcamentos_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO orcamentos_readonly;

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Update migration record with completion time
UPDATE maintenance.migration_history
SET execution_time_ms = EXTRACT(EPOCH FROM (NOW() - applied_at)) * 1000
WHERE version = '002';

-- Record successful enhancement
INSERT INTO maintenance.health_checks (check_name, status, details)
VALUES (
    'brazilian_compliance_migration_002',
    'healthy',
    jsonb_build_object(
        'message', 'Enhanced Brazilian compliance features implemented successfully',
        'enhanced_functions', 6,
        'new_tables', 3,
        'validation_constraints', 4,
        'data_classifications', 5
    )
);

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

\echo 'Enhanced Brazilian compliance migration completed successfully!'
\echo ''
\echo 'New features:'
\echo '- Complete CPF/CNPJ validation with check digits'
\echo '- LGPD data classification and retention policies'
\echo '- Data subject rights request tracking'
\echo '- Brazilian states and address validation'
\echo '- Enhanced audit logging with data categories'
\echo ''
\echo 'Testing enhanced validation:'

-- Test CPF validation
SELECT
    'CPF Validation Tests' as test_category,
    validate_cpf('12345678901') as invalid_cpf,
    validate_cpf('11111111111') as invalid_same_digits,
    format_cpf_cnpj('12345678901') as formatted_cpf;

-- Test CNPJ validation
SELECT
    'CNPJ Validation Tests' as test_category,
    validate_cnpj('12345678000195') as test_cnpj,
    format_cpf_cnpj('12345678000195') as formatted_cnpj;

-- Show data classifications
SELECT
    'Data Classifications' as info,
    COUNT(*) as total_classifications
FROM data_classification;

-- Show Brazilian states
SELECT
    'Brazilian States' as info,
    COUNT(*) as total_states,
    COUNT(DISTINCT region) as regions
FROM brazilian_states;
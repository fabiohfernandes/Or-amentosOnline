-- Migration 005: Correct Proposal Platform Schema
-- Based on proposal-platform-plan.md specifications

-- Drop existing proposal-related tables if they exist
DROP TABLE IF EXISTS proposal_views CASCADE;
DROP TABLE IF EXISTS client_comments CASCADE;
DROP TABLE IF EXISTS proposals CASCADE;

-- Create proposals table matching exact specification
CREATE TABLE proposals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  proposal_name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  job_name VARCHAR(255) NOT NULL,
  presentation_url TEXT,
  commercial_proposal_url TEXT,
  scope_text TEXT,
  terms_text TEXT,
  client_username VARCHAR(100) UNIQUE NOT NULL,
  client_password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived')),
  proposal_value DECIMAL(10,2) DEFAULT 0,
  deadline DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP NULL
);

-- Create client comments table
CREATE TABLE client_comments (
  id SERIAL PRIMARY KEY,
  proposal_id INTEGER REFERENCES proposals(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create proposal analytics table
CREATE TABLE proposal_views (
  id SERIAL PRIMARY KEY,
  proposal_id INTEGER REFERENCES proposals(id) ON DELETE CASCADE,
  page_name VARCHAR(50),
  viewed_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  session_id VARCHAR(255)
);

-- Create indexes for better performance
CREATE INDEX idx_proposals_user_id ON proposals(user_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_client_username ON proposals(client_username);
CREATE INDEX idx_client_comments_proposal_id ON client_comments(proposal_id);
CREATE INDEX idx_proposal_views_proposal_id ON proposal_views(proposal_id);
CREATE INDEX idx_proposal_views_viewed_at ON proposal_views(viewed_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample proposal for testing
INSERT INTO proposals (
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
  1,
  'Website Desenvolvimento - Empresa ABC',
  'João Silva - Empresa ABC',
  'Site Corporativo Responsivo',
  'https://docs.google.com/presentation/d/1BmzwVEcMk_example/edit?usp=sharing',
  'https://docs.google.com/document/d/1XJe_example_commercial/edit?usp=sharing',
  'Desenvolvimento de website corporativo responsivo incluindo:

• Design responsivo para desktop, tablet e mobile
• Sistema de gerenciamento de conteúdo (CMS)
• Integração com Google Analytics
• Otimização para motores de busca (SEO)
• Formulário de contato com validação
• Galeria de produtos/serviços
• Blog integrado
• Certificado SSL incluído
• Hospedagem por 12 meses

Prazo de entrega: 30 dias úteis
Revisões: Até 3 rodadas de revisão incluídas',
  'Termos e Condições:

PAGAMENTO:
• 50% de entrada para início do projeto
• 50% na entrega final

PRAZO:
• 30 dias úteis após aprovação do briefing
• Prazos podem ser afetados por demora no envio de conteúdo pelo cliente

RESPONSABILIDADES DO CLIENTE:
• Fornecer conteúdo (textos, imagens, logotipos) em até 7 dias
• Feedback das revisões em até 3 dias úteis
• Validação das etapas conforme cronograma

GARANTIA:
• 3 meses de suporte técnico incluído
• Correção de bugs sem custo adicional

PROPRIEDADE:
• Código fonte fica de propriedade do cliente após pagamento integral
• Direitos de uso das imagens/conteúdo são de responsabilidade do cliente

Ao aceitar esta proposta, o cliente concorda com todos os termos descritos.',
  'cliente_abc',
  '$2b$12$LQv3c1yqBwqMpQmXRP8LnO.RT3aqyLjOKq9aqvwNGpU8cRv3WV3K6', -- senha: 123456
  'open',
  15000.00
);

-- Insert sample comment
INSERT INTO client_comments (proposal_id, comment_text) VALUES (
  1,
  'Gostei muito do escopo apresentado. Tenho apenas uma dúvida sobre o prazo - é possível entregar em 25 dias ao invés de 30?'
);

-- Insert sample analytics
INSERT INTO proposal_views (proposal_id, page_name, viewed_at) VALUES
(1, 'apresentacao', NOW() - INTERVAL '2 days'),
(1, 'comercial', NOW() - INTERVAL '2 days'),
(1, 'escopo', NOW() - INTERVAL '1 day'),
(1, 'apresentacao', NOW() - INTERVAL '1 day'),
(1, 'comercial', NOW() - INTERVAL '1 day');

-- Update migration log
INSERT INTO migration_log (version, applied_at) VALUES ('005', NOW());
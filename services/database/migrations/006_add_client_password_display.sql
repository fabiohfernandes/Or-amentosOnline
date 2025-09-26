-- Migration: Add client_password_display column for persistent credentials
-- This allows users to view the client's password for sharing

-- Add the new column
ALTER TABLE proposals
ADD COLUMN client_password_display VARCHAR(255);

-- Add comment explaining the purpose
COMMENT ON COLUMN proposals.client_password_display IS 'Encrypted but retrievable password for client access display purposes';

-- Update existing proposals to have empty display password (they can be updated manually)
UPDATE proposals
SET client_password_display = ''
WHERE client_password_display IS NULL;
/**
 * Brazilian Validation Utilities - ORION Agent
 * Implements CPF, CNPJ, and CEP validation algorithms for Brazilian compliance
 *
 * @description Utility functions for validating Brazilian business documents
 * @author ORION - Backend API Development Specialist
 */

/**
 * Validates a Brazilian CPF (Cadastro de Pessoa Física)
 * @param {string} cpf - The CPF string to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateCPF(cpf) {
  if (!cpf || typeof cpf !== 'string') return false;

  // Remove all non-numeric characters
  const cleanCPF = cpf.replace(/\D/g, '');

  // Check if has 11 digits
  if (cleanCPF.length !== 11) return false;

  // Check for known invalid patterns (all same digits)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let firstDigit = (sum * 10) % 11;
  if (firstDigit === 10) firstDigit = 0;

  if (firstDigit !== parseInt(cleanCPF.charAt(9))) return false;

  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  let secondDigit = (sum * 10) % 11;
  if (secondDigit === 10) secondDigit = 0;

  return secondDigit === parseInt(cleanCPF.charAt(10));
}

/**
 * Validates a Brazilian CNPJ (Cadastro Nacional de Pessoa Jurídica)
 * @param {string} cnpj - The CNPJ string to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateCNPJ(cnpj) {
  if (!cnpj || typeof cnpj !== 'string') return false;

  // Remove all non-numeric characters
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  // Check if has 14 digits
  if (cleanCNPJ.length !== 14) return false;

  // Check for known invalid patterns (all same digits)
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

  // Calculate first check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  let firstDigit = sum % 11;
  firstDigit = firstDigit < 2 ? 0 : 11 - firstDigit;

  if (firstDigit !== parseInt(cleanCNPJ.charAt(12))) return false;

  // Calculate second check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  let secondDigit = sum % 11;
  secondDigit = secondDigit < 2 ? 0 : 11 - secondDigit;

  return secondDigit === parseInt(cleanCNPJ.charAt(13));
}

/**
 * Validates a Brazilian CEP (Código de Endereçamento Postal)
 * @param {string} cep - The CEP string to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateCEP(cep) {
  if (!cep || typeof cep !== 'string') return false;

  // Remove all non-numeric characters
  const cleanCEP = cep.replace(/\D/g, '');

  // Check if has 8 digits
  if (cleanCEP.length !== 8) return false;

  // Check if it's not all zeros or sequential numbers
  if (/^0{8}$/.test(cleanCEP) || /^1{8}$/.test(cleanCEP)) return false;

  return true;
}

/**
 * Formats CPF for display (XXX.XXX.XXX-XX)
 * @param {string} cpf - The CPF string to format
 * @returns {string} - Formatted CPF or original string if invalid
 */
function formatCPF(cpf) {
  if (!cpf) return '';
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length === 11) {
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf;
}

/**
 * Formats CNPJ for display (XX.XXX.XXX/XXXX-XX)
 * @param {string} cnpj - The CNPJ string to format
 * @returns {string} - Formatted CNPJ or original string if invalid
 */
function formatCNPJ(cnpj) {
  if (!cnpj) return '';
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  if (cleanCNPJ.length === 14) {
    return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return cnpj;
}

/**
 * Formats CEP for display (XXXXX-XXX)
 * @param {string} cep - The CEP string to format
 * @returns {string} - Formatted CEP or original string if invalid
 */
function formatCEP(cep) {
  if (!cep) return '';
  const cleanCEP = cep.replace(/\D/g, '');
  if (cleanCEP.length === 8) {
    return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return cep;
}

/**
 * Validates Brazilian phone number (mobile format)
 * @param {string} phone - The phone string to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateBrazilianPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;

  // Remove all non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '');

  // Check if has 10 or 11 digits (with area code)
  if (cleanPhone.length !== 10 && cleanPhone.length !== 11) return false;

  // For 11 digits, the third digit must be 9 (mobile)
  if (cleanPhone.length === 11 && cleanPhone.charAt(2) !== '9') return false;

  // Check if area code is valid (11-99)
  const areaCode = parseInt(cleanPhone.substring(0, 2));
  if (areaCode < 11 || areaCode > 99) return false;

  return true;
}

/**
 * Formats Brazilian phone for display
 * @param {string} phone - The phone string to format
 * @returns {string} - Formatted phone or original string if invalid
 */
function formatBrazilianPhone(phone) {
  if (!phone) return '';
  const cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.length === 11) {
    // Mobile: (XX) 9XXXX-XXXX
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleanPhone.length === 10) {
    // Landline: (XX) XXXX-XXXX
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  return phone;
}

/**
 * Detects document type (CPF or CNPJ) based on content
 * @param {string} document - The document string to analyze
 * @returns {string} - 'cpf', 'cnpj', or 'unknown'
 */
function detectDocumentType(document) {
  if (!document) return 'unknown';

  const clean = document.replace(/\D/g, '');

  if (clean.length === 11) return 'cpf';
  if (clean.length === 14) return 'cnpj';

  return 'unknown';
}

/**
 * Comprehensive document validation (auto-detects CPF or CNPJ)
 * @param {string} document - The document string to validate
 * @returns {object} - Validation result with type and validity
 */
function validateDocument(document) {
  const type = detectDocumentType(document);
  let isValid = false;

  switch (type) {
    case 'cpf':
      isValid = validateCPF(document);
      break;
    case 'cnpj':
      isValid = validateCNPJ(document);
      break;
  }

  return {
    type,
    isValid,
    formatted: isValid ? (type === 'cpf' ? formatCPF(document) : formatCNPJ(document)) : document
  };
}

module.exports = {
  validateCPF,
  validateCNPJ,
  validateCEP,
  formatCPF,
  formatCNPJ,
  formatCEP,
  validateBrazilianPhone,
  formatBrazilianPhone,
  detectDocumentType,
  validateDocument
};
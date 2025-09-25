/**
 * LGPD Compliance Middleware - ORION Agent
 * Brazilian General Data Protection Law (Lei Geral de Proteção de Dados) compliance
 *
 * @description Middleware for LGPD compliance including audit logging and data protection
 * @author ORION - Backend API Development Specialist
 */

const winston = require('winston');

/**
 * Configure LGPD audit logger
 */
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        audit: true,
        ...meta
      });
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // In production, this should write to a secure, append-only file
    new winston.transports.File({
      filename: './logs/lgpd-audit.log',
      options: { flags: 'a' } // append mode
    })
  ]
});

/**
 * Data categories for LGPD classification
 */
const DATA_CATEGORIES = {
  PERSONAL: 'personal', // Nome, email, telefone
  SENSITIVE: 'sensitive', // CPF, CNPJ, documentos
  FINANCIAL: 'financial', // Valores, pagamentos
  BEHAVIORAL: 'behavioral', // Logs de acesso, preferências
  TECHNICAL: 'technical' // IPs, user agents, sessões
};

/**
 * LGPD legal bases for data processing
 */
const LEGAL_BASES = {
  CONSENT: 'consent', // Consentimento
  CONTRACT: 'contract', // Execução de contrato
  LEGAL_OBLIGATION: 'legal_obligation', // Obrigação legal
  VITAL_INTERESTS: 'vital_interests', // Interesses vitais
  PUBLIC_TASK: 'public_task', // Exercício de função pública
  LEGITIMATE_INTERESTS: 'legitimate_interests' // Interesses legítimos
};

/**
 * Data processing operations for audit
 */
const PROCESSING_OPERATIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  EXPORT: 'export',
  SHARE: 'share',
  ANONYMIZE: 'anonymize'
};

/**
 * Identify data categories in request payload
 * @param {Object} data - Request data to analyze
 * @returns {Array} Array of data categories present
 */
function identifyDataCategories(data) {
  const categories = new Set();

  const categoriesMap = {
    [DATA_CATEGORIES.PERSONAL]: ['name', 'email', 'phone', 'address'],
    [DATA_CATEGORIES.SENSITIVE]: ['cpf', 'cnpj', 'document', 'document_type'],
    [DATA_CATEGORIES.FINANCIAL]: ['total_amount', 'subtotal', 'tax_amount', 'discount_amount', 'unit_price'],
    [DATA_CATEGORIES.TECHNICAL]: ['ip', 'user_agent', 'session_id']
  };

  function checkObject(obj, prefix = '') {
    if (!obj || typeof obj !== 'object') return;

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      // Check if key matches any category
      for (const [category, fields] of Object.entries(categoriesMap)) {
        if (fields.some(field => fullKey.toLowerCase().includes(field))) {
          categories.add(category);
        }
      }

      // Recursively check nested objects
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        checkObject(value, fullKey);
      }
    }
  }

  checkObject(data);
  return Array.from(categories);
}

/**
 * Mask sensitive data for logging
 * @param {*} data - Data to mask
 * @returns {*} Masked data
 */
function maskSensitiveData(data) {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = ['cpf', 'cnpj', 'document', 'password', 'token'];
  const masked = JSON.parse(JSON.stringify(data));

  function maskObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveFields.includes(key.toLowerCase())) {
        if (typeof value === 'string' && value.length > 4) {
          obj[key] = value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
        } else {
          obj[key] = '***';
        }
      } else if (typeof value === 'object' && value !== null) {
        maskObject(value);
      }
    }
    return obj;
  }

  return maskObject(masked);
}

/**
 * LGPD Audit Logging Middleware
 * @param {string} operation - Type of data processing operation
 * @param {string} legalBasis - Legal basis for processing
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware
 */
function lgpdAuditLog(operation = PROCESSING_OPERATIONS.READ, legalBasis = LEGAL_BASES.LEGITIMATE_INTERESTS, options = {}) {
  return (req, res, next) => {
    const startTime = Date.now();

    // Store original res.json to intercept response
    const originalJson = res.json;

    res.json = function(data) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Identify data categories in request and response
      const requestCategories = identifyDataCategories(req.body);
      const responseCategories = identifyDataCategories(data);

      // Create audit log entry
      const auditEntry = {
        timestamp: new Date().toISOString(),
        operation,
        legalBasis,
        user: {
          id: req.user?.userId || 'anonymous',
          email: req.user?.email || 'anonymous',
          ip: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('User-Agent')
        },
        request: {
          method: req.method,
          path: req.path,
          params: req.params,
          query: req.query,
          dataCategories: requestCategories,
          body: maskSensitiveData(req.body)
        },
        response: {
          statusCode: res.statusCode,
          dataCategories: responseCategories,
          success: data?.success !== false,
          duration
        },
        compliance: {
          dataRetentionPeriod: options.retentionPeriod || '5 years', // Default Brazilian legal requirement
          purpose: options.purpose || 'Business proposal management',
          dataController: 'OrçamentosOnline Platform',
          dataProcessor: 'ORION Backend API'
        }
      };

      // Log the audit entry
      auditLogger.info('LGPD Data Processing Audit', auditEntry);

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Data retention policy checker
 * @param {Date} createdDate - Date when data was created
 * @param {number} retentionYears - Retention period in years
 * @returns {boolean} True if data should be retained
 */
function shouldRetainData(createdDate, retentionYears = 5) {
  const retentionPeriod = retentionYears * 365 * 24 * 60 * 60 * 1000; // Convert to milliseconds
  const now = new Date();
  const dataAge = now.getTime() - createdDate.getTime();

  return dataAge <= retentionPeriod;
}

/**
 * Anonymize personal data
 * @param {Object} data - Data to anonymize
 * @returns {Object} Anonymized data
 */
function anonymizeData(data) {
  const anonymized = JSON.parse(JSON.stringify(data));

  const personalFields = {
    name: () => 'Anonymized User',
    email: () => 'anonymized@example.com',
    phone: () => '(00) 00000-0000',
    cpf: () => '000.000.000-00',
    cnpj: () => '00.000.000/0000-00',
    document: () => 'ANONYMIZED',
    street: () => 'Anonymized Address',
    number: () => '000',
    complement: () => null,
    neighborhood: () => 'Anonymized',
    city: () => 'Anonymized',
    company: () => 'Anonymized Company'
  };

  function anonymizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    for (const [key, value] of Object.entries(obj)) {
      if (personalFields[key]) {
        obj[key] = personalFields[key]();
      } else if (typeof value === 'object' && value !== null) {
        anonymizeObject(value);
      }
    }
    return obj;
  }

  return anonymizeObject(anonymized);
}

/**
 * LGPD consent validation middleware
 * @param {Array} requiredConsents - List of consent types required
 * @returns {Function} Express middleware
 */
function validateConsent(requiredConsents = []) {
  return (req, res, next) => {
    // In a real implementation, check user's consent status from database
    // For now, we'll assume consent is valid

    req.lgpdConsent = {
      marketing: true,
      analytics: false,
      dataProcessing: true,
      validatedAt: new Date().toISOString()
    };

    // Check if all required consents are present
    const missingConsents = requiredConsents.filter(
      consent => !req.lgpdConsent[consent]
    );

    if (missingConsents.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'LGPD consent required',
        errors: [`Missing consent for: ${missingConsents.join(', ')}`],
        lgpd: {
          consentRequired: true,
          missingConsents,
          rightsInfo: 'You have the right to access, correct, delete, or port your personal data. Contact us at dpo@orcamentos.com'
        }
      });
    }

    next();
  };
}

module.exports = {
  lgpdAuditLog,
  maskSensitiveData,
  shouldRetainData,
  anonymizeData,
  validateConsent,
  identifyDataCategories,
  DATA_CATEGORIES,
  LEGAL_BASES,
  PROCESSING_OPERATIONS,
  auditLogger
};
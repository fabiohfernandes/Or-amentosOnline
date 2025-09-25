/**
 * Validation Middleware - ORION Agent
 * Input validation and sanitization for API endpoints
 *
 * @description Middleware for comprehensive input validation and sanitization
 * @author ORION - Backend API Development Specialist
 */

const Joi = require('joi');
const { validateCPF, validateCNPJ, validateCEP, validateBrazilianPhone } = require('../utils/brazilianValidators');

/**
 * Custom Joi validators for Brazilian documents
 */
const customJoi = Joi.extend({
  type: 'brazilianDocument',
  base: Joi.string(),
  messages: {
    'brazilianDocument.cpf': 'Invalid CPF format',
    'brazilianDocument.cnpj': 'Invalid CNPJ format',
    'brazilianDocument.cep': 'Invalid CEP format',
    'brazilianDocument.phone': 'Invalid Brazilian phone format'
  },
  rules: {
    cpf: {
      validate(value, helpers) {
        if (!validateCPF(value)) {
          return helpers.error('brazilianDocument.cpf');
        }
        return value;
      }
    },
    cnpj: {
      validate(value, helpers) {
        if (!validateCNPJ(value)) {
          return helpers.error('brazilianDocument.cnpj');
        }
        return value;
      }
    },
    cep: {
      validate(value, helpers) {
        if (!validateCEP(value)) {
          return helpers.error('brazilianDocument.cep');
        }
        return value;
      }
    },
    phone: {
      validate(value, helpers) {
        if (!validateBrazilianPhone(value)) {
          return helpers.error('brazilianDocument.phone');
        }
        return value;
      }
    }
  }
});

/**
 * Proposal validation schemas
 */
const proposalSchemas = {
  create: Joi.object({
    title: Joi.string().min(3).max(200).required().trim(),
    description: Joi.string().max(2000).optional().trim(),
    client_id: Joi.number().integer().positive().required(),
    items: Joi.array().items(
      Joi.object({
        description: Joi.string().min(1).max(500).required().trim(),
        quantity: Joi.number().positive().required(),
        unit_price: Joi.number().positive().precision(2).required(),
        total: Joi.number().positive().precision(2).required()
      })
    ).min(1).required(),
    subtotal: Joi.number().positive().precision(2).required(),
    tax_percentage: Joi.number().min(0).max(100).precision(2).default(0),
    tax_amount: Joi.number().min(0).precision(2).default(0),
    discount_percentage: Joi.number().min(0).max(100).precision(2).default(0),
    discount_amount: Joi.number().min(0).precision(2).default(0),
    total_amount: Joi.number().positive().precision(2).required(),
    validity_days: Joi.number().integer().min(1).max(365).default(30),
    status: Joi.string().valid('draft', 'pending', 'approved', 'rejected', 'expired').default('draft'),
    notes: Joi.string().max(1000).optional().trim(),
    payment_terms: Joi.string().max(500).optional().trim()
  }),

  update: Joi.object({
    title: Joi.string().min(3).max(200).optional().trim(),
    description: Joi.string().max(2000).optional().trim(),
    client_id: Joi.number().integer().positive().optional(),
    items: Joi.array().items(
      Joi.object({
        description: Joi.string().min(1).max(500).required().trim(),
        quantity: Joi.number().positive().required(),
        unit_price: Joi.number().positive().precision(2).required(),
        total: Joi.number().positive().precision(2).required()
      })
    ).min(1).optional(),
    subtotal: Joi.number().positive().precision(2).optional(),
    tax_percentage: Joi.number().min(0).max(100).precision(2).optional(),
    tax_amount: Joi.number().min(0).precision(2).optional(),
    discount_percentage: Joi.number().min(0).max(100).precision(2).optional(),
    discount_amount: Joi.number().min(0).precision(2).optional(),
    total_amount: Joi.number().positive().precision(2).optional(),
    validity_days: Joi.number().integer().min(1).max(365).optional(),
    status: Joi.string().valid('draft', 'pending', 'approved', 'rejected', 'expired').optional(),
    notes: Joi.string().max(1000).optional().trim(),
    payment_terms: Joi.string().max(500).optional().trim()
  }),

  list: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('draft', 'pending', 'approved', 'rejected', 'expired').optional(),
    client_id: Joi.number().integer().positive().optional(),
    search: Joi.string().max(100).optional().trim(),
    sort: Joi.string().valid('created_at', 'updated_at', 'title', 'total_amount').default('created_at'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  })
};

/**
 * Client validation schemas
 */
const clientSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(200).required().trim(),
    email: Joi.string().email().required().lowercase().trim(),
    phone: customJoi.brazilianDocument().phone().required(),
    document: Joi.string().required().trim(), // Will validate CPF or CNPJ
    document_type: Joi.string().valid('cpf', 'cnpj').required(),
    address: Joi.object({
      street: Joi.string().min(5).max(200).required().trim(),
      number: Joi.string().max(10).required().trim(),
      complement: Joi.string().max(100).optional().trim(),
      neighborhood: Joi.string().min(2).max(100).required().trim(),
      city: Joi.string().min(2).max(100).required().trim(),
      state: Joi.string().length(2).required().uppercase(),
      cep: customJoi.brazilianDocument().cep().required()
    }).required(),
    company: Joi.string().max(200).optional().trim(),
    notes: Joi.string().max(1000).optional().trim()
  }).custom((value, helpers) => {
    // Validate document based on type
    if (value.document_type === 'cpf' && !validateCPF(value.document)) {
      return helpers.error('Invalid CPF');
    }
    if (value.document_type === 'cnpj' && !validateCNPJ(value.document)) {
      return helpers.error('Invalid CNPJ');
    }
    return value;
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(200).optional().trim(),
    email: Joi.string().email().optional().lowercase().trim(),
    phone: customJoi.brazilianDocument().phone().optional(),
    document: Joi.string().optional().trim(),
    document_type: Joi.string().valid('cpf', 'cnpj').optional(),
    address: Joi.object({
      street: Joi.string().min(5).max(200).optional().trim(),
      number: Joi.string().max(10).optional().trim(),
      complement: Joi.string().max(100).optional().trim(),
      neighborhood: Joi.string().min(2).max(100).optional().trim(),
      city: Joi.string().min(2).max(100).optional().trim(),
      state: Joi.string().length(2).optional().uppercase(),
      cep: customJoi.brazilianDocument().cep().optional()
    }).optional(),
    company: Joi.string().max(200).optional().trim(),
    notes: Joi.string().max(1000).optional().trim()
  }).custom((value, helpers) => {
    // Validate document if both document and document_type are provided
    if (value.document && value.document_type) {
      if (value.document_type === 'cpf' && !validateCPF(value.document)) {
        return helpers.error('Invalid CPF');
      }
      if (value.document_type === 'cnpj' && !validateCNPJ(value.document)) {
        return helpers.error('Invalid CNPJ');
      }
    }
    return value;
  }),

  list: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().max(100).optional().trim(),
    document_type: Joi.string().valid('cpf', 'cnpj').optional(),
    city: Joi.string().max(100).optional().trim(),
    state: Joi.string().length(2).optional().uppercase(),
    sort: Joi.string().valid('created_at', 'updated_at', 'name', 'email').default('name'),
    order: Joi.string().valid('asc', 'desc').default('asc')
  })
};

/**
 * Generic validation middleware
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate (body, query, params)
 * @returns {Function} Express middleware
 */
function validateRequest(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Replace the request property with validated and sanitized data
    req[property] = value;
    next();
  };
}

/**
 * Sanitize input to prevent XSS and injection attacks
 * @param {*} input - Input to sanitize
 * @returns {*} Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '') // Remove basic HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      return input.map(sanitizeInput);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
}

/**
 * Input sanitization middleware
 */
const sanitizeMiddleware = (req, res, next) => {
  req.body = sanitizeInput(req.body);
  req.query = sanitizeInput(req.query);
  req.params = sanitizeInput(req.params);
  next();
};

/**
 * Validate pagination parameters
 */
const validatePagination = validateRequest(Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
}), 'query');

/**
 * Validate ID parameter
 */
const validateIdParam = validateRequest(Joi.object({
  id: Joi.number().integer().positive().required()
}), 'params');

module.exports = {
  proposalSchemas,
  clientSchemas,
  validateRequest,
  sanitizeMiddleware,
  validatePagination,
  validateIdParam,
  customJoi
};
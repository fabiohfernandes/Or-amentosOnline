// OrçamentosOnline Backend API Server
// ORION Agent - Backend Development
// FORTRESS Agent - Security Implementation

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const Redis = require('redis');
const winston = require('winston');

// Import new modules
const { initializeDatabase, checkConnection } = require('./models/database');
const ProposalModel = require('./models/Proposal');
const ClientModel = require('./models/Client');
const {
  proposalSchemas,
  clientSchemas,
  validateRequest,
  sanitizeMiddleware,
  validatePagination,
  validateIdParam
} = require('./middleware/validation');
const {
  lgpdAuditLog,
  PROCESSING_OPERATIONS,
  LEGAL_BASES
} = require('./middleware/lgpd');

// Import proposal platform routes
const { router: proposalPlatformRouter, initializePool } = require('./routes/proposal-platform');
const { router: clientAuthRouter, initializePool: initializeClientPool } = require('./routes/client-auth');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Configure Winston Logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(dbConfig);

// Redis configuration
let redisClient;
if (process.env.REDIS_URL) {
  redisClient = Redis.createClient({
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD
  });

  redisClient.on('error', (err) => logger.error('Redis Client Error', err));
  redisClient.connect().catch(logger.error);
}

// Security middleware - FORTRESS Agent implementation
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    process.env.CORS_ORIGIN
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Rate limiting - FORTRESS Agent security
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes default
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((process.env.RATE_LIMIT_WINDOW || 15) * 60)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization middleware
app.use(sanitizeMiddleware);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`, {
    method: req.method,
    url: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// JWT Authentication middleware - FORTRESS Agent
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Initialize proposal platform routes with database pool
initializePool(pool);
initializeClientPool(pool);

// API Routes

// Mount proposal platform routes
app.use('/api/v1', proposalPlatformRouter);

// Mount client authentication routes
app.use('/api/v1/client', clientAuthRouter);

// Health check endpoint
app.get('/api/v1/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = await checkConnection();

    // Check Redis connection (if available)
    let redisStatus = 'not_configured';
    if (redisClient) {
      try {
        await redisClient.ping();
        redisStatus = 'connected';
      } catch (error) {
        redisStatus = 'error';
      }
    }

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'orcamentos-online-api',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
      redis: {
        status: redisStatus
      },
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Authentication endpoints
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Check if user exists in database
    const userQuery = await pool.query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errors: ['Email or password is incorrect']
      });
    }

    const user = userQuery.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errors: ['Email or password is incorrect']
      });
    }

    // Generate JWT tokens
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        tokens: {
          accessToken: token,
          refreshToken: refreshToken,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
          expiresIn: 900
        }
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User registration endpoint
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['Name, email, phone, and password are required']
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['Invalid email format']
      });
    }

    // Phone validation (Brazilian format)
    const phoneRegex = /^\(\d{2}\)\s9\d{4}-\d{4}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['Invalid phone format. Use (XX) 9XXXX-XXXX']
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['Password must be at least 8 characters long']
      });
    }

    // Check for password complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['Password must contain at least one uppercase letter, one lowercase letter, and one number']
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Registration failed',
        errors: ['User with this email already exists']
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user in database
    const newUser = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, name, email, phone, role, created_at`,
      [name.trim(), email.toLowerCase(), phone, hashedPassword, 'user']
    );

    const user = newUser.rows[0];

    // Generate JWT tokens
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          createdAt: user.created_at
        },
        tokens: {
          accessToken: token,
          refreshToken: refreshToken,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          expiresIn: 900
        }
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);

    // Handle specific database errors
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({
        success: false,
        message: 'Registration failed',
        errors: ['User with this email already exists']
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed',
      errors: ['Internal server error']
    });
  }
});

// Protected route example - GET /api/v1/auth/profile (matching frontend config)
app.get('/api/v1/auth/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      id: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      name: 'User'
    }
  });
});

// Logout endpoint - POST /api/v1/auth/logout
app.post('/api/v1/auth/logout', authenticateToken, (req, res) => {
  // For stateless JWT tokens, logout is handled client-side by removing the token
  // In a production environment, you might want to:
  // 1. Add the token to a blacklist stored in Redis
  // 2. Log the logout event for security auditing

  logger.info(`User logged out: ${req.user.email} (ID: ${req.user.userId})`);

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Refresh token endpoint
app.post('/api/v1/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
        errors: ['refreshToken field is missing']
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret');
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        errors: ['Refresh token is not valid']
      });
    }

    // Check if it's a refresh token
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type',
        errors: ['Token is not a refresh token']
      });
    }

    // Get user from database
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        errors: ['User associated with refresh token does not exist']
      });
    }

    const user = result.rows[0];

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    // Generate new refresh token
    const newRefreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    logger.info(`Token refreshed for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
          expiresIn: 900
        }
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: ['Failed to refresh token']
    });
  }
});

// =================
// PROPOSAL ENDPOINTS - DISABLED (using proposal-platform.js instead)
// =================
/*

// Create new proposal
app.post('/api/v1/proposals',
  authenticateToken,
  lgpdAuditLog(PROCESSING_OPERATIONS.CREATE, LEGAL_BASES.CONTRACT),
  validateRequest(proposalSchemas.create),
  async (req, res) => {
    try {
      const proposal = await ProposalModel.create(req.body, req.user.userId);

      res.status(201).json({
        success: true,
        message: 'Proposal created successfully',
        data: {
          proposal
        }
      });
    } catch (error) {
      logger.error('Error creating proposal:', error);

      if (error.message.includes('violates foreign key constraint')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid client ID',
          errors: ['The specified client does not exist']
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create proposal',
        errors: ['Internal server error']
      });
    }
  }
);

// List proposals with filtering and pagination
app.get('/api/v1/proposals',
  authenticateToken,
  lgpdAuditLog(PROCESSING_OPERATIONS.READ, LEGAL_BASES.LEGITIMATE_INTERESTS),
  validateRequest(proposalSchemas.list, 'query'),
  async (req, res) => {
    try {
      const result = await ProposalModel.list(req.query, req.user.userId);

      res.json({
        success: true,
        message: 'Proposals retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error fetching proposals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch proposals',
        errors: ['Internal server error']
      });
    }
  }
);

// Get specific proposal
app.get('/api/v1/proposals/:id',
  authenticateToken,
  validateIdParam,
  lgpdAuditLog(PROCESSING_OPERATIONS.READ, LEGAL_BASES.LEGITIMATE_INTERESTS),
  async (req, res) => {
    try {
      const proposal = await ProposalModel.findById(req.params.id, req.user.userId);

      if (!proposal) {
        return res.status(404).json({
          success: false,
          message: 'Proposal not found',
          errors: ['Proposal does not exist or you do not have permission to access it']
        });
      }

      res.json({
        success: true,
        message: 'Proposal retrieved successfully',
        data: {
          proposal
        }
      });
    } catch (error) {
      logger.error('Error fetching proposal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch proposal',
        errors: ['Internal server error']
      });
    }
  }
);

// Update proposal
app.put('/api/v1/proposals/:id',
  authenticateToken,
  validateIdParam,
  lgpdAuditLog(PROCESSING_OPERATIONS.UPDATE, LEGAL_BASES.CONTRACT),
  validateRequest(proposalSchemas.update),
  async (req, res) => {
    try {
      const proposal = await ProposalModel.update(req.params.id, req.body, req.user.userId);

      if (!proposal) {
        return res.status(404).json({
          success: false,
          message: 'Proposal not found',
          errors: ['Proposal does not exist or you do not have permission to update it']
        });
      }

      res.json({
        success: true,
        message: 'Proposal updated successfully',
        data: {
          proposal
        }
      });
    } catch (error) {
      logger.error('Error updating proposal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update proposal',
        errors: ['Internal server error']
      });
    }
  }
);

// Delete proposal
app.delete('/api/v1/proposals/:id',
  authenticateToken,
  validateIdParam,
  lgpdAuditLog(PROCESSING_OPERATIONS.DELETE, LEGAL_BASES.LEGITIMATE_INTERESTS),
  async (req, res) => {
    try {
      const success = await ProposalModel.delete(req.params.id, req.user.userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Proposal not found',
          errors: ['Proposal does not exist or you do not have permission to delete it']
        });
      }

      res.json({
        success: true,
        message: 'Proposal deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting proposal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete proposal',
        errors: ['Internal server error']
      });
    }
  }
);

// Duplicate proposal
app.post('/api/v1/proposals/:id/duplicate',
  authenticateToken,
  validateIdParam,
  lgpdAuditLog(PROCESSING_OPERATIONS.CREATE, LEGAL_BASES.CONTRACT),
  async (req, res) => {
    try {
      const proposal = await ProposalModel.duplicate(req.params.id, req.user.userId);

      if (!proposal) {
        return res.status(404).json({
          success: false,
          message: 'Proposal not found',
          errors: ['Proposal does not exist or you do not have permission to duplicate it']
        });
      }

      res.status(201).json({
        success: true,
        message: 'Proposal duplicated successfully',
        data: {
          proposal
        }
      });
    } catch (error) {
      logger.error('Error duplicating proposal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to duplicate proposal',
        errors: ['Internal server error']
      });
    }
  }
);

// Get proposal statistics
app.get('/api/v1/proposals/stats/summary',
  authenticateToken,
  lgpdAuditLog(PROCESSING_OPERATIONS.READ, LEGAL_BASES.LEGITIMATE_INTERESTS),
  async (req, res) => {
    try {
      const stats = await ProposalModel.getStats(req.user.userId);

      res.json({
        success: true,
        message: 'Proposal statistics retrieved successfully',
        data: {
          stats
        }
      });
    } catch (error) {
      logger.error('Error fetching proposal statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch proposal statistics',
        errors: ['Internal server error']
      });
    }
  }
);
*/

// =================
// CLIENT ENDPOINTS
// =================

// Create new client
app.post('/api/v1/clients',
  authenticateToken,
  lgpdAuditLog(PROCESSING_OPERATIONS.CREATE, LEGAL_BASES.CONTRACT),
  validateRequest(clientSchemas.create),
  async (req, res) => {
    try {
      const client = await ClientModel.create(req.body, req.user.userId);

      res.status(201).json({
        success: true,
        message: 'Client created successfully',
        data: {
          client
        }
      });
    } catch (error) {
      logger.error('Error creating client:', error);

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: 'Client creation failed',
          errors: [error.message]
        });
      }

      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [error.message]
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create client',
        errors: ['Internal server error']
      });
    }
  }
);

// List clients with filtering and pagination
app.get('/api/v1/clients',
  authenticateToken,
  lgpdAuditLog(PROCESSING_OPERATIONS.READ, LEGAL_BASES.LEGITIMATE_INTERESTS),
  validateRequest(clientSchemas.list, 'query'),
  async (req, res) => {
    try {
      const result = await ClientModel.list(req.query, req.user.userId);

      res.json({
        success: true,
        message: 'Clients retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error fetching clients:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch clients',
        errors: ['Internal server error']
      });
    }
  }
);

// Get specific client
app.get('/api/v1/clients/:id',
  authenticateToken,
  validateIdParam,
  lgpdAuditLog(PROCESSING_OPERATIONS.READ, LEGAL_BASES.LEGITIMATE_INTERESTS),
  async (req, res) => {
    try {
      const client = await ClientModel.findById(req.params.id, req.user.userId);

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found',
          errors: ['Client does not exist or you do not have permission to access it']
        });
      }

      res.json({
        success: true,
        message: 'Client retrieved successfully',
        data: {
          client
        }
      });
    } catch (error) {
      logger.error('Error fetching client:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch client',
        errors: ['Internal server error']
      });
    }
  }
);

// Update client
app.put('/api/v1/clients/:id',
  authenticateToken,
  validateIdParam,
  lgpdAuditLog(PROCESSING_OPERATIONS.UPDATE, LEGAL_BASES.CONTRACT),
  validateRequest(clientSchemas.update),
  async (req, res) => {
    try {
      const client = await ClientModel.update(req.params.id, req.body, req.user.userId);

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found',
          errors: ['Client does not exist or you do not have permission to update it']
        });
      }

      res.json({
        success: true,
        message: 'Client updated successfully',
        data: {
          client
        }
      });
    } catch (error) {
      logger.error('Error updating client:', error);

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: 'Client update failed',
          errors: [error.message]
        });
      }

      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [error.message]
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update client',
        errors: ['Internal server error']
      });
    }
  }
);

// Delete client
app.delete('/api/v1/clients/:id',
  authenticateToken,
  validateIdParam,
  lgpdAuditLog(PROCESSING_OPERATIONS.DELETE, LEGAL_BASES.LEGITIMATE_INTERESTS),
  async (req, res) => {
    try {
      const success = await ClientModel.delete(req.params.id, req.user.userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Client not found',
          errors: ['Client does not exist or you do not have permission to delete it']
        });
      }

      res.json({
        success: true,
        message: 'Client deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting client:', error);

      if (error.message.includes('Cannot delete client')) {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete client',
          errors: [error.message]
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete client',
        errors: ['Internal server error']
      });
    }
  }
);

// Search clients
app.get('/api/v1/clients/search',
  authenticateToken,
  lgpdAuditLog(PROCESSING_OPERATIONS.READ, LEGAL_BASES.LEGITIMATE_INTERESTS),
  async (req, res) => {
    try {
      const { q, limit = 10 } = req.query;

      if (!q || q.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query required',
          errors: ['Search query must be at least 2 characters long']
        });
      }

      const clients = await ClientModel.search(q, req.user.userId, parseInt(limit));

      res.json({
        success: true,
        message: 'Search completed successfully',
        data: {
          clients,
          query: q,
          count: clients.length
        }
      });
    } catch (error) {
      logger.error('Error searching clients:', error);
      res.status(500).json({
        success: false,
        message: 'Search failed',
        errors: ['Internal server error']
      });
    }
  }
);

// Get client statistics
app.get('/api/v1/clients/stats/summary',
  authenticateToken,
  lgpdAuditLog(PROCESSING_OPERATIONS.READ, LEGAL_BASES.LEGITIMATE_INTERESTS),
  async (req, res) => {
    try {
      const stats = await ClientModel.getStats(req.user.userId);

      res.json({
        success: true,
        message: 'Client statistics retrieved successfully',
        data: {
          stats
        }
      });
    } catch (error) {
      logger.error('Error fetching client statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch client statistics',
        errors: ['Internal server error']
      });
    }
  }
);

// API documentation endpoint
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'OrçamentosOnline API',
    version: '1.0.0',
    description: 'Budget Management System API',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: 'GET /api/v1/health',
      auth: {
        login: 'POST /api/v1/auth/login',
        register: 'POST /api/v1/auth/register',
        logout: 'POST /api/v1/auth/logout',
        profile: 'GET /api/v1/auth/profile'
      },
      proposals: {
        list: 'GET /api/v1/proposals',
        create: 'POST /api/v1/proposals',
        get: 'GET /api/v1/proposals/:id',
        update: 'PUT /api/v1/proposals/:id',
        delete: 'DELETE /api/v1/proposals/:id',
        duplicate: 'POST /api/v1/proposals/:id/duplicate',
        stats: 'GET /api/v1/proposals/stats/summary'
      },
      clients: {
        list: 'GET /api/v1/clients',
        create: 'POST /api/v1/clients',
        get: 'GET /api/v1/clients/:id',
        update: 'PUT /api/v1/clients/:id',
        delete: 'DELETE /api/v1/clients/:id',
        search: 'GET /api/v1/clients/search',
        stats: 'GET /api/v1/clients/stats/summary'
      }
    },
    note: 'Register users or use existing database credentials to login'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    message: 'Check /api/v1 for available endpoints'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

  if (redisClient) {
    await redisClient.quit();
  }

  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');

  if (redisClient) {
    await redisClient.quit();
  }

  await pool.end();
  process.exit(0);
});

// Initialize database and start server
(async () => {
  try {
    // Database tables already initialized via migration
    // await initializeDatabase();
    logger.info('Using existing database schema');

    // Start server
    app.listen(port, () => {
      logger.info(`🚀 OrçamentosOnline API server started on port ${port}`, {
        port,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid
      });
    });
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
})();

module.exports = app;
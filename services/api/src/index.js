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
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
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

// API Routes

// Health check endpoint
app.get('/api/v1/health', async (req, res) => {
  try {
    // Check database connection
    const dbResult = await pool.query('SELECT NOW()');

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
      database: {
        status: 'connected',
        timestamp: dbResult.rows[0].now
      },
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

    // For Phase 1 testing - create a demo user
    if (email === 'demo@orcamentos.com' && password === 'demo123') {
      const user = {
        id: 1,
        email: 'demo@orcamentos.com',
        name: 'Demo User',
        role: 'admin'
      };

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
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errors: ['Use demo@orcamentos.com / demo123 for Phase 1 testing']
      });
    }
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
      name: req.user.email === 'demo@orcamentos.com' ? 'Demo User' : 'User'
    }
  });
});

// Proposals endpoints (Phase 1 basic structure)
app.get('/api/v1/proposals', authenticateToken, async (req, res) => {
  try {
    // For Phase 1 - return mock data
    const mockProposals = [
      {
        id: '1',
        title: 'Orçamento Website Corporativo',
        client: 'Empresa ABC Ltda',
        total: 15000.00,
        status: 'draft',
        createdAt: '2025-09-20T10:00:00Z',
        updatedAt: '2025-09-22T14:30:00Z'
      },
      {
        id: '2',
        title: 'Sistema E-commerce',
        client: 'Loja XYZ',
        total: 25000.00,
        status: 'pending',
        createdAt: '2025-09-18T08:15:00Z',
        updatedAt: '2025-09-23T09:45:00Z'
      }
    ];

    res.json({
      success: true,
      message: 'Proposals retrieved successfully',
      data: {
        proposals: mockProposals,
        total: mockProposals.length,
        page: parseInt(req.query.page || '1'),
        limit: parseInt(req.query.limit || '20')
      }
    });
  } catch (error) {
    logger.error('Error fetching proposals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch proposals',
      errors: ['Internal server error']
    });
  }
});

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
        login: 'POST /api/v1/auth/login'
      },
      user: {
        profile: 'GET /api/v1/user/profile'
      },
      budgets: {
        list: 'GET /api/v1/budgets'
      }
    },
    demo_credentials: {
      email: 'demo@orcamentos.com',
      password: 'demo123'
    }
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

// Start server
app.listen(port, () => {
  logger.info(`🚀 OrçamentosOnline API server started on port ${port}`, {
    port,
    environment: process.env.NODE_ENV || 'development',
    pid: process.pid
  });
});

module.exports = app;
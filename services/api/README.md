# OrçamentosOnline Backend API

**ORION Agent - Backend API Development Specialist**
**Phase 2 Implementation Complete**

## Overview

Comprehensive REST API for the OrçamentosOnline platform with Brazilian business compliance, featuring proposal management, client management, LGPD compliance, and complete audit logging.

## Features

### ✅ Core Functionality
- **Client Management**: Full CRUD operations with Brazilian document validation
- **Proposal Management**: Complete proposal lifecycle management
- **Brazilian Validation**: CPF, CNPJ, CEP, and phone validation
- **LGPD Compliance**: Comprehensive data protection and audit logging
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive input sanitization and validation

### ✅ Security Features
- Rate limiting (100 requests per 15 minutes)
- JWT authentication with short-lived tokens
- Input sanitization to prevent XSS
- SQL injection protection with parameterized queries
- CORS configuration
- Helmet.js security headers
- Password complexity requirements
- Error message sanitization

### ✅ Brazilian Business Compliance
- **CPF Validation**: Complete validation algorithm implementation
- **CNPJ Validation**: Complete validation algorithm implementation
- **CEP Validation**: Brazilian postal code validation
- **Phone Validation**: Brazilian mobile and landline validation
- **Document Formatting**: Automatic formatting for display
- **LGPD Compliance**: Full Brazilian data protection law compliance

### ✅ Database Integration
- PostgreSQL with connection pooling
- Transaction support
- Automated table creation
- Database health monitoring
- Query logging and performance tracking

### ✅ API Endpoints

#### Authentication
- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/profile` - Get user profile

#### Client Management
- `POST /api/v1/clients` - Create client
- `GET /api/v1/clients` - List clients (with pagination/filtering)
- `GET /api/v1/clients/:id` - Get specific client
- `PUT /api/v1/clients/:id` - Update client
- `DELETE /api/v1/clients/:id` - Delete client
- `GET /api/v1/clients/search` - Search clients
- `GET /api/v1/clients/stats/summary` - Client statistics

#### Proposal Management
- `POST /api/v1/proposals` - Create proposal
- `GET /api/v1/proposals` - List proposals (with pagination/filtering)
- `GET /api/v1/proposals/:id` - Get specific proposal
- `PUT /api/v1/proposals/:id` - Update proposal
- `DELETE /api/v1/proposals/:id` - Delete proposal
- `POST /api/v1/proposals/:id/duplicate` - Duplicate proposal
- `GET /api/v1/proposals/stats/summary` - Proposal statistics

#### System
- `GET /api/v1/health` - System health check
- `GET /api/v1` - API documentation

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis (optional)
- **Authentication**: JWT tokens
- **Validation**: Joi with custom Brazilian validators
- **Logging**: Winston with structured logging
- **Security**: Helmet.js, express-rate-limit, CORS
- **Testing**: Custom integration test suite

## Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**:
   - Ensure PostgreSQL is running
   - Database tables are created automatically on first run

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Start Production Server**:
   ```bash
   npm start
   ```

## Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/orcamentos_db

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=7d

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3001
```

## Testing

### Integration Tests
Run comprehensive API integration tests:
```bash
npm run test:integration
```

This will test all endpoints with:
- Authentication flow
- Client CRUD operations
- Proposal CRUD operations
- Brazilian document validation
- Search functionality
- Statistics endpoints
- Error handling

### Manual Testing
Use the provided demo credentials:
```json
{
  "email": "demo@orcamentos.com",
  "password": "demo123"
}
```

## API Documentation

Complete API documentation is available at:
- **File**: `API_DOCUMENTATION.md`
- **Endpoint**: `GET /api/v1` (when server is running)

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Clients Table
```sql
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  document VARCHAR(20) NOT NULL,
  document_type VARCHAR(10) NOT NULL CHECK (document_type IN ('cpf', 'cnpj')),
  company VARCHAR(200),
  address_street VARCHAR(200),
  address_number VARCHAR(10),
  address_complement VARCHAR(100),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_cep VARCHAR(10),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Proposals Table
```sql
CREATE TABLE proposals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  client_id INTEGER NOT NULL REFERENCES clients(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_percentage DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  validity_days INTEGER DEFAULT 30,
  expires_at TIMESTAMP,
  notes TEXT,
  payment_terms TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Proposal Items Table
```sql
CREATE TABLE proposal_items (
  id SERIAL PRIMARY KEY,
  proposal_id INTEGER NOT NULL REFERENCES proposals(id),
  description VARCHAR(500) NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## LGPD Compliance

### Audit Logging
All data operations are automatically logged with:
- User identification
- Operation type (create, read, update, delete)
- Data categories involved (personal, sensitive, financial)
- Legal basis for processing
- Timestamp and IP address
- Retention period information

### Data Categories
- **Personal**: Name, email, phone
- **Sensitive**: CPF, CNPJ, documents
- **Financial**: Proposal values, payments
- **Technical**: IPs, user agents, sessions

### Data Rights Support
The API supports LGPD data subject rights:
- Right to access personal data
- Right to correct inaccurate data
- Right to delete personal data
- Right to data portability
- Right to restrict processing
- Right to object to processing

## Brazilian Document Validation

### CPF (Cadastro de Pessoa Física)
- 11-digit validation algorithm
- Check digit verification
- Format support: `123.456.789-01` or `12345678901`
- Invalid pattern detection (all same digits)

### CNPJ (Cadastro Nacional de Pessoa Jurídica)
- 14-digit validation algorithm
- Check digit verification
- Format support: `12.345.678/0001-90` or `12345678000190`
- Invalid pattern detection (all same digits)

### CEP (Código de Endereçamento Postal)
- 8-digit Brazilian postal code validation
- Format support: `12345-678` or `12345678`
- Invalid pattern detection

### Brazilian Phone
- Mobile: 11 digits `(11) 99999-9999`
- Landline: 10 digits `(11) 9999-9999`
- Area code validation (11-99)

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error message"]
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

## Performance Features

- **Connection Pooling**: PostgreSQL connection pooling with configurable limits
- **Query Optimization**: Indexed columns for fast lookups
- **Caching**: Redis support for session management
- **Compression**: Response compression with gzip
- **Rate Limiting**: Request rate limiting to prevent abuse

## Logging

Structured logging with Winston:
- **Application logs**: General application events
- **Database logs**: Query performance and errors
- **LGPD audit logs**: Data processing operations
- **Security logs**: Authentication and authorization events

## Development

### File Structure
```
src/
├── index.js                 # Main application entry point
├── middleware/
│   ├── validation.js        # Input validation middleware
│   └── lgpd.js             # LGPD compliance middleware
├── models/
│   ├── database.js         # Database connection and utilities
│   ├── Client.js           # Client model and operations
│   └── Proposal.js         # Proposal model and operations
├── utils/
│   └── brazilianValidators.js # Brazilian document validators
├── test/
│   └── api-test.js         # Integration test suite
└── logs/                   # Log files directory
```

### Code Quality
- **ESLint**: Code linting and formatting
- **Input validation**: Comprehensive validation with Joi
- **Error handling**: Proper error handling throughout
- **Documentation**: Comprehensive inline documentation
- **Testing**: Integration test coverage

## Production Deployment

### Requirements
- Node.js 18+
- PostgreSQL 12+
- Redis 6+ (optional)
- SSL certificate (for HTTPS)

### Environment Setup
1. Set `NODE_ENV=production`
2. Use secure, random JWT secrets
3. Configure proper database credentials
4. Set up SSL/TLS termination
5. Configure log rotation
6. Set up monitoring and alerting

### Security Checklist
- [ ] Use HTTPS in production
- [ ] Secure JWT secrets
- [ ] Database user with minimal permissions
- [ ] Enable database SSL
- [ ] Configure proper CORS origins
- [ ] Set up log monitoring
- [ ] Enable rate limiting
- [ ] Regular security updates

## Support

### Demo Environment
- **Base URL**: `http://localhost:3000/api/v1`
- **Demo Credentials**: `demo@orcamentos.com` / `demo123`

### Integration Support
- Full API documentation available
- Integration test suite provided
- Brazilian validation utilities included
- LGPD compliance built-in

---

**Phase 2 Backend Implementation Complete** ✅
**Implemented by ORION Agent - Backend API Development Specialist**
**OrçamentosOnline Platform - AI-Driven Proposal Management System**
# OrçamentosOnline API Documentation

**Version:** 2.0.0
**ORION Agent - Backend API Development Specialist**

## Overview

The OrçamentosOnline API is a comprehensive REST API for managing business proposals and clients with Brazilian business compliance. It includes LGPD (Brazilian GDPR) compliance features, Brazilian document validation, and complete audit logging.

## Base URL

```
Development: http://localhost:3000/api/v1
Production: https://api.orcamentos.com/api/v1
```

## Authentication

All endpoints (except health check and documentation) require JWT authentication.

### Headers Required:
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

### Authentication Endpoints:

#### POST /auth/login
Authenticate user and receive JWT tokens.

**Request Body:**
```json
{
  "email": "demo@orcamentos.com",
  "password": "demo123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "demo@orcamentos.com",
      "name": "Demo User",
      "role": "admin"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2025-09-25T15:30:00Z",
      "expiresIn": 900
    }
  }
}
```

#### POST /auth/register
Register new user account.

**Request Body:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "(11) 99999-9999",
  "password": "MinhaSenh@123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": 2,
      "email": "joao@example.com",
      "name": "João Silva",
      "phone": "(11) 99999-9999",
      "role": "user",
      "createdAt": "2025-09-25T14:30:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2025-09-25T15:30:00Z",
      "expiresIn": 900
    }
  }
}
```

---

## Client Management

### POST /clients
Create a new client with Brazilian document validation.

**Request Body:**
```json
{
  "name": "Empresa ABC Ltda",
  "email": "contato@empresaabc.com.br",
  "phone": "(11) 99999-9999",
  "document": "12.345.678/0001-90",
  "document_type": "cnpj",
  "company": "Empresa ABC Ltda",
  "address": {
    "street": "Rua das Flores, 123",
    "number": "123",
    "complement": "Sala 456",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "cep": "01234-567"
  },
  "notes": "Cliente preferencial"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Client created successfully",
  "data": {
    "client": {
      "id": 1,
      "user_id": 1,
      "name": "Empresa ABC Ltda",
      "email": "contato@empresaabc.com.br",
      "phone": "11999999999",
      "phone_formatted": "(11) 99999-9999",
      "document": "12345678000190",
      "document_formatted": "12.345.678/0001-90",
      "document_type": "cnpj",
      "company": "Empresa ABC Ltda",
      "address": {
        "street": "Rua das Flores, 123",
        "number": "123",
        "complement": "Sala 456",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "cep": "01234567",
        "cep_formatted": "01234-567"
      },
      "notes": "Cliente preferencial",
      "is_active": true,
      "created_at": "2025-09-25T14:30:00Z",
      "updated_at": "2025-09-25T14:30:00Z"
    }
  }
}
```

### GET /clients
List clients with pagination and filtering.

**Query Parameters:**
- `page` (integer, default: 1): Page number
- `limit` (integer, default: 20, max: 100): Results per page
- `search` (string): Search in name, email, company, or document
- `document_type` (string): Filter by 'cpf' or 'cnpj'
- `city` (string): Filter by city
- `state` (string): Filter by state (2 letters)
- `sort` (string, default: 'name'): Sort field (created_at, updated_at, name, email)
- `order` (string, default: 'asc'): Sort order (asc, desc)

**Response (200):**
```json
{
  "success": true,
  "message": "Clients retrieved successfully",
  "data": {
    "clients": [
      {
        "id": 1,
        "name": "Empresa ABC Ltda",
        "email": "contato@empresaabc.com.br",
        "phone": "11999999999",
        "phone_formatted": "(11) 99999-9999",
        "document": "12345678000190",
        "document_formatted": "12.345.678/0001-90",
        "document_type": "cnpj",
        "company": "Empresa ABC Ltda",
        "address_city": "São Paulo",
        "address_state": "SP",
        "created_at": "2025-09-25T14:30:00Z",
        "updated_at": "2025-09-25T14:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalCount": 1,
      "pageSize": 20,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

### GET /clients/:id
Get specific client by ID.

**Response (200):**
```json
{
  "success": true,
  "message": "Client retrieved successfully",
  "data": {
    "client": {
      "id": 1,
      "user_id": 1,
      "name": "Empresa ABC Ltda",
      "email": "contato@empresaabc.com.br",
      "phone": "11999999999",
      "phone_formatted": "(11) 99999-9999",
      "document": "12345678000190",
      "document_formatted": "12.345.678/0001-90",
      "document_type": "cnpj",
      "company": "Empresa ABC Ltda",
      "address": {
        "street": "Rua das Flores, 123",
        "number": "123",
        "complement": "Sala 456",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "cep": "01234567",
        "cep_formatted": "01234-567"
      },
      "notes": "Cliente preferencial",
      "is_active": true,
      "created_at": "2025-09-25T14:30:00Z",
      "updated_at": "2025-09-25T14:30:00Z"
    }
  }
}
```

### PUT /clients/:id
Update client information.

**Request Body:** (same structure as POST, all fields optional)

### DELETE /clients/:id
Delete client (soft delete). Returns error if client has associated proposals.

**Response (200):**
```json
{
  "success": true,
  "message": "Client deleted successfully"
}
```

### GET /clients/search
Search clients by name, email, company, or document.

**Query Parameters:**
- `q` (string, required, min: 2): Search query
- `limit` (integer, default: 10): Maximum results

### GET /clients/stats/summary
Get client statistics for current user.

**Response (200):**
```json
{
  "success": true,
  "message": "Client statistics retrieved successfully",
  "data": {
    "stats": {
      "total_clients": 25,
      "cpf_clients": 15,
      "cnpj_clients": 10,
      "cities_count": 8,
      "states_count": 3
    }
  }
}
```

---

## Proposal Management

### POST /proposals
Create a new proposal.

**Request Body:**
```json
{
  "title": "Website Corporativo - Empresa ABC",
  "description": "Desenvolvimento de website institucional responsivo",
  "client_id": 1,
  "items": [
    {
      "description": "Design e desenvolvimento do website",
      "quantity": 1,
      "unit_price": 8000.00,
      "total": 8000.00
    },
    {
      "description": "Hospedagem anual",
      "quantity": 1,
      "unit_price": 500.00,
      "total": 500.00
    }
  ],
  "subtotal": 8500.00,
  "tax_percentage": 10.0,
  "tax_amount": 850.00,
  "discount_percentage": 0,
  "discount_amount": 0,
  "total_amount": 9350.00,
  "validity_days": 30,
  "status": "draft",
  "notes": "Proposta válida por 30 dias",
  "payment_terms": "50% entrada, 50% na entrega"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Proposal created successfully",
  "data": {
    "proposal": {
      "id": 1,
      "user_id": 1,
      "client_id": 1,
      "title": "Website Corporativo - Empresa ABC",
      "description": "Desenvolvimento de website institucional responsivo",
      "subtotal": "8500.00",
      "tax_percentage": "10.00",
      "tax_amount": "850.00",
      "discount_percentage": "0.00",
      "discount_amount": "0.00",
      "total_amount": "9350.00",
      "status": "draft",
      "validity_days": 30,
      "expires_at": "2025-10-25T14:30:00Z",
      "notes": "Proposta válida por 30 dias",
      "payment_terms": "50% entrada, 50% na entrega",
      "created_at": "2025-09-25T14:30:00Z",
      "updated_at": "2025-09-25T14:30:00Z",
      "items": [
        {
          "id": 1,
          "proposal_id": 1,
          "description": "Design e desenvolvimento do website",
          "quantity": "1.000",
          "unit_price": "8000.00",
          "total": "8000.00",
          "sort_order": 1,
          "created_at": "2025-09-25T14:30:00Z",
          "updated_at": "2025-09-25T14:30:00Z"
        },
        {
          "id": 2,
          "proposal_id": 1,
          "description": "Hospedagem anual",
          "quantity": "1.000",
          "unit_price": "500.00",
          "total": "500.00",
          "sort_order": 2,
          "created_at": "2025-09-25T14:30:00Z",
          "updated_at": "2025-09-25T14:30:00Z"
        }
      ]
    }
  }
}
```

### GET /proposals
List proposals with pagination and filtering.

**Query Parameters:**
- `page` (integer, default: 1): Page number
- `limit` (integer, default: 20, max: 100): Results per page
- `status` (string): Filter by status (draft, pending, approved, rejected, expired)
- `client_id` (integer): Filter by client ID
- `search` (string): Search in proposal title or client name
- `sort` (string, default: 'created_at'): Sort field
- `order` (string, default: 'desc'): Sort order

**Response (200):**
```json
{
  "success": true,
  "message": "Proposals retrieved successfully",
  "data": {
    "proposals": [
      {
        "id": 1,
        "title": "Website Corporativo - Empresa ABC",
        "description": "Desenvolvimento de website institucional responsivo",
        "total_amount": "9350.00",
        "status": "draft",
        "validity_days": 30,
        "expires_at": "2025-10-25T14:30:00Z",
        "created_at": "2025-09-25T14:30:00Z",
        "updated_at": "2025-09-25T14:30:00Z",
        "client_name": "Empresa ABC Ltda",
        "client_email": "contato@empresaabc.com.br",
        "client_company": "Empresa ABC Ltda",
        "is_expired": false,
        "days_until_expiry": 30
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalCount": 1,
      "pageSize": 20,
      "hasNextPage": false,
      "hasPreviousPage": false
    },
    "summary": {
      "draft": 0,
      "pending": 0,
      "approved": 0,
      "rejected": 0,
      "expired": 0
    }
  }
}
```

### GET /proposals/:id
Get specific proposal with full details and items.

**Response (200):**
```json
{
  "success": true,
  "message": "Proposal retrieved successfully",
  "data": {
    "proposal": {
      "id": 1,
      "user_id": 1,
      "client_id": 1,
      "title": "Website Corporativo - Empresa ABC",
      "description": "Desenvolvimento de website institucional responsivo",
      "subtotal": "8500.00",
      "tax_percentage": "10.00",
      "tax_amount": "850.00",
      "discount_percentage": "0.00",
      "discount_amount": "0.00",
      "total_amount": "9350.00",
      "status": "draft",
      "validity_days": 30,
      "expires_at": "2025-10-25T14:30:00Z",
      "notes": "Proposta válida por 30 dias",
      "payment_terms": "50% entrada, 50% na entrega",
      "created_at": "2025-09-25T14:30:00Z",
      "updated_at": "2025-09-25T14:30:00Z",
      "client_name": "Empresa ABC Ltda",
      "client_email": "contato@empresaabc.com.br",
      "client_phone": "11999999999",
      "client_company": "Empresa ABC Ltda",
      "client_document": "12345678000190",
      "client_document_type": "cnpj",
      "is_expired": false,
      "days_until_expiry": 30,
      "items": [
        {
          "id": 1,
          "proposal_id": 1,
          "description": "Design e desenvolvimento do website",
          "quantity": "1.000",
          "unit_price": "8000.00",
          "total": "8000.00",
          "sort_order": 1,
          "created_at": "2025-09-25T14:30:00Z",
          "updated_at": "2025-09-25T14:30:00Z"
        },
        {
          "id": 2,
          "proposal_id": 1,
          "description": "Hospedagem anual",
          "quantity": "1.000",
          "unit_price": "500.00",
          "total": "500.00",
          "sort_order": 2,
          "created_at": "2025-09-25T14:30:00Z",
          "updated_at": "2025-09-25T14:30:00Z"
        }
      ]
    }
  }
}
```

### PUT /proposals/:id
Update proposal information.

**Request Body:** (same structure as POST, all fields optional)

### DELETE /proposals/:id
Delete proposal (soft delete).

### POST /proposals/:id/duplicate
Create a copy of existing proposal with status set to 'draft'.

**Response (201):**
```json
{
  "success": true,
  "message": "Proposal duplicated successfully",
  "data": {
    "proposal": {
      "id": 2,
      "title": "Website Corporativo - Empresa ABC (Cópia)",
      "status": "draft",
      // ... rest of proposal data
    }
  }
}
```

### GET /proposals/stats/summary
Get proposal statistics for current user.

**Response (200):**
```json
{
  "success": true,
  "message": "Proposal statistics retrieved successfully",
  "data": {
    "stats": {
      "draft_count": "5",
      "pending_count": "3",
      "approved_count": "12",
      "rejected_count": "2",
      "expired_count": "1",
      "total_count": "23",
      "total_approved_value": "145000.00",
      "average_proposal_value": "12500.00"
    }
  }
}
```

---

## Validation Rules

### Brazilian Document Validation

#### CPF (Cadastro de Pessoa Física)
- Must be 11 digits
- Must pass CPF validation algorithm
- Cannot be all same digits (111.111.111-11)
- Can be formatted (123.456.789-01) or unformatted (12345678901)

#### CNPJ (Cadastro Nacional de Pessoa Jurídica)
- Must be 14 digits
- Must pass CNPJ validation algorithm
- Cannot be all same digits (11.111.111/1111-11)
- Can be formatted (12.345.678/0001-90) or unformatted (12345678000190)

#### CEP (Código de Endereçamento Postal)
- Must be 8 digits
- Can be formatted (12345-678) or unformatted (12345678)
- Cannot be all zeros or all same digits

#### Brazilian Phone
- Mobile: 11 digits with 3rd digit as 9: (11) 99999-9999
- Landline: 10 digits: (11) 9999-9999
- Area codes must be between 11-99

---

## Error Handling

### Standard Error Response:
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error message 1", "Detailed error message 2"]
}
```

### HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `422` - Unprocessable Entity (business logic errors)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

### Common Validation Errors:

#### CPF/CNPJ Validation:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "document",
      "message": "Invalid CPF format",
      "value": "123.456.789-00"
    }
  ]
}
```

#### Required Fields:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "\"name\" is required",
      "value": ""
    }
  ]
}
```

---

## LGPD Compliance

### Data Processing Legal Bases:
- **Consent**: User explicitly consented to data processing
- **Contract**: Processing necessary for contract execution
- **Legal Obligation**: Required by Brazilian law
- **Vital Interests**: Protection of vital interests
- **Public Task**: Public function exercise
- **Legitimate Interests**: Legitimate interests of the controller

### Data Categories Tracked:
- **Personal**: Name, email, phone
- **Sensitive**: CPF, CNPJ, documents
- **Financial**: Values, payments
- **Technical**: IPs, user agents, sessions

### Audit Logging:
All data operations are automatically logged with:
- User identification
- Operation type (create, read, update, delete)
- Data categories involved
- Legal basis for processing
- Timestamp and IP address
- Retention period information

### Data Rights:
Users have the right to:
- Access their personal data
- Correct inaccurate data
- Delete personal data (when legally permissible)
- Data portability
- Restrict processing
- Object to processing

Contact: `dpo@orcamentos.com` for data protection requests.

---

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Login endpoint**: Special protection against brute force
- **Authenticated endpoints**: Higher limits for valid tokens

Rate limit headers returned:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1632345600
```

---

## Development Environment

### Demo Credentials:
```json
{
  "email": "demo@orcamentos.com",
  "password": "demo123"
}
```

### Health Check:
```
GET /api/v1/health
```

Returns system status, database connectivity, and service information.

---

## Security Features

1. **JWT Authentication** with short-lived tokens
2. **Rate Limiting** to prevent abuse
3. **Input Sanitization** to prevent XSS
4. **SQL Injection Protection** with parameterized queries
5. **CORS Configuration** for cross-origin requests
6. **Helmet.js Security Headers**
7. **LGPD Compliance** with audit logging
8. **Brazilian Document Validation**
9. **Password Complexity Requirements**
10. **Error Message Sanitization**

---

**Generated by ORION - Backend API Development Specialist**
**OrçamentosOnline Platform - Phase 2 Implementation**
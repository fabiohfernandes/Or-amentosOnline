# OrçamentosOnline Backend API
# ORION Agent - Backend Development
# Multi-stage build for optimal production deployment

FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    postgresql-client

WORKDIR /app

# Copy package files
COPY package*.json ./

# Development stage
FROM base AS development
RUN npm install
COPY . .
EXPOSE 3000 9229
CMD ["npm", "run", "dev"]

# Production dependencies stage
FROM base AS deps
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:18-alpine AS production
RUN apk add --no-cache curl postgresql-client
WORKDIR /app

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

CMD ["node", "src/index.js"]
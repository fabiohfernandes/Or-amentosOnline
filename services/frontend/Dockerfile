# OrçamentosOnline Frontend Dockerfile
# NOVA Agent - Frontend Development Specialist
# Multi-stage build for optimized production images

# ============================================================================
# Base Node.js image
# ============================================================================
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    curl \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# ============================================================================
# Dependencies stage
# ============================================================================
FROM base AS deps

# Install dependencies
RUN npm install --only=production --ignore-scripts && npm cache clean --force

# ============================================================================
# Development stage
# ============================================================================
FROM base AS development

# Install all dependencies (including dev dependencies)
RUN npm install --ignore-scripts

# Copy source code
COPY . .

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3001

# Development command with hot reload
CMD ["npm", "run", "dev"]

# ============================================================================
# Build stage
# ============================================================================
FROM base AS builder

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Install dev dependencies needed for build
RUN npm install --ignore-scripts

# Set build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# ============================================================================
# Production stage
# ============================================================================
FROM base AS production

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

# Set hostname
ENV HOSTNAME="0.0.0.0"
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Start the application
CMD ["node", "server.js"]

# ============================================================================
# Testing stage
# ============================================================================
FROM development AS testing

# Copy test configuration
COPY jest.config.js ./
COPY .storybook ./.storybook

# Run tests
RUN npm run test -- --passWithNoTests
RUN npm run type-check

# Default to development stage
FROM development
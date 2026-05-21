# Quickstart: Identity & Access Management

**Feature**: 001-identity-access
**Date**: 2026-05-21

## Prerequisites

- Node.js 22 LTS
- PostgreSQL 15+ (or Docker)
- npm 10+

## 1. Install Dependencies

```bash
# Production dependencies
npm install @nestjs/jwt @nestjs/passport passport passport-jwt passport-local \
  @prisma/client bcrypt class-validator class-transformer \
  @nestjs/config @nestjs-modules/mailer nodemailer

# Dev dependencies
npm install -D prisma @types/bcrypt @types/passport-jwt @types/passport-local @types/nodemailer
```

## 2. Database Setup

```bash
# Initialize Prisma (if not already done)
npx prisma init

# After adding the schema (see data-model.md), generate client and run migration
npx prisma migrate dev --name init-iam
npx prisma generate
```

## 3. Environment Variables

Create/update `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce?schema=public"
JWT_SECRET="your-256-bit-secret-here"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
MAIL_HOST="localhost"
MAIL_PORT=1025
MAIL_USER=""
MAIL_PASS=""
MAIL_FROM="noreply@ecommerce.local"
APP_URL="http://localhost:3000"
```

## 4. Run the Application

```bash
# Development
npm run start:dev

# The API will be available at http://localhost:3000/api
```

## 5. Verify the Setup

### Register a user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test1234", "name": "Test User"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test1234"}'
```

### Access protected route
```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <access-token-from-login>"
```

## 6. Run Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

## 7. Development Tools

For local email testing, use MailPit:

```bash
docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit
# SMTP on port 1025, Web UI on http://localhost:8025
```

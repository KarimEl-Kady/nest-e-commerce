# Quickstart: Product Catalog

**Feature**: 002-product-catalog
**Date**: 2026-05-21

## Prerequisites

- Feature 001 (Identity & Access Management) must be fully implemented and working
- Node.js 22 LTS
- PostgreSQL 15+ (or Docker)
- npm 10+

## 1. Dependencies

No new npm packages are required. The catalog module uses packages already installed in feature 001:
- `@prisma/client` — database access
- `class-validator`, `class-transformer` — DTO validation
- `@nestjs/common`, `@nestjs/core` — framework

## 2. Database Migration

```bash
# Add the Product and Category models to prisma/schema.prisma (see data-model.md)
# Then run migration:
npx prisma migrate dev --name add-catalog

# Apply the full-text search migration manually:
npx prisma migrate dev --create-only --name add-product-search-vector
# Edit the generated SQL file to include the tsvector column, GIN index, and trigger
# (see data-model.md for the SQL)
npx prisma migrate dev

# Regenerate the Prisma Client
npx prisma generate
```

## 3. Environment Variables

No new environment variables are required for the catalog module. All existing `.env` variables from feature 001 remain in use.

## 4. Run the Application

```bash
# Development
npm run start:dev

# The API will be available at http://localhost:3000/api
```

## 5. Verify the Setup

### Create a category (requires Admin token)
```bash
# First, login as admin to get an access token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "Admin1234"}' | jq -r '.accessToken')

# Create a category
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Electronics", "description": "Electronic devices and accessories"}'
```

### Create a product (requires Admin or Manager token)
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Wireless Headphones",
    "description": "Premium noise-cancelling wireless headphones with 30-hour battery life",
    "price": 79.99,
    "stock": 150,
    "images": ["https://example.com/headphones.jpg"],
    "sku": "WH-100X",
    "categoryId": "<category-id-from-above>"
  }'
```

### Browse products (public)
```bash
curl http://localhost:3000/api/products
```

### Search products (public)
```bash
curl "http://localhost:3000/api/products?search=wireless+headphones"
```

### Filter by category and price range (public)
```bash
curl "http://localhost:3000/api/products?categoryId=<id>&minPrice=10&maxPrice=100"
```

### View product detail (public)
```bash
curl http://localhost:3000/api/products/<product-id>
```

### List categories (public)
```bash
curl http://localhost:3000/api/categories
```

## 6. Run Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

## 7. Seed Data (Optional)

For development, you can create a seed script at `prisma/seed-catalog.ts`:

```bash
npx ts-node prisma/seed-catalog.ts
```

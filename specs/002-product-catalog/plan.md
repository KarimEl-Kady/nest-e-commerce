# Implementation Plan: Product Catalog

**Branch**: `002-product-catalog` | **Date**: 2026-05-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-product-catalog/spec.md`

## Summary

Implement a complete Product Catalog module for the NestJS e-commerce platform. The module provides product CRUD (with soft-delete), category management, paginated listings with sorting, full-text search (PostgreSQL `tsvector` with GIN index), and multi-criteria filtering (category, price range, stock availability). All write operations are restricted to Admin/Manager roles via the existing IAM guards. Prices are stored as `Decimal` for precision. No new npm dependencies are required — the module builds entirely on the existing foundation from feature 001.

## Technical Context

**Language/Version**: TypeScript 5.7+ (strict mode) on Node.js 22 LTS
**Primary Dependencies**: NestJS 11, Prisma Client, class-validator, class-transformer (all pre-installed from feature 001)
**Storage**: PostgreSQL via Prisma ORM (new `Product` and `Category` models + `tsvector` full-text search)
**Testing**: Jest 30 (unit) + Supertest 7 (e2e)
**Target Platform**: Linux server (containerised)
**Project Type**: REST web-service (modular monolith)
**Performance Goals**: Product listing < 200ms p95, Search < 1s p95 for 10k+ products
**Constraints**: Offset pagination (max 100 per page), Decimal price precision, soft-delete via `deletedAt`
**Scale/Scope**: 10,000+ products, 100+ categories

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Does the design align with a modular monolith architecture (no tight coupling)?
  - Catalog is two standalone NestJS modules (`ProductsModule`, `CategoriesModule`) with clear service interfaces. They import only the shared guards/decorators from `common/` and PrismaModule. No direct dependency on AuthModule internals.
- [x] Are the DTOs strictly typed and using class-validator for API-First Design?
  - All request bodies use class-validator decorated DTOs (`CreateProductDto`, `UpdateProductDto`, `ProductQueryDto`, `CreateCategoryDto`, `UpdateCategoryDto`).
- [x] Is data persistence managed through Prisma ORM with strict input validation?
  - Prisma schema defines Product and Category models. All writes go through Prisma Client. Full-text search uses `$queryRaw` for the `tsvector` column.
- [x] Are core e-commerce transactions fully covered by tests?
  - Product CRUD, search, filtering, soft-delete, and RBAC enforcement are covered by unit + e2e tests.
- [x] Are there proper global exception filters and async operations for scalability?
  - Reuses the global `HttpExceptionFilter` from feature 001. All service methods are async. Prisma queries are non-blocking.

## Project Structure

### Documentation (this feature)

```text
specs/002-product-catalog/
├── plan.md              # This file
├── research.md          # Phase 0 output — 7 technical decisions
├── data-model.md        # Phase 1 output — Prisma schema + FTS migration
├── quickstart.md        # Phase 1 output — setup and verification steps
├── contracts/           # Phase 1 output
│   └── catalog-api.md   # REST endpoint contracts (12 endpoints)
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app.module.ts                 # Root module — add ProductsModule, CategoriesModule
├── main.ts                       # Bootstrap (unchanged)
│
├── prisma/
│   ├── prisma.module.ts          # Global Prisma module (unchanged)
│   ├── prisma.service.ts         # PrismaClient lifecycle wrapper (unchanged)
│   └── schema.prisma             # Add Product + Category models
│
├── common/                       # Shared infrastructure (unchanged, reused)
│   ├── filters/
│   ├── guards/
│   ├── decorators/
│   └── enums/
│
├── products/
│   ├── products.module.ts
│   ├── products.controller.ts
│   ├── products.service.ts
│   ├── products.service.spec.ts
│   └── dto/
│       ├── create-product.dto.ts
│       ├── update-product.dto.ts
│       └── product-query.dto.ts
│
├── categories/
│   ├── categories.module.ts
│   ├── categories.controller.ts
│   ├── categories.service.ts
│   ├── categories.service.spec.ts
│   └── dto/
│       ├── create-category.dto.ts
│       └── update-category.dto.ts
│
├── auth/                         # Feature 001 (unchanged)
├── users/                        # Feature 001 (unchanged)
└── mail/                         # Feature 001 (unchanged)

test/
├── auth.e2e-spec.ts              # Feature 001 (unchanged)
├── products.e2e-spec.ts          # New — product CRUD + search e2e tests
└── categories.e2e-spec.ts        # New — category CRUD e2e tests
```

**Structure Decision**: Follows the same single-project NestJS modular monolith pattern established in feature 001. The catalog is split into two focused modules (`ProductsModule` for product CRUD/search, `CategoriesModule` for category management). Both modules depend on `PrismaModule` (global) and reuse `@Public()`, `@Roles()`, and `RolesGuard` from `common/`. No new shared utilities are introduced.

## Complexity Tracking

> No constitution violations detected — section intentionally left empty.

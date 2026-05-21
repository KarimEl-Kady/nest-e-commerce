# Research: Product Catalog

**Feature**: 002-product-catalog
**Date**: 2026-05-21

## 1. Full-Text Search Strategy

**Decision**: PostgreSQL `tsvector` with GIN index, accessed via `prisma.$queryRaw`

**Rationale**: With a target of 10,000+ products, PostgreSQL's native full-text search provides tokenisation, stemming, stop-word removal, and relevance ranking out of the box. A stored `tsvector` column with a GIN index allows sub-millisecond lookups without scanning every row. Prisma does not expose `tsvector` through its fluent API, so `$queryRaw` is used for search queries while standard Prisma methods handle all other CRUD operations.

**Alternatives considered**:
- **ILIKE**: Simple to implement but forces a sequential table scan for `%term%` patterns. Acceptable for <1,000 rows but degrades linearly beyond that. Rejected for the 10k+ target.
- **Elasticsearch/Meilisearch**: Superior relevance tuning and faceted search, but introduces an external service dependency. Out of scope per the spec assumptions. Can be swapped in later since the search interface is behind a service method.
- **pg_trgm (trigram matching)**: Good for fuzzy/typo-tolerant search but less suitable for natural language queries. Can be added alongside `tsvector` later if typo-tolerance becomes important.

## 2. Soft Delete Pattern

**Decision**: `deletedAt: DateTime?` column with explicit `where: { deletedAt: null }` filtering in service methods

**Rationale**: A nullable `deletedAt` timestamp is the industry standard for soft-delete. It retains the deletion timestamp for auditing and is more informative than a boolean flag. Filtering is applied explicitly in service methods rather than via Prisma middleware (deprecated) or global extensions, keeping queries predictable and debuggable.

**Alternatives considered**:
- **Prisma Client Extensions (global $allModels soft-delete)**: Automatically intercepts `delete` → `update` and injects `deletedAt: null` filters. Rejected because "magic" global filters can cause hard-to-debug issues with relations and admin views that need to see deleted records.
- **Prisma Middleware (`$use`)**: Deprecated in favour of extensions. Rejected.
- **Boolean `isDeleted` flag**: Works but loses the timestamp of when deletion occurred. Rejected for inferior auditability.

## 3. Product Image Storage

**Decision**: Store image URLs as a `String[]` array column in PostgreSQL, referencing externally hosted images

**Rationale**: The spec explicitly states images are stored as URLs (referencing S3/CDN). PostgreSQL natively supports array columns, and Prisma maps them cleanly. This avoids file upload infrastructure in the catalog module. The first element of the array is treated as the thumbnail in listings.

**Alternatives considered**:
- **Separate `ProductImage` join table**: Allows additional metadata per image (alt text, sort order, dimensions). Over-engineering for the current scope — an array is simpler. Can be migrated later if per-image metadata is needed.
- **JSON column**: More flexible but harder to query and validate. Rejected in favour of strongly-typed array.

## 4. Pagination Strategy

**Decision**: Offset-based pagination (`skip`/`take` via Prisma) with `page` and `limit` query parameters

**Rationale**: Offset pagination is simpler to implement, works well with Prisma's fluent API, and is sufficient for a catalog of 10,000 products. The API returns `{ data, total, page, limit }` for client-side page navigation. This is consistent with the pagination pattern already established in the IAM module (GET /users).

**Alternatives considered**:
- **Cursor-based pagination**: Better performance at scale (millions of rows) and handles real-time insertions gracefully. Over-engineering for 10k products and adds client-side complexity. Can be added as an alternative later.

## 5. Price Storage

**Decision**: Prisma `Decimal` type (PostgreSQL `NUMERIC`) for price, stored in the smallest currency unit or as a fixed-precision decimal

**Rationale**: Floating-point types (`Float`) introduce rounding errors in monetary calculations. `Decimal` provides exact precision. Prisma's `Decimal` type maps to PostgreSQL's `NUMERIC` type and returns a `Decimal.js` object in code, ensuring no floating-point surprises.

**Alternatives considered**:
- **Integer (cents)**: Store `1999` instead of `19.99`. Simple but requires conversion in the API layer. Acceptable but less readable in database inspection. Rejected for developer ergonomics.
- **Float**: Never suitable for monetary values. Rejected immediately.

## 6. Category Model

**Decision**: Flat category structure — a simple `Category` model with a one-to-many relationship to `Product`

**Rationale**: The spec explicitly states flat categories (no nesting) for this iteration. A `categoryId` foreign key on `Product` is the simplest implementation. Categories have `name` and `description` fields.

**Alternatives considered**:
- **Nested/hierarchical categories (adjacency list or materialized path)**: Adds complexity for breadcrumb navigation and tree rendering. Out of scope per spec.
- **Many-to-many (product in multiple categories)**: Adds a junction table. Out of scope — one product belongs to one category.

## 7. Search Column Weighting

**Decision**: Use weighted `tsvector` — product name weighted 'A', description weighted 'B'

**Rationale**: When a user searches for "wireless headphones", a product named "Wireless Headphones" should rank higher than one where the term only appears in the description. PostgreSQL's `setweight()` function allows this prioritisation natively, and `ts_rank()` uses the weights for ordering.

## Dependencies to Install

```bash
# No new production dependencies — the catalog module uses Prisma, class-validator, 
# and NestJS common packages already installed in feature 001.
# Only Prisma schema changes + migration required.
```

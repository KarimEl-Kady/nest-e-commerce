# Tasks: Product Catalog

**Input**: Design documents from `/specs/002-product-catalog/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/catalog-api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema changes and shared module setup for the catalog feature.

- [x] T001 Add Product and Category models to Prisma schema at `prisma/schema.prisma` per specs/002-product-catalog/data-model.md
- [x] T002 Add `products Product[]` reverse relation to User model in `prisma/schema.prisma`
- [ ] T003 Run `npx prisma migrate dev --name add-catalog` to generate and apply the catalog migration
- [x] T004 Create full-text search SQL migration with tsvector column, GIN index, and trigger function per specs/002-product-catalog/data-model.md
- [ ] T005 Run `npx prisma generate` to regenerate Prisma Client

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core modules, DTOs, and services that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 [P] Create CreateProductDto at `src/products/dto/create-product.dto.ts` — name (@IsString, @MinLength(1), @MaxLength(255)), description (@IsOptional, @IsString, @MaxLength(5000)), price (@IsNumber, @IsPositive), stock (@IsInt, @Min(0)), images (@IsOptional, @IsArray, @IsUrl each, @ArrayMaxSize(10)), sku (@IsOptional, @IsString, @MaxLength(50)), published (@IsOptional, @IsBoolean), categoryId (@IsOptional, @IsString)
- [x] T007 [P] Create UpdateProductDto at `src/products/dto/update-product.dto.ts` — PartialType(CreateProductDto)
- [x] T008 [P] Create ProductQueryDto at `src/products/dto/product-query.dto.ts` — page, limit, sort, order, search, categoryId, minPrice, maxPrice, inStock per contracts/catalog-api.md
- [x] T009 [P] Create CreateCategoryDto at `src/categories/dto/create-category.dto.ts` — name (@IsString, @MinLength(1), @MaxLength(100)), description (@IsOptional, @IsString, @MaxLength(500))
- [x] T010 [P] Create UpdateCategoryDto at `src/categories/dto/update-category.dto.ts` — PartialType(CreateCategoryDto)
- [x] T011 Create ProductsModule at `src/products/products.module.ts` — providers: ProductsService, controllers: ProductsController
- [x] T012 Create CategoriesModule at `src/categories/categories.module.ts` — providers: CategoriesService, controllers: CategoriesController
- [x] T013 Import ProductsModule and CategoriesModule into AppModule in `src/app.module.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 & 2 — Browse Listings + View Product Detail (Priority: P1) 🎯 MVP

**Goal**: Visitors can browse a paginated, sorted list of published products AND view full product details by clicking on any product.

**Independent Test**: Load GET /api/products and verify paginated results with sorting. Load GET /api/products/:id and verify full product details are returned. Verify soft-deleted/unpublished products are excluded.

### Implementation for User Stories 1 & 2

- [x] T014 [US1] Implement ProductsService.findAll() in `src/products/products.service.ts` — paginated query with sorting (price, name, createdAt), filtering for published=true AND deletedAt=null, includes category relation, returns { data, total, page, limit }
- [x] T015 [US2] Implement ProductsService.findOne() in `src/products/products.service.ts` — find by ID where published=true AND deletedAt=null, includes category relation, throws NotFoundException if not found
- [x] T016 [US1] [US2] Create ProductsController at `src/products/products.controller.ts` — GET /products (@Public, uses ProductQueryDto), GET /products/:id (@Public), both return product data per contracts/catalog-api.md

**Checkpoint**: Browsing and product detail work end-to-end. Visitors can paginate, sort, and view product details.

---

## Phase 4: User Story 3 — Product Search & Filtering (Priority: P2)

**Goal**: Visitors can search by keyword (full-text search on name + description) and filter by category, price range, and stock availability.

**Independent Test**: Execute GET /api/products?search=wireless and verify relevant results ranked by relevance. Apply category + price range filters and verify accurate filtering. Combine search + filters and verify combined results.

### Implementation for User Story 3

- [x] T017 [US3] Implement ProductsService.search() in `src/products/products.service.ts` — full-text search using prisma.$queryRaw with websearch_to_tsquery and ts_rank for relevance ordering, combined with category/price/stock filters
- [x] T018 [US3] Update ProductsService.findAll() in `src/products/products.service.ts` — integrate filter logic for categoryId, minPrice, maxPrice, inStock query params. Route to search() when search param is present
- [x] T019 [US3] Update ProductsController GET /products in `src/products/products.controller.ts` — pass search and filter params from ProductQueryDto to the service

**Checkpoint**: Search and filtering work. Full-text search returns ranked results. Filters can be combined with search.

---

## Phase 5: User Story 4 — Admin Product Management (Priority: P2)

**Goal**: Admins and Managers can create, update, and soft-delete products. RBAC enforcement prevents customers from performing write operations.

**Independent Test**: Create a product as Admin (POST /api/products), verify it appears in listing. Update its price (PATCH /api/products/:id), verify change reflected. Soft-delete it (DELETE /api/products/:id), verify it disappears from customer view. Verify Customer role gets 403 on all write endpoints.

### Implementation for User Story 4

- [x] T020 [US4] Implement ProductsService.create() in `src/products/products.service.ts` — validate unique SKU (if provided), create product with all fields per CreateProductDto, set createdById from current user, return full product with category
- [x] T021 [US4] Implement ProductsService.update() in `src/products/products.service.ts` — find product (not soft-deleted), validate unique SKU on change, update fields per UpdateProductDto, return updated product with category
- [x] T022 [US4] Implement ProductsService.remove() in `src/products/products.service.ts` — find product (not soft-deleted), set deletedAt=now() (soft-delete), return success message
- [x] T023 [US4] Add write endpoints to ProductsController in `src/products/products.controller.ts` — POST /products (@Roles(ADMIN, MANAGER), @UseGuards(RolesGuard)), PATCH /products/:id (@Roles(ADMIN, MANAGER)), DELETE /products/:id (@Roles(ADMIN, MANAGER)) per contracts/catalog-api.md
- [x] T024 [US4] Create ProductsService unit test at `src/products/products.service.spec.ts` — test create (valid data, duplicate SKU rejection), update, soft-delete, findAll excluding deleted, findOne excluding deleted

**Checkpoint**: Product CRUD works end-to-end. Soft-delete hides products from customers. RBAC enforced on all write endpoints.

---

## Phase 6: User Story 5 — Category Management (Priority: P3)

**Goal**: Admins can create, update, delete, and list categories. Products can be assigned to categories. Visitors can see category list with product counts.

**Independent Test**: Create a category (POST /api/categories), assign a product to it, verify GET /api/categories returns the category with product count. Update the category, verify change. Delete it, verify products have categoryId set to null.

### Implementation for User Story 5

- [x] T025 [US5] Implement CategoriesService.findAll() in `src/categories/categories.service.ts` — list all categories with _count of published, non-deleted products
- [x] T026 [US5] Implement CategoriesService.create() in `src/categories/categories.service.ts` — validate unique name, create category, return created category
- [x] T027 [US5] Implement CategoriesService.update() in `src/categories/categories.service.ts` — find by ID (NotFoundException), validate unique name on change, update fields, return updated category
- [x] T028 [US5] Implement CategoriesService.remove() in `src/categories/categories.service.ts` — find by ID (NotFoundException), delete category (Prisma onDelete: SetNull handles products), return success message
- [x] T029 [US5] Create CategoriesController at `src/categories/categories.controller.ts` — GET /categories (@Public), POST /categories (@Roles(ADMIN), @UseGuards(RolesGuard)), PATCH /categories/:id (@Roles(ADMIN)), DELETE /categories/:id (@Roles(ADMIN)) per contracts/catalog-api.md
- [x] T030 [US5] Create CategoriesService unit test at `src/categories/categories.service.spec.ts` — test create (valid, duplicate name), update, delete, findAll with product count

**Checkpoint**: Category CRUD works. Products filter correctly by category. Category deletion nullifies product references.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: E2E tests, cleanup, and verification across all user stories.

- [x] T031 [P] Create product CRUD E2E test at `test/products.e2e-spec.ts` — test full flow: create product (as Admin), browse listing (as guest), view detail, search, filter, update, soft-delete, verify hidden
- [x] T032 [P] Create categories E2E test at `test/categories.e2e-spec.ts` — test full flow: create category (as Admin), list with product count, update, delete, verify product categoryId nullified
- [ ] T033 Run `npm run lint` and fix any issues across all new files
- [ ] T034 Run `npm run test` to verify all unit tests pass
- [ ] T035 Verify all quickstart.md curl commands work against running dev server

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (Prisma schema + migration)
- **US1 & US2 (Phase 3)**: Depends on Phase 2 — read-side product endpoints
- **US3 (Phase 4)**: Depends on Phase 3 — extends findAll with search and filters
- **US4 (Phase 5)**: Depends on Phase 2 — write-side product endpoints (can run in parallel with Phase 3)
- **US5 (Phase 6)**: Depends on Phase 2 — category CRUD (can run in parallel with Phases 3-5)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 & 2 (P1)**: Can start after Phase 2 — No dependencies on other stories
- **User Story 3 (P2)**: Depends on US1 (extends the findAll method with search/filter logic)
- **User Story 4 (P2)**: Can start after Phase 2 — Independent of US1/US2/US3
- **User Story 5 (P3)**: Can start after Phase 2 — Independent of other stories

### Within Each User Story

- DTOs before services
- Services before controllers
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T006, T007, T008, T009, T010 (all DTOs) can run in parallel
- Phase 5 (US4 — product write ops) can run in parallel with Phase 3 (US1/US2 — product read ops) since they modify different methods
- Phase 6 (US5 — categories) can run in parallel with Phases 3–5 since it is a separate module
- T031, T032 (E2E tests) can run in parallel

---

## Parallel Example: Phase 2

```bash
# Launch all DTO creation tasks together:
Task T006: "Create CreateProductDto in src/products/dto/create-product.dto.ts"
Task T007: "Create UpdateProductDto in src/products/dto/update-product.dto.ts"
Task T008: "Create ProductQueryDto in src/products/dto/product-query.dto.ts"
Task T009: "Create CreateCategoryDto in src/categories/dto/create-category.dto.ts"
Task T010: "Create UpdateCategoryDto in src/categories/dto/update-category.dto.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (schema + migration)
2. Complete Phase 2: Foundational (DTOs + modules)
3. Complete Phase 3: User Stories 1 & 2 (browse + detail)
4. **STOP and VALIDATE**: Test browsing and product detail independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 & US2 → Browse + Detail working → Deploy/Demo (MVP!)
3. Add US3 → Search + Filtering working → Deploy/Demo
4. Add US4 → Admin CRUD working → Deploy/Demo
5. Add US5 → Categories working → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 & US2 (listing + detail) → then US3 (search)
   - Developer B: US4 (admin product CRUD)
   - Developer C: US5 (category management)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- US1 and US2 are merged into a single phase because they share the same service/controller and both operate on the read side
- No new npm dependencies required — all packages are pre-installed from feature 001

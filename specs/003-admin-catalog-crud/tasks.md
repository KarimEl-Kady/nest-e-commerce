# Tasks: Admin Catalog CRUD

**Input**: Design documents from `/specs/003-admin-catalog-crud/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize the feature branch `003-admin-catalog-crud`

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Update `prisma/schema.prisma` with Category and Product models (incorporating relationships, strict typing, and soft-delete fields)
- [X] T003 Generate Prisma client and apply database migration (`npx prisma migrate dev --name add_admin_catalog_crud`)

**Checkpoint**: Database schema is updated and ready for CRUD operations.

---

## Phase 3: User Story 1 - Admin Category Management (Priority: P1) 🎯 MVP

**Goal**: Administrator accesses category management to create, read, update, and delete product categories.

**Independent Test**: Can be tested by creating a new category, viewing it in the list, updating its name, and deleting it (verifying 409 conflict if products exist).

### Tests for User Story 1 ⚠️

- [X] T004 [P] [US1] Create or update E2E tests for Admin Categories in `test/categories.e2e-spec.ts`

### Implementation for User Story 1

- [X] T005 [P] [US1] Update DTOs with `class-validator` and `@ApiProperty` decorators in `src/categories/dto/create-category.dto.ts` and `src/categories/dto/update-category.dto.ts`
- [X] T006 [US1] Implement `CategoriesService` methods in `src/categories/categories.service.ts` (enforcing `409 Conflict` on deletion if linked products exist)
- [X] T007 [US1] Implement `CategoriesController` with `@Roles(Role.ADMIN)` guard and Swagger decorators in `src/categories/categories.controller.ts`

**Checkpoint**: At this point, User Story 1 (Category Management) should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Admin Product Management (Priority: P1)

**Goal**: Administrator accesses product management to create, read, update, and soft-delete products.

**Independent Test**: Can be tested by adding a new product to an existing category and verifying it correctly appears in the catalog preview.

### Tests for User Story 2 ⚠️

- [X] T008 [P] [US2] Create or update E2E tests for Admin Products in `test/products.e2e-spec.ts`

### Implementation for User Story 2

- [X] T009 [P] [US2] Update DTOs with `class-validator` and `@ApiProperty` decorators in `src/products/dto/create-product.dto.ts` and `src/products/dto/update-product.dto.ts`
- [X] T010 [US2] Implement `ProductsService` methods in `src/products/products.service.ts` (implement soft-delete logic and empty image array handling)
- [X] T011 [US2] Implement `ProductsController` with `@Roles(Role.ADMIN)` guard and Swagger decorators in `src/products/products.controller.ts`

**Checkpoint**: Both Category and Product Admin CRUD operations are independently functional.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T012 [P] Verify Swagger documentation accurately reflects endpoints at `http://localhost:3000/api/docs`
- [X] T013 Ensure global exception filters correctly capture Prisma exceptions (e.g., `P2003`) and return standard HTTP responses (`409 Conflict`)
- [X] T014 Run E2E tests via `npm run test:e2e` to confirm no regressions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3 & 4)**: Depend on Foundational phase. Both US1 and US2 can proceed in parallel since they touch different modules, though US2 conceptually depends on Categories existing in the database for testing.
- **Polish (Phase 5)**: Depends on both user stories being complete.

### Within Each User Story

- Tests MUST be written before implementation.
- DTOs before services.
- Services before controllers.

### Parallel Opportunities

- All tests for a user story marked [P] can run in parallel with DTO creation.
- Once Foundational phase completes, different developers can tackle `Categories` and `Products` simultaneously.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & Phase 2.
2. Complete Phase 3: Admin Category Management.
3. **STOP and VALIDATE**: Test Category Management independently.

### Incremental Delivery

1. Foundation ready.
2. Deliver Category Management → Test independently.
3. Deliver Product Management → Test independently.
4. Execute Polish phase to ensure API documentation and exception handling are robust.

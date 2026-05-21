# Tasks: Inventory Module

**Input**: Design documents from `/specs/004-inventory-module/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize the feature branch `inventory` (Already created)

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Update `prisma/schema.prisma` with `StockReservation` and `InventoryLedger` models, including `ReservationStatus` enum and relations to the existing `Product` model.
- [ ] T003 Generate Prisma client and apply database migration (`npx prisma migrate dev --name add_inventory_module`)
- [ ] T004 [P] Generate `InventoryModule` in `src/inventory/inventory.module.ts` and register it in `src/app.module.ts`

**Checkpoint**: Database schema is updated and base module is wired into the application.

---

## Phase 3: User Story 1 - Real-time Stock Availability (Priority: P1) 🎯 MVP

**Goal**: A customer browsing the product catalog needs to see the true available stock. True availability is the total physical stock minus any stock that is currently reserved by other customers.

**Independent Test**: Can be verified by fetching a product's available stock and observing the math: `Product.stock - SUM(ACTIVE reservations)`.

### Tests for User Story 1 ⚠️

- [ ] T005 [P] [US1] Create E2E tests for inventory availability in `test/inventory.e2e-spec.ts`

### Implementation for User Story 1

- [ ] T006 [US1] Implement `InventoryService.getAvailability` in `src/inventory/inventory.service.ts` to calculate `availableStock` dynamically
- [ ] T007 [US1] Implement `GET /api/inventory/availability/:productId` in `src/inventory/inventory.controller.ts` with Swagger decorators

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Stock Reservations (Priority: P1)

**Goal**: When a customer begins the checkout process, the system temporarily reserves the requested quantity for a short period (e.g., 15 minutes) to guarantee the items are available.

**Independent Test**: Can be tested by initiating a reservation, verifying available stock decreases, committing it to permanently deduct stock, and confirming expiration logic works.

### Tests for User Story 2 ⚠️

- [ ] T008 [P] [US2] Update E2E tests for reservations, commits, and expiration in `test/inventory.e2e-spec.ts`

### Implementation for User Story 2

- [ ] T009 [P] [US2] Create DTO `CreateReservationDto` in `src/inventory/dto/create-reservation.dto.ts` with `class-validator` and `@ApiProperty`
- [ ] T010 [US2] Implement `InventoryService.reserveStock` in `src/inventory/inventory.service.ts` using `prisma.$transaction` and PostgreSQL pessimistic locking (`FOR UPDATE`) to prevent race conditions
- [ ] T011 [US2] Implement `InventoryService.commitReservation` in `src/inventory/inventory.service.ts` using locking, which sets status to COMMITTED, deducts `Product.stock`, and creates an `InventoryLedger` entry
- [ ] T012 [US2] Implement reservation endpoints (`POST /api/inventory/reservations` and `POST /api/inventory/reservations/:id/commit`) in `src/inventory/inventory.controller.ts` with `@ApiBearerAuth` and Swagger decorators
- [ ] T013 [US2] Install `@nestjs/schedule` and implement `ReservationCleanupCron` in `src/inventory/cron/reservation-cleanup.cron.ts` to automatically expire ACTIVE reservations where `expiresAt < now()`

**Checkpoint**: Stock reservations, high-concurrency safety, and expiration logic are functional.

---

## Phase 5: User Story 3 - Admin Stock Adjustments (Priority: P2)

**Goal**: An administrator can manually adjust the physical stock of a product (+/-) and provide a reason for the adjustment, creating an auditable ledger entry.

**Independent Test**: Can be tested by submitting an adjustment (+50), verifying the product's physical stock increases by 50, and confirming the `InventoryLedger` recorded the adjustment.

### Tests for User Story 3 ⚠️

- [ ] T014 [P] [US3] Update E2E tests for admin stock adjustments in `test/inventory.e2e-spec.ts`

### Implementation for User Story 3

- [ ] T015 [P] [US3] Create DTO `CreateAdjustmentDto` in `src/inventory/dto/create-adjustment.dto.ts` with validation and `@ApiProperty`
- [ ] T016 [US3] Implement `InventoryService.adjustStock` in `src/inventory/inventory.service.ts` to update `Product.stock` and create an `InventoryLedger` entry in a single transaction
- [ ] T017 [US3] Implement `POST /api/inventory/adjustments` in `src/inventory/inventory.controller.ts` with `@Roles(Role.ADMIN)` guard, `@ApiBearerAuth`, and Swagger decorators

**Checkpoint**: Administrator stock adjustments and inventory ledger are functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T018 [P] Verify Swagger documentation accurately reflects endpoints at `http://localhost:3000/api/docs`
- [ ] T019 Run E2E tests via `npm run test:e2e` to confirm no regressions and execute quickstart validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Done.
- **Foundational (Phase 2)**: Depends on Setup. Blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundation. Can be deployed on its own.
- **User Story 2 (Phase 4)**: Depends on User Story 1 (for availability verification).
- **User Story 3 (Phase 5)**: Depends on Foundation. Can proceed in parallel with US1 or US2.
- **Polish (Phase 6)**: Depends on all user stories.

### Parallel Opportunities

- DTO creation (`T009`, `T015`) and Test scaffolding (`T005`, `T008`, `T014`) can be worked on in parallel by different developers.
- `ReservationCleanupCron` (`T013`) can be developed simultaneously with the API endpoints (`T012`) once the `inventory.service.ts` signatures are defined.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & Phase 2.
2. Complete Phase 3: Real-time Stock Availability.
3. **STOP and VALIDATE**: Test Availability independently.

### Incremental Delivery

1. Foundation ready.
2. Deliver Stock Availability (US1) → Test independently.
3. Deliver Stock Reservations (US2) → Test independently (simulating checkout holds).
4. Deliver Admin Stock Adjustments (US3) → Test independently (auditing).
5. Execute Polish phase.

# Feature Specification: Inventory Module

**Feature Branch**: `004-inventory-module`  
**Created**: 2026-05-21  
**Status**: Draft  
**Input**: User description: "creating the e-commerce Inventory module"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Real-time Stock Availability (Priority: P1)

A customer browsing the product catalog needs to see the true available stock. True availability is the total physical stock minus any stock that is currently reserved by other customers in active checkout sessions.

**Why this priority**: Preventing overselling is critical for e-commerce. If availability is inaccurate, customers can buy out-of-stock items, leading to cancellations.
**Independent Test**: Can be tested by reserving stock for a product and verifying that the available count drops, while the physical count remains the same.

**Acceptance Scenarios**:
1. **Given** a product with physical stock of 10, **When** no reservations exist, **Then** the available stock is 10.
2. **Given** a product with physical stock of 10, **When** 2 items are reserved, **Then** the available stock is 8.
3. **Given** a customer viewing a product, **When** the available stock is 0, **Then** the system prevents the item from being added to the cart.

---

### User Story 2 - Stock Reservations (Priority: P1)

When a customer begins the checkout process, the system temporarily reserves the requested quantity for a short period (e.g., 15 minutes) to guarantee the items are available when they complete payment.

**Why this priority**: Guarantees that items in the cart are actually available for purchase, reducing cart abandonment and customer frustration.
**Independent Test**: Can be tested by initiating a reservation, verifying it expires after the configured timeout, and returns the stock to available status.

**Acceptance Scenarios**:
1. **Given** sufficient available stock, **When** a customer starts checkout, **Then** a reservation is created and available stock decreases.
2. **Given** insufficient available stock, **When** a customer attempts to reserve items, **Then** the system returns a 409 Conflict error.
3. **Given** an active reservation, **When** 15 minutes pass without order confirmation, **Then** the reservation expires and stock becomes available again.
4. **Given** an active reservation, **When** the order is successfully paid, **Then** the reservation is resolved, and the physical stock is permanently deducted.

---

### User Story 3 - Admin Stock Adjustments (Priority: P2)

An administrator can manually adjust the physical stock of a product (e.g., adding new inventory from a supplier, or removing damaged goods) and provide a reason for the adjustment. 

**Why this priority**: Admins need an auditable way to update stock levels beyond just editing the integer on the product record.
**Independent Test**: Can be tested by creating an adjustment of +50, verifying the product's physical stock increases by 50, and confirming the ledger recorded the adjustment.

**Acceptance Scenarios**:
1. **Given** an Admin user, **When** they submit a stock adjustment (e.g., +20 for "Restock"), **Then** the physical stock increases and an audit log is created.
2. **Given** an Admin user, **When** they submit a negative adjustment (e.g., -5 for "Damaged"), **Then** the physical stock decreases.
3. **Given** an Admin user, **When** they attempt a negative adjustment that exceeds available stock, **Then** the system returns a 400 Bad Request.

---

### Edge Cases
- What happens if a reservation expires at the exact millisecond an order is confirmed?
- How does the system handle high-concurrency requests for the last remaining item in stock?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST calculate available stock as `Physical Stock - Active Reservations`.
- **FR-002**: System MUST allow creating temporary stock reservations that expire automatically.
- **FR-003**: System MUST prevent creating reservations if requested quantity exceeds available stock.
- **FR-004**: System MUST allow committing a reservation (permanently deducting physical stock).
- **FR-005**: System MUST allow users with the ADMIN role to create manual stock adjustments (+/-).
- **FR-006**: System MUST maintain an append-only audit ledger of all stock adjustments and reservation commits.
- **FR-007**: System MUST use strict database locks (e.g., optimistic locking or row-level locking) to prevent race conditions during reservations.

### Non-Functional Requirements (Architecture Constraints)

- **NFR-001**: System MUST be implemented as a Modular Monolith using NestJS.
- **NFR-002**: All data persistence MUST utilize Prisma ORM.
- **NFR-003**: API interfaces MUST be strictly typed and validated using `class-validator`, and fully documented via Swagger/OpenAPI.
- **NFR-004**: System MUST employ asynchronous, non-blocking code and use global exception filters.
- **NFR-005**: High-concurrency endpoints (reservations) must respond in under 100ms.

### Key Entities

- **Product (Existing)**: Needs extension to support physical stock and reservations logic.
- **Inventory Ledger / Adjustment**: Records changes to physical stock (id, productId, quantityChange, reason, adminId, createdAt).
- **Stock Reservation**: Temporary hold on stock (id, productId, userId, quantity, expiresAt, status: ACTIVE/COMMITTED/EXPIRED).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The system handles 100 concurrent reservation requests for the same item without overselling (0% oversell rate).
- **SC-002**: Expired reservations return stock to the available pool within 1 minute of expiration.
- **SC-003**: 100% of stock changes are traceable via the Inventory Ledger.

## Assumptions

- Product module exists and holds the base `Product` entity.
- The system has a mechanism (e.g., CRON job, Redis TTL, or background worker) to accurately process expired reservations.

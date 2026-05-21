# Phase 0: Research & Architecture Decisions

**Feature**: Inventory Module
**Branch**: `004-inventory-module`

## Research Task 1: Handling High Concurrency & Preventing Overselling

**Question**: How does the system handle high-concurrency requests for the last remaining item in stock to ensure 0% oversell rate?

**Decision**: Implement **Row-level pessimistic locking** using Prisma (`FOR UPDATE`) inside an explicit transaction when creating a stock reservation. 
**Rationale**: When multiple concurrent requests attempt to reserve the same product, a database lock ensures that only one request can read and update the available stock at a time. This guarantees absolute consistency and prevents race conditions at the database level without requiring distributed locks (like Redis/Redlock), keeping the architecture simple.
**Alternatives considered**: 
- *Optimistic Locking*: Rejected because high contention on popular items during a sale can lead to excessive retry loops and HTTP 500s.
- *Redis Distributed Locks*: Rejected to minimize infrastructure dependencies since Postgres can natively handle this via row-level locks.

## Research Task 2: Managing Reservation Expiration

**Question**: What is the mechanism to accurately process expired reservations (CRON job, Redis TTL, or background worker)?

**Decision**: Implement a **Background Cron Job** using NestJS `@nestjs/schedule` module.
**Rationale**: The job will run frequently (e.g., every 1 minute) and query the database for reservations where `expiresAt < now()` and `status == 'ACTIVE'`. It will mark them as `EXPIRED`. This keeps the truth entirely within Postgres and relies on native NestJS tooling.
**Alternatives considered**:
- *Redis TTL (Key-space notifications)*: Highly accurate, but introduces Redis as a hard dependency for core business logic state transitions.
- *Delayed Queues (e.g., BullMQ)*: Great for scalability, but adds infrastructure complexity (Redis + queue workers). Cron is sufficient for MVP and can be scaled later if needed.

## Research Task 3: Edge Case - Expiration vs. Order Confirmation

**Question**: What happens if a reservation expires at the exact millisecond an order is confirmed?

**Decision**: The "Commit Reservation" endpoint MUST also use an explicit database transaction with a pessimistic lock. It will verify that `status == 'ACTIVE'` AND `expiresAt > now()` *after* acquiring the lock. If it's expired, it throws a `409 Conflict` (or `410 Gone`), forcing the checkout to re-verify availability.
**Rationale**: The lock serializes the operations. Whichever operation (the Cron job expiring it, or the Checkout committing it) grabs the lock first wins. This guarantees no phantom reads or race conditions during the critical commit phase.

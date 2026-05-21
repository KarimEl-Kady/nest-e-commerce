# Implementation Plan: Inventory Module

**Branch**: `004-inventory-module` | **Date**: 2026-05-21 | **Spec**: [specs/004-inventory-module/spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-inventory-module/spec.md`

## Summary

The Inventory Module ensures e-commerce stock accuracy and prevents overselling by implementing a robust reservation system during checkout and an append-only ledger for administrative stock adjustments. High-concurrency race conditions are mitigated using row-level pessimistic locking (`FOR UPDATE`) within PostgreSQL transactions.

## Technical Context

**Language/Version**: TypeScript (Node.js)
**Primary Dependencies**: NestJS, @nestjs/schedule (for Cron Jobs)
**Storage**: PostgreSQL (via Prisma ORM)
**Testing**: Jest (Unit & E2E)
**Target Platform**: Node.js backend
**Project Type**: web-service (Modular Monolith)
**Performance Goals**: High-concurrency reservations under 100ms
**Constraints**: Absolute consistency (0% oversell rate)
**Scale/Scope**: Scales to thousands of concurrent checkout requests

## Constitution Check

*GATE: Passed*

- [x] Does the design align with a modular monolith architecture (no tight coupling)?
- [x] Are the DTOs strictly typed, and is the API fully documented with Swagger/OpenAPI (including auth metadata) for API-First Design?
- [x] Is data persistence managed through Prisma ORM with strict input validation?
- [x] Are core e-commerce transactions fully covered by tests?
- [x] Are there proper global exception filters and async operations for scalability?

## Project Structure

### Documentation (this feature)

```text
specs/004-inventory-module/
├── plan.md              # This file
├── research.md          # Technical decisions for concurrency & expiration
├── data-model.md        # Prisma extensions (Reservations, Ledger)
├── quickstart.md        # Manual testing guide
├── contracts/           # inventory-api.yaml
└── tasks.md             # (To be created)
```

### Source Code

```text
src/
├── inventory/
│   ├── inventory.module.ts
│   ├── inventory.controller.ts
│   ├── inventory.service.ts
│   ├── cron/
│   │   └── reservation-cleanup.cron.ts
│   └── dto/
│       ├── create-reservation.dto.ts
│       └── create-adjustment.dto.ts
```

**Structure Decision**: The feature is isolated within a new `src/inventory` module, aligning with the Modular Monolith pattern. The background expiration logic will sit inside a dedicated `cron` directory within the module.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Row-Level Locks | Preventing race conditions | Optimistic locking causes too many retry loops under high load; Redis locks introduce unnecessary infrastructure overhead. |
| Append-Only Ledger | Administrative accountability | Directly updating the `stock` integer without a log provides zero auditability for missing inventory. |

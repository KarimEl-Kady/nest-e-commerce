<!-- Sync Impact Report
- Version change: 1.0.0 → 1.1.0
- Modified principles:
  - II. API-First Design → added requirement for Swagger/OpenAPI documentation and auth metadata
- Added sections: None
- Removed sections: None
- Templates requiring updates:
  - ✅ updated: .specify/templates/plan-template.md 
- Follow-up TODOs: None
-->
# E-Commerce API Constitution

## Core Principles

### I. Modular Monolith Architecture
The system MUST be structured into clearly defined feature modules (e.g., Users, Products, Orders) to maintain separation of concerns. Modules should not tightly couple with each other; communication should happen through well-defined service interfaces or events.

### II. API-First Design
All business logic must be accessible via clear and documented REST or GraphQL endpoints. Endpoints MUST be documented using Swagger/OpenAPI, including authentication metadata (e.g., `@ApiBearerAuth`). Contracts (DTOs, Interfaces) MUST be strictly typed and validated using NestJS built-in pipes and class-validator.

### III. Data Integrity & Validation
Data persistence must be handled securely via Prisma ORM. Strict validation rules apply to all inputs. No business logic in controllers; all logic resides in injectable services.

### IV. Test-Driven Quality
Critical paths, particularly around core e-commerce transactions (checkout, inventory update, payments), MUST be covered by unit and integration tests (e2e) before merging.

### V. Scalability & Error Handling
Code MUST be asynchronous and avoid blocking the event loop. Global exception filters must be used to normalize error responses without leaking sensitive stack traces.

## Technology Standards

- Must use TypeScript with strict mode enabled.
- Code formatting enforced by Prettier/ESLint.
- Prisma as the ORM.
- Use NestJS dependency injection.

## Development Workflow

1. All new features require a plan/spec via Speckit.
2. PRs require passing tests and linter.
3. Follow semantic commit messages.

## Governance

Constitution supersedes local team practices. Any changes to these rules require bumping the `CONSTITUTION_VERSION` and consensus from the lead maintainers.

**Version**: 1.1.0 | **Ratified**: 2026-05-21 | **Last Amended**: 2026-05-21

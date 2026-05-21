# Implementation Plan: Identity & Access Management

**Branch**: `001-identity-access` | **Date**: 2026-05-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-identity-access/spec.md`

## Summary

Implement a complete Identity & Access Management (IAM) module for the NestJS e-commerce platform. The module provides user registration, JWT-based authentication with refresh token rotation, role-based access control (Customer / Manager / Admin), password recovery via email tokens, and security event auditing. All persistence is handled through Prisma ORM; all inputs are validated via class-validator DTOs.

## Technical Context

**Language/Version**: TypeScript 5.7+ (strict mode) on Node.js 22 LTS
**Primary Dependencies**: NestJS 11, @nestjs/jwt, @nestjs/passport, passport-jwt, passport-local, @nestjs/config, bcrypt, class-validator, class-transformer, @nestjs-modules/mailer (or nodemailer)
**Storage**: PostgreSQL via Prisma ORM
**Testing**: Jest 30 (unit) + Supertest 7 (e2e)
**Target Platform**: Linux server (containerised)
**Project Type**: REST web-service (modular monolith)
**Performance Goals**: Login < 200ms p95, Registration < 500ms p95
**Constraints**: Access tokens 15min TTL, Refresh tokens 7d TTL, bcrypt cost factor 12
**Scale/Scope**: 10k registered users initial target, 500 concurrent sessions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Does the design align with a modular monolith architecture (no tight coupling)?
  - IAM is a standalone NestJS module (`AuthModule`, `UsersModule`) with clear service interfaces. Other modules import only the exported guards/decorators.
- [x] Are the DTOs strictly typed and using class-validator for API-First Design?
  - All request bodies use class-validator decorated DTOs (`RegisterDto`, `LoginDto`, `ResetPasswordDto`, etc.).
- [x] Is data persistence managed through Prisma ORM with strict input validation?
  - Prisma schema defines User, RefreshToken, PasswordResetToken models. All writes go through Prisma Client.
- [x] Are core e-commerce transactions fully covered by tests?
  - Registration, login, token refresh, and RBAC enforcement are covered by unit + e2e tests.
- [x] Are there proper global exception filters and async operations for scalability?
  - Global `HttpExceptionFilter` normalises all error responses. All service methods are async. bcrypt hashing uses async APIs.

## Project Structure

### Documentation (this feature)

```text
specs/001-identity-access/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── auth-api.md      # REST endpoint contracts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app.module.ts                 # Root module — imports AuthModule, UsersModule, PrismaModule
├── main.ts                       # Bootstrap + global pipes/filters
│
├── prisma/
│   ├── prisma.module.ts          # Global Prisma module
│   ├── prisma.service.ts         # PrismaClient lifecycle wrapper
│   └── schema.prisma             # Prisma schema (User, RefreshToken, PasswordResetToken)
│
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   ├── current-user.decorator.ts
│   │   └── public.decorator.ts
│   └── enums/
│       └── role.enum.ts
│
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   ├── local.strategy.ts
│   │   └── jwt.strategy.ts
│   └── dto/
│       ├── register.dto.ts
│       ├── login.dto.ts
│       ├── refresh-token.dto.ts
│       ├── forgot-password.dto.ts
│       ├── reset-password.dto.ts
│       └── auth-response.dto.ts
│
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
│       ├── update-role.dto.ts
│       └── user-response.dto.ts
│
└── mail/
    ├── mail.module.ts
    └── mail.service.ts

test/
├── auth.e2e-spec.ts
└── users.e2e-spec.ts
```

**Structure Decision**: Single-project NestJS modular monolith. The IAM feature is split into three modules (`AuthModule`, `UsersModule`, `PrismaModule`) plus shared utilities in `common/`. A thin `MailModule` abstracts email dispatch behind an interface for testability. No frontend — this is a REST API service.

## Complexity Tracking

> No constitution violations detected — section intentionally left empty.

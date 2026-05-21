# Research: Identity & Access Management

**Feature**: 001-identity-access
**Date**: 2026-05-21

## 1. Password Hashing Algorithm

**Decision**: bcrypt with cost factor 12

**Rationale**: bcrypt is the industry standard for password hashing in Node.js applications. Cost factor 12 provides a good balance between security and performance (~250ms per hash on modern hardware). It is intentionally slow to resist brute-force attacks.

**Alternatives considered**:
- **argon2**: Winner of the Password Hashing Competition and technically superior (memory-hard). Rejected because the `argon2` npm package has native compilation dependencies that complicate Docker builds and CI. bcrypt's ecosystem maturity and simpler deployment outweigh argon2's marginal security advantage for this use case.
- **scrypt**: Built into Node.js crypto module. Rejected because it is less battle-tested in the NestJS ecosystem and offers no significant advantage over bcrypt for this workload.

## 2. JWT Token Strategy

**Decision**: Short-lived access tokens (15 min) + refresh token rotation (7 day max lifetime)

**Rationale**: Short-lived access tokens limit the damage window of a stolen token. Refresh token rotation (issuing a new refresh token with each refresh request and invalidating the old one) prevents replay attacks. If a stolen refresh token is reused, the rotation mechanism detects the anomaly because the legitimate user's next refresh will fail, signaling a compromise.

**Alternatives considered**:
- **Session-based authentication**: Server-side sessions with cookies. Rejected because stateful sessions add complexity for horizontal scaling (requires sticky sessions or a shared session store like Redis). JWT is a better fit for a modular monolith that may scale to microservices.
- **Opaque tokens with introspection**: Store tokens server-side and validate via DB lookup. Rejected due to the latency cost of a DB call per request. JWT's self-contained validation is more performant.

## 3. Refresh Token Storage

**Decision**: Store refresh tokens in the PostgreSQL database via Prisma

**Rationale**: Refresh tokens must be revocable (logout, password change). Database storage enables immediate invalidation. The refresh endpoint is called infrequently (every 15 min at most), so the DB lookup cost is acceptable. Storing in the same PostgreSQL instance avoids introducing a new dependency (Redis).

**Alternatives considered**:
- **Redis**: Faster lookups and built-in TTL expiration. Rejected because it introduces an additional infrastructure dependency. PostgreSQL is sufficient for the projected 500 concurrent sessions. Redis can be introduced later if scale demands it.
- **In-memory store**: Fast but not durable across restarts. Rejected immediately.

## 4. Email Delivery

**Decision**: `@nestjs-modules/mailer` wrapping Nodemailer, with SMTP transport (configurable to SendGrid/SES via SMTP relay)

**Rationale**: `@nestjs-modules/mailer` integrates natively with NestJS DI, supports Handlebars/EJS templates, and works with any SMTP-compatible provider. This avoids vendor lock-in. For development, a local SMTP trap (Mailhog/MailPit) can be used.

**Alternatives considered**:
- **SendGrid SDK directly**: Vendor-specific. Rejected to avoid lock-in and to keep the mail module swappable.
- **AWS SES SDK**: Same vendor-lock-in concern. SMTP relay to SES is supported by the chosen approach.

## 5. Role-Based Access Control Model

**Decision**: Enum-based roles stored on the User model, enforced via NestJS Guards and custom `@Roles()` decorator

**Rationale**: The spec requires only three roles (Customer, Manager, Admin). This is simple enough for an enum column on the User table rather than a separate roles/permissions junction table. A `RolesGuard` reads the `@Roles()` metadata from route handlers and compares against the authenticated user's role from the JWT payload.

**Alternatives considered**:
- **CASL/Ability-based (policy-based)**: Full attribute-based access control. Rejected as over-engineering for three static roles. Can be migrated to later if the permission model grows.
- **Separate Role and Permission tables**: Many-to-many relationships. Rejected for the same reason — unnecessary complexity for three roles.

## 6. Account Lockout Strategy

**Decision**: Track `failedLoginAttempts` and `lockedUntil` columns on the User model. Reset on successful login.

**Rationale**: Simple, database-backed lockout. After 5 failed attempts, set `lockedUntil = now + 15 minutes`. On each login attempt, check `lockedUntil` first. On successful login, reset `failedLoginAttempts` to 0 and clear `lockedUntil`.

**Alternatives considered**:
- **Redis-based rate limiting**: More sophisticated, supports distributed rate limiting. Rejected because a single-server PostgreSQL approach is sufficient for the current scale, and the lockout is per-account, not per-IP.
- **CAPTCHA after N attempts**: Complementary but out of scope per the spec.

## 7. Password Reset Token Design

**Decision**: Cryptographically random 64-byte hex token, stored hashed (SHA-256) in the database, with 1-hour expiry

**Rationale**: Storing the token hashed prevents an attacker with database read access from using reset tokens. The raw token is sent to the user via email; only the hash is stored. SHA-256 is appropriate here because the input is a high-entropy random string (not a low-entropy password).

**Alternatives considered**:
- **JWT-based reset tokens**: Self-contained, no DB lookup needed. Rejected because reset tokens must be single-use (invalidated after use), which requires server-side state anyway.
- **UUID v4**: Lower entropy (122 bits vs 256 bits). Acceptable but the hex approach is more standard for security tokens.

## 8. Security Event Logging

**Decision**: NestJS Logger (built-in) with structured JSON output for security events

**Rationale**: The built-in Logger is sufficient for MVP. Security events (login, logout, failed attempts, password changes, role changes) are logged as structured JSON with event type, user ID, IP address, timestamp, and outcome. These logs can be ingested by any log aggregation system (ELK, CloudWatch, Datadog).

**Alternatives considered**:
- **Dedicated audit table**: Persist audit events in the database. Adds write load and complexity. Rejected for MVP; can be added if compliance requirements demand it.
- **Winston/Pino**: More configurable loggers. Rejected because NestJS's built-in Logger wraps them anyway and is sufficient.

## Dependencies to Install

```bash
# Production
npm install @nestjs/jwt @nestjs/passport passport passport-jwt passport-local
npm install @prisma/client bcrypt class-validator class-transformer
npm install @nestjs/config @nestjs-modules/mailer nodemailer

# Development
npm install -D prisma @types/bcrypt @types/passport-jwt @types/passport-local @types/nodemailer
```

# Tasks: Identity & Access Management

**Input**: Design documents from `/specs/001-identity-access/`
**Prerequisites**: plan.md (✅), spec.md (✅), research.md (✅), data-model.md (✅), contracts/auth-api.md (✅)

**Tests**: Included — the spec mandates test-driven quality for critical auth paths (Constitution Principle IV).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — install dependencies and configure foundational tooling.

- [x] T001 Install production dependencies: `@nestjs/jwt @nestjs/passport passport passport-jwt passport-local @prisma/client bcrypt class-validator class-transformer @nestjs/config @nestjs-modules/mailer nodemailer`
- [x] T002 Install dev dependencies: `prisma @types/bcrypt @types/passport-jwt @types/passport-local @types/nodemailer`
- [x] T003 Create `.env` file with DATABASE_URL, JWT_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY, MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM, APP_URL per specs/001-identity-access/quickstart.md
- [x] T004 [P] Create Prisma schema at `prisma/schema.prisma` with User, RefreshToken, PasswordResetToken models per specs/001-identity-access/data-model.md
- [x] T005 [P] Create Role and AccountStatus enums in `src/common/enums/role.enum.ts`
- [x] T006 Run `npx prisma migrate dev --name init-iam` to generate and apply initial migration
- [x] T007 Run `npx prisma generate` to generate Prisma Client

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T008 Create PrismaModule at `src/prisma/prisma.module.ts` — global module exposing PrismaService
- [x] T009 Create PrismaService at `src/prisma/prisma.service.ts` — wraps PrismaClient with onModuleInit/onModuleDestroy lifecycle hooks
- [x] T010 [P] Create ConfigModule setup in `src/app.module.ts` — import `@nestjs/config` ConfigModule.forRoot() with isGlobal: true and validation
- [x] T011 [P] Create HttpExceptionFilter at `src/common/filters/http-exception.filter.ts` — global exception filter that normalises error responses per contracts/auth-api.md error format
- [x] T012 [P] Create `@Public()` decorator at `src/common/decorators/public.decorator.ts` — marks routes that skip JWT authentication
- [x] T013 [P] Create `@CurrentUser()` decorator at `src/common/decorators/current-user.decorator.ts` — extracts user from request object
- [x] T014 [P] Create `@Roles()` decorator at `src/common/decorators/roles.decorator.ts` — sets required roles via SetMetadata
- [x] T015 Register global ValidationPipe (whitelist, forbidNonWhitelisted, transform) and HttpExceptionFilter in `src/main.ts`, set global prefix to `api`
- [x] T016 Import PrismaModule into AppModule in `src/app.module.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — New Customer Registration (Priority: P1) 🎯 MVP

**Goal**: Allow new visitors to create accounts with email, password, and name. Return JWT tokens on success.

**Independent Test**: Register with valid data → receive tokens → access protected route.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T017 [P] [US1] Unit test for UsersService.create() in `src/users/users.service.spec.ts` — test user creation, duplicate email rejection, password hashing
- [x] T018 [P] [US1] Unit test for AuthService.register() in `src/auth/auth.service.spec.ts` — test registration flow, token generation, error handling

### Implementation for User Story 1

- [x] T019 [P] [US1] Create RegisterDto at `src/auth/dto/register.dto.ts` — email (IsEmail), password (MinLength 8, Matches regex for complexity), name (IsString, MinLength 1, MaxLength 100)
- [x] T020 [P] [US1] Create AuthResponseDto at `src/auth/dto/auth-response.dto.ts` — accessToken, refreshToken, user object
- [x] T021 [P] [US1] Create UserResponseDto at `src/users/dto/user-response.dto.ts` — id, email, name, role, createdAt (excludes hashedPassword)
- [x] T022 [US1] Create UsersModule at `src/users/users.module.ts` — imports PrismaModule, provides/exports UsersService
- [x] T023 [US1] Create UsersService at `src/users/users.service.ts` — create(dto) with bcrypt hashing (cost 12), findByEmail(), findById() methods using PrismaService
- [x] T024 [US1] Create AuthModule at `src/auth/auth.module.ts` — imports UsersModule, JwtModule.registerAsync (secret from config, 15m expiry), PassportModule
- [x] T025 [US1] Create AuthService at `src/auth/auth.service.ts` — register() method: validate unique email, hash password, create user via UsersService, generate access+refresh tokens, store refresh token hash in DB
- [x] T026 [US1] Create helper for refresh token generation and hashing in `src/auth/auth.service.ts` — crypto.randomBytes(64).toString('hex'), SHA-256 hash for storage
- [x] T027 [US1] Create AuthController at `src/auth/auth.controller.ts` — POST /auth/register endpoint using RegisterDto, returns AuthResponseDto (201)
- [x] T028 [US1] Import AuthModule and UsersModule into AppModule in `src/app.module.ts`

**Checkpoint**: Registration works end-to-end. A new user can register and receive JWT tokens.

---

## Phase 4: User Story 2 — Returning Customer Login (Priority: P1) 🎯 MVP

**Goal**: Authenticate returning users with email/password. Enforce account lockout after 5 failed attempts.

**Independent Test**: Login with valid credentials → receive tokens. Login 5x with wrong password → account locked for 15 min.

### Tests for User Story 2 ⚠️

- [x] T029 [P] [US2] Unit test for AuthService.login() in `src/auth/auth.service.spec.ts` — test valid login, invalid credentials (generic error), account lockout trigger at 5 attempts, lockout expiry
- [x] T030 [P] [US2] Unit test for LocalStrategy in `src/auth/strategies/local.strategy.spec.ts` — test credential validation delegation to AuthService

### Implementation for User Story 2

- [x] T031 [P] [US2] Create LoginDto at `src/auth/dto/login.dto.ts` — email (IsEmail), password (IsString, IsNotEmpty)
- [x] T032 [US2] Create LocalStrategy at `src/auth/strategies/local.strategy.ts` — extends PassportStrategy(Strategy, 'local'), validates credentials via AuthService.validateUser()
- [x] T033 [US2] Implement AuthService.validateUser() in `src/auth/auth.service.ts` — check account lockout status, verify password with bcrypt.compare(), increment failedLoginAttempts on failure, lock account after 5 failures (set lockedUntil = now + 15min), reset counter on success
- [x] T034 [US2] Implement AuthService.login() in `src/auth/auth.service.ts` — generate access+refresh tokens, store refresh token hash, return AuthResponseDto
- [x] T035 [US2] Create JwtStrategy at `src/auth/strategies/jwt.strategy.ts` — extends PassportStrategy(Strategy, 'jwt'), extracts JWT from Bearer header, validates payload, attaches user to request
- [x] T036 [US2] Create JwtAuthGuard at `src/common/guards/jwt-auth.guard.ts` — extends AuthGuard('jwt'), respects @Public() decorator to skip auth on public routes
- [x] T037 [US2] Add POST /auth/login endpoint to AuthController in `src/auth/auth.controller.ts` — uses LocalAuthGuard, returns AuthResponseDto (200), returns 423 for locked accounts
- [x] T038 [US2] Register JwtAuthGuard as global guard (APP_GUARD) in AuthModule providers in `src/auth/auth.module.ts`
- [x] T039 [US2] Mark POST /auth/register and POST /auth/login with @Public() decorator in `src/auth/auth.controller.ts`

**Checkpoint**: Login works. Account lockout enforced. JWT protects all routes globally (except @Public).

---

## Phase 5: User Story 3 — Role-Based Access Control (Priority: P2)

**Goal**: Enforce role-based access via guards. Admins can list users and assign roles.

**Independent Test**: Customer gets 403 on admin endpoints. Admin can list users and change roles.

### Tests for User Story 3 ⚠️

- [x] T040 [P] [US3] Unit test for RolesGuard in `src/common/guards/roles.guard.spec.ts` — test role matching, missing role metadata (allow), forbidden access
- [x] T041 [P] [US3] Unit test for UsersService role management in `src/users/users.service.spec.ts` — test updateRole(), findAll() with pagination

### Implementation for User Story 3

- [x] T042 [US3] Create RolesGuard at `src/common/guards/roles.guard.ts` — reads @Roles() metadata via Reflector, compares against user.role from JWT payload, returns 403 if mismatch
- [x] T043 [US3] Create UpdateRoleDto at `src/users/dto/update-role.dto.ts` — role (IsEnum(Role))
- [x] T044 [US3] Implement UsersService.findAll() in `src/users/users.service.ts` — paginated query with optional role filter, returns { data, total, page, limit }
- [x] T045 [US3] Implement UsersService.updateRole() in `src/users/users.service.ts` — find user by ID, update role, return updated user
- [x] T046 [US3] Create UsersController at `src/users/users.controller.ts` — GET /users/me (@CurrentUser), GET /users (@Roles(ADMIN) + pagination), PATCH /users/:id/role (@Roles(ADMIN))
- [x] T047 [US3] Add UsersController to UsersModule in `src/users/users.module.ts`

**Checkpoint**: RBAC enforced. Admin-only endpoints are protected. Role assignment works.

---

## Phase 6: User Story 4 — Password Recovery (Priority: P2)

**Goal**: Allow users to reset forgotten passwords via email with time-limited tokens.

**Independent Test**: Request reset → receive email with token → use token to set new password → login with new password.

### Tests for User Story 4 ⚠️

- [x] T048 [P] [US4] Unit test for AuthService.forgotPassword() and resetPassword() in `src/auth/auth.service.spec.ts` — test token generation, email dispatch, token validation, password update, session invalidation, anti-enumeration
- [x] T049 [P] [US4] Unit test for MailService in `src/mail/mail.service.spec.ts` — test email composition and send call

### Implementation for User Story 4

- [x] T050 [P] [US4] Create ForgotPasswordDto at `src/auth/dto/forgot-password.dto.ts` — email (IsEmail)
- [x] T051 [P] [US4] Create ResetPasswordDto at `src/auth/dto/reset-password.dto.ts` — token (IsString, Length 128), newPassword (same complexity rules as RegisterDto)
- [x] T052 [US4] Create MailModule at `src/mail/mail.module.ts` — imports MailerModule.forRootAsync (SMTP config from ConfigService), provides/exports MailService
- [x] T053 [US4] Create MailService at `src/mail/mail.service.ts` — sendPasswordResetEmail(email, token, name) method, constructs reset URL from APP_URL + token
- [x] T054 [US4] Implement AuthService.forgotPassword() in `src/auth/auth.service.ts` — generate 64-byte random token, store SHA-256 hash in PasswordResetToken table (1h expiry), send email via MailService. Always return success message regardless of email existence.
- [x] T055 [US4] Implement AuthService.resetPassword() in `src/auth/auth.service.ts` — hash submitted token with SHA-256, look up in DB, verify not expired and not used, hash new password with bcrypt, update user password, mark token as used, revoke all user's refresh tokens
- [x] T056 [US4] Add POST /auth/forgot-password and POST /auth/reset-password endpoints to AuthController in `src/auth/auth.controller.ts` — both marked @Public()
- [x] T057 [US4] Import MailModule into AuthModule in `src/auth/auth.module.ts`

**Checkpoint**: Password recovery works end-to-end. All sessions invalidated on reset.

---

## Phase 7: User Story 5 — Token Refresh & Session Management (Priority: P3)

**Goal**: Implement refresh token rotation and explicit logout with full token invalidation.

**Independent Test**: Use expired access token + valid refresh token → get new tokens. Logout → all tokens invalidated.

### Tests for User Story 5 ⚠️

- [x] T058 [P] [US5] Unit test for AuthService.refreshToken() and logout() in `src/auth/auth.service.spec.ts` — test token rotation, expired token rejection, logout token revocation

### Implementation for User Story 5

- [x] T059 [P] [US5] Create RefreshTokenDto at `src/auth/dto/refresh-token.dto.ts` — refreshToken (IsString, IsNotEmpty)
- [x] T060 [US5] Implement AuthService.refreshToken() in `src/auth/auth.service.ts` — hash token, verify exists/not revoked/not expired, revoke old token, generate new access+refresh token pair
- [x] T061 [US5] Implement AuthService.logout() in `src/auth/auth.service.ts` — hash token, mark as revoked in DB
- [x] T062 [US5] Add POST /auth/refresh (@Public) and POST /auth/logout (protected) endpoints to AuthController in `src/auth/auth.controller.ts`

**Checkpoint**: Token refresh rotation works. Logout fully invalidates sessions.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [x] T063 [P] Add security event logging across AuthService in `src/auth/auth.service.ts` — log login success/failure, registration, logout, password reset, role changes with user ID, IP, and timestamp
- [x] T063 [US1, US2, US4, US5] Write basic E2E test suite in `test/auth.e2e-spec.ts` covering registration, login, token refresh, forgot password, and logout flows
- [x] T064 Update `package.json` test scripts if necessary
- [x] T065 Run `npm run lint` and fix any issues
- [x] T066 Run `npm run test` and `npm run test:e2e` to verify full suite passes
- [x] T066 Verify quickstart.md workflow in `specs/001-identity-access/quickstart.md` — run all curl examples and confirm responses match contracts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 Registration (Phase 3)**: Depends on Foundational (Phase 2)
- **US2 Login (Phase 4)**: Depends on US1 (needs UsersService and AuthModule foundation)
- **US3 RBAC (Phase 5)**: Depends on US2 (needs JwtAuthGuard and login flow)
- **US4 Password Recovery (Phase 6)**: Depends on US1 (needs user creation and password hashing)
- **US5 Token Refresh (Phase 7)**: Depends on US2 (needs login and JWT infrastructure)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Foundation only — no other story dependencies
- **US2 (P1)**: Depends on US1 (UsersService, AuthModule)
- **US3 (P2)**: Depends on US2 (JwtAuthGuard must be global before RBAC)
- **US4 (P2)**: Depends on US1 (can run in parallel with US3 after US2 if US1 complete)
- **US5 (P3)**: Depends on US2 (token infrastructure)

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- DTOs before services
- Services before controllers
- Module wiring last
- Story complete before moving to next priority

### Parallel Opportunities

- T004, T005 can run in parallel (schema + enums are different files)
- T008–T016 foundational tasks: T010, T011, T012, T013, T014 can run in parallel
- Within each US: test tasks marked [P] can run in parallel
- Within each US: DTO tasks marked [P] can run in parallel
- US4 and US5 can potentially start in parallel once US2 is complete

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 — Registration
4. Complete Phase 4: User Story 2 — Login
5. **STOP and VALIDATE**: Register + Login works, JWT protects routes
6. Deploy/demo if ready — users can register and log in

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. + US1 → Registration MVP
3. + US2 → Login + JWT protection (full auth MVP!)
4. + US3 → RBAC enforcement
5. + US4 → Password recovery
6. + US5 → Token refresh + session management
7. + Polish → Security logging, e2e tests

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

# Feature Specification: Identity & Access Management

**Feature Branch**: `001-identity-access`
**Created**: 2026-05-21
**Status**: Draft
**Input**: User description: "e-commerce Identity & Access"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New Customer Registration (Priority: P1)

A new visitor arrives at the e-commerce platform and wants to create an account so they can browse products, add items to a cart, and place orders. They provide their email address, a password, and basic profile information (name). Upon successful registration, they receive a confirmation email and are automatically logged in.

**Why this priority**: Registration is the gateway to all authenticated functionality. Without it, no other identity feature can be used. It directly enables customer acquisition.

**Independent Test**: Can be fully tested by submitting a registration form with valid data and verifying the user can immediately access their account dashboard. Delivers immediate value by enabling account creation.

**Acceptance Scenarios**:

1. **Given** a visitor with no existing account, **When** they submit valid registration details (email, password, name), **Then** their account is created, a welcome/confirmation email is sent, and they are redirected to their account dashboard in a logged-in state.
2. **Given** a visitor attempts to register, **When** they provide an email address already associated with an existing account, **Then** the system displays a clear error message indicating the email is already in use without revealing account details.
3. **Given** a visitor submits registration, **When** the password does not meet complexity requirements (minimum 8 characters, at least one uppercase, one lowercase, one digit), **Then** the system displays specific validation feedback before submission is processed.
4. **Given** a visitor submits registration, **When** the email format is invalid, **Then** the system rejects the submission with a clear error message.

---

### User Story 2 - Returning Customer Login (Priority: P1)

A registered customer returns to the platform and wants to log in using their email and password. Upon successful authentication, they receive a session token that grants access to their account, order history, saved addresses, and other personalized features.

**Why this priority**: Login is equally critical to registration — it is the primary means for returning customers to access their data and complete purchases. It is the most frequently used identity action.

**Independent Test**: Can be tested by providing valid credentials and verifying a session/token is issued, then accessing a protected resource successfully.

**Acceptance Scenarios**:

1. **Given** a registered user with valid credentials, **When** they submit their email and password, **Then** they receive an authentication token and are redirected to their previous location or the home page.
2. **Given** a user submits login, **When** the email does not match any account, **Then** the system returns a generic "Invalid credentials" error (not "Email not found") to prevent user enumeration.
3. **Given** a user submits login, **When** the password is incorrect, **Then** the system returns the same generic "Invalid credentials" error.
4. **Given** a user has failed login 5 times consecutively, **When** they attempt again, **Then** the system temporarily locks the account for 15 minutes and notifies the user.

---

### User Story 3 - Role-Based Access Control (Priority: P2)

An administrator needs to assign roles (e.g., Customer, Admin, Manager) to users so that different parts of the system enforce appropriate access restrictions. Customers can only access their own data; Admins can manage products, orders, and users; Managers have intermediate permissions.

**Why this priority**: Role-based access is essential for multi-tenant security and for enabling admin-facing features, but registration and login must exist first. It builds on the identity foundation.

**Independent Test**: Can be tested by assigning different roles to test users and verifying that protected endpoints correctly allow or deny access based on the user's role.

**Acceptance Scenarios**:

1. **Given** a user with the "Customer" role, **When** they attempt to access an admin-only endpoint (e.g., manage products), **Then** the system returns a 403 Forbidden response.
2. **Given** a user with the "Admin" role, **When** they access user management endpoints, **Then** the system grants full access and returns the requested data.
3. **Given** an Admin, **When** they assign a role to another user, **Then** the target user's permissions are updated immediately and reflected on their next request.

---

### User Story 4 - Password Recovery (Priority: P2)

A registered customer has forgotten their password and wants to reset it. They request a password reset link via their email, receive a time-limited token, and use it to set a new password.

**Why this priority**: Password recovery is a critical self-service feature that reduces support burden and prevents permanent account lockout. It depends on the email/identity infrastructure from registration.

**Independent Test**: Can be tested by requesting a reset for a valid email, verifying the token is received, and using it to set a new password, then logging in with the new password.

**Acceptance Scenarios**:

1. **Given** a registered user, **When** they request a password reset with their email, **Then** the system sends a reset link containing a unique, time-limited token (valid for 1 hour) to their email address.
2. **Given** a user with a valid reset token, **When** they submit a new password that meets complexity requirements, **Then** the password is updated and all existing sessions are invalidated.
3. **Given** a user, **When** they attempt to use an expired or already-used reset token, **Then** the system rejects the request with a clear message and prompts them to request a new reset.
4. **Given** someone requests a reset for an email that doesn't exist, **When** the request is processed, **Then** the system responds with the same success message as a valid request to prevent user enumeration.

---

### User Story 5 - Token Refresh & Session Management (Priority: P3)

An authenticated user's access token expires during an active session. The system uses a refresh token mechanism to seamlessly issue a new access token without requiring the user to log in again, ensuring uninterrupted usage.

**Why this priority**: Session management improves user experience for long sessions but is not strictly needed for MVP functionality. It enhances security posture by enabling short-lived access tokens.

**Independent Test**: Can be tested by using an expired access token alongside a valid refresh token and verifying a new access token is issued without re-authentication.

**Acceptance Scenarios**:

1. **Given** a user with an expired access token but a valid refresh token, **When** they request a token refresh, **Then** the system issues a new access token and a new refresh token, invalidating the old refresh token (rotation).
2. **Given** a user with an expired or invalid refresh token, **When** they request a token refresh, **Then** the system returns a 401 Unauthorized response requiring full re-authentication.
3. **Given** a user who explicitly logs out, **When** the logout is processed, **Then** all associated tokens (access and refresh) are invalidated immediately.

---

### Edge Cases

- What happens when a user registers and immediately tries to log in before email confirmation (if email verification becomes required)?
- How does the system handle concurrent login attempts from multiple devices?
- What happens if a password reset is requested while the user is currently logged in?
- How does the system handle token refresh when the refresh token is used from a different IP or device fingerprint?
- What happens when an admin demotes themselves from the Admin role?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow new users to register with email, password, and name.
- **FR-002**: System MUST validate email format and uniqueness during registration.
- **FR-003**: System MUST enforce password complexity (min 8 characters, at least 1 uppercase, 1 lowercase, 1 digit).
- **FR-004**: System MUST securely hash passwords before storage (never store plaintext).
- **FR-005**: System MUST authenticate users via email and password, returning JWT-based access and refresh tokens.
- **FR-006**: System MUST implement account lockout after 5 consecutive failed login attempts, with a 15-minute cooldown.
- **FR-007**: System MUST support role-based access control with at least three roles: Customer, Manager, Admin.
- **FR-008**: System MUST allow Admins to assign and modify user roles.
- **FR-009**: System MUST generate time-limited password reset tokens (1-hour expiry) and deliver them via email.
- **FR-010**: System MUST invalidate all existing sessions when a password is changed or reset.
- **FR-011**: System MUST implement refresh token rotation — issuing a new refresh token with each refresh request and invalidating the previous one.
- **FR-012**: System MUST provide a logout endpoint that invalidates all tokens for the session.
- **FR-013**: System MUST return generic error messages for failed authentication to prevent user enumeration.
- **FR-014**: System MUST log all security-relevant events (login, logout, failed attempts, password changes, role changes).

### Non-Functional Requirements (Architecture Constraints)

- **NFR-001**: System MUST be implemented as a Modular Monolith using NestJS.
- **NFR-002**: All data persistence MUST utilize Prisma ORM.
- **NFR-003**: API interfaces MUST be strictly typed and validated using `class-validator`.
- **NFR-004**: System MUST employ asynchronous, non-blocking code and use global exception filters.

### Key Entities

- **User**: Represents a registered customer or staff member. Key attributes: unique identifier, email (unique), hashed password, name, role, account status (active/locked), failed login count, creation/update timestamps.
- **Role**: Represents a permission level within the system. Key attributes: name (Customer, Manager, Admin), associated permission set.
- **RefreshToken**: Represents an active refresh token tied to a user session. Key attributes: token value (unique), associated user, expiration timestamp, revoked status, device/IP metadata.
- **PasswordResetToken**: Represents a one-time-use token for password recovery. Key attributes: token value (unique), associated user, expiration timestamp, used status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the registration process (form submission to logged-in dashboard) in under 30 seconds.
- **SC-002**: Login response time (credentials submitted to token received) is under 2 seconds for 95% of requests.
- **SC-003**: 99% of password reset emails are delivered within 60 seconds of request.
- **SC-004**: Account lockout engages correctly after exactly 5 failed attempts, with zero false-positive lockouts on valid credentials.
- **SC-005**: Role-based access enforcement has a 0% bypass rate — unauthorized access attempts are always denied.
- **SC-006**: Token refresh succeeds seamlessly without user intervention in 99.9% of active sessions.
- **SC-007**: All security events are logged with no gaps — 100% audit trail coverage for login, logout, password changes, and role modifications.

## Assumptions

- Users have stable internet connectivity and access to their registered email for verification and password recovery.
- The system will use JWT (JSON Web Tokens) for stateless access token authentication, with short-lived access tokens (15 minutes) and longer-lived refresh tokens (7 days).
- Email delivery is handled by an external email service (e.g., SendGrid, AWS SES) — the IAM module is responsible for composing and dispatching the request, not the delivery infrastructure itself.
- Social login (Google, Facebook, Apple) is out of scope for this feature and will be addressed in a future iteration.
- Multi-factor authentication (MFA/2FA) is out of scope for this feature.
- The default role for new registrations is "Customer" unless explicitly assigned otherwise by an Admin.
- Rate limiting on authentication endpoints is handled at the infrastructure/gateway level, not within the IAM module itself (beyond account lockout).

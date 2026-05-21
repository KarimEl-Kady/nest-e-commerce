# API Contracts: Identity & Access Management

**Feature**: 001-identity-access
**Date**: 2026-05-21
**Base Path**: `/api`

## Authentication Endpoints

### POST /auth/register

Register a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass1",
  "name": "Jane Doe"
}
```

**Validation**:
| Field | Rules |
|-------|-------|
| `email` | Required. Valid email format. Unique. |
| `password` | Required. Min 8 chars, 1 uppercase, 1 lowercase, 1 digit. |
| `name` | Required. 1–100 characters. Trimmed. |

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 201 | `{ "accessToken": "...", "refreshToken": "...", "user": { "id", "email", "name", "role" } }` | Success |
| 409 | `{ "statusCode": 409, "message": "Email already in use" }` | Duplicate email |
| 400 | `{ "statusCode": 400, "message": ["...validation errors"] }` | Invalid input |

---

### POST /auth/login

Authenticate with email and password.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass1"
}
```

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `{ "accessToken": "...", "refreshToken": "...", "user": { "id", "email", "name", "role" } }` | Success |
| 401 | `{ "statusCode": 401, "message": "Invalid credentials" }` | Wrong email or password |
| 423 | `{ "statusCode": 423, "message": "Account temporarily locked. Try again after [time]." }` | Account locked (5 failed attempts) |

---

### POST /auth/refresh

Refresh an expired access token using a valid refresh token.

**Request Body**:
```json
{
  "refreshToken": "..."
}
```

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `{ "accessToken": "...", "refreshToken": "..." }` | Success (old refresh token rotated) |
| 401 | `{ "statusCode": 401, "message": "Invalid or expired refresh token" }` | Token invalid/expired/revoked |

---

### POST /auth/logout

Invalidate all tokens for the current session. **Requires**: Bearer token.

**Headers**: `Authorization: Bearer <accessToken>`

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `{ "message": "Logged out successfully" }` | Success |
| 401 | `{ "statusCode": 401, "message": "Unauthorized" }` | No/invalid token |

---

### POST /auth/forgot-password

Request a password reset email. Always returns 200 to prevent user enumeration.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `{ "message": "If an account with that email exists, a reset link has been sent." }` | Always (regardless of email existence) |

---

### POST /auth/reset-password

Reset password using a valid reset token.

**Request Body**:
```json
{
  "token": "raw-hex-token-from-email-link",
  "newPassword": "NewSecurePass1"
}
```

**Validation**:
| Field | Rules |
|-------|-------|
| `token` | Required. 128-char hex string. |
| `newPassword` | Required. Same complexity rules as registration. |

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `{ "message": "Password reset successfully" }` | Success (all sessions invalidated) |
| 400 | `{ "statusCode": 400, "message": "Invalid or expired reset token" }` | Token expired/used/invalid |

---

## User Management Endpoints

### GET /users/me

Get the current authenticated user's profile. **Requires**: Bearer token.

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `{ "id", "email", "name", "role", "createdAt" }` | Success |
| 401 | `{ "statusCode": 401, "message": "Unauthorized" }` | No/invalid token |

---

### GET /users

List all users. **Requires**: Bearer token + Admin role.

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `role` | string | — | Filter by role |

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `{ "data": [...users], "total": N, "page": N, "limit": N }` | Success |
| 403 | `{ "statusCode": 403, "message": "Forbidden" }` | Non-admin user |

---

### PATCH /users/:id/role

Update a user's role. **Requires**: Bearer token + Admin role.

**Request Body**:
```json
{
  "role": "MANAGER"
}
```

**Validation**:
| Field | Rules |
|-------|-------|
| `role` | Required. One of: `CUSTOMER`, `MANAGER`, `ADMIN`. |

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `{ "id", "email", "name", "role" }` | Success |
| 403 | `{ "statusCode": 403, "message": "Forbidden" }` | Non-admin user |
| 404 | `{ "statusCode": 404, "message": "User not found" }` | Invalid user ID |

---

## JWT Payload Structure

```json
{
  "sub": "user-cuid",
  "email": "user@example.com",
  "role": "CUSTOMER",
  "iat": 1716300000,
  "exp": 1716300900
}
```

## Common Headers

| Header | Value | Required For |
|--------|-------|-------------|
| `Content-Type` | `application/json` | All requests with body |
| `Authorization` | `Bearer <accessToken>` | All protected endpoints |

## Error Response Format

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Human-readable error message",
  "error": "Bad Request"
}
```

Validation errors return an array of messages:

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password is too short"
  ],
  "error": "Bad Request"
}
```

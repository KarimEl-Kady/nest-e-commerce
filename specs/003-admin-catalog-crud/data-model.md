# Phase 1: Data Model

## Entities

### Category
- `id`: String (CUID/UUID) - Primary Key
- `name`: String - Unique
- `description`: String - Optional
- `createdAt`: DateTime
- `updatedAt`: DateTime
- **Relationships**: One-to-Many with Products

### Product
- `id`: String (CUID/UUID) - Primary Key
- `title`: String
- `description`: String
- `price`: Decimal (Scale 2, Precision 10)
- `categoryId`: String - Foreign Key
- `published_status`: Boolean - Default: false
- `isDeleted`: Boolean - Default: false (Soft Delete)
- `deletedAt`: DateTime - Optional
- `createdAt`: DateTime
- `updatedAt`: DateTime
- **Relationships**: Many-to-One with Category

## Validation Rules
- `price` must be a positive decimal number.
- `title` and `name` must not be empty.
- When `isDeleted` is true, the product is hidden from customer-facing endpoints.
- Categories cannot be deleted if they have associated products (handled via foreign key constraints).

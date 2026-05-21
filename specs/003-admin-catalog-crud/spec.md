# Feature Specification: Admin Catalog CRUD

**Feature Branch**: `003-admin-catalog-crud`  
**Created**: 2026-05-21  
**Status**: Draft  
**Input**: User description: "creating the admin user story that access the curd of the catogries and products to can add them to help the customet previewing them "

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Category Management (Priority: P1)

An administrator accesses the category management interface to create, read, update, and delete product categories. This allows them to logically organize the catalog so customers can easily find and preview products.

**Why this priority**: Categories must exist before products can be logically grouped and displayed to customers.
**Independent Test**: Can be tested by creating a new category, viewing it in the list, updating its name, and deleting it.

**Acceptance Scenarios**:
1. **Given** an admin user, **When** they submit a valid category name, **Then** the category is created.
2. **Given** an admin user, **When** they update an existing category, **Then** the changes are saved.
3. **Given** an admin user, **When** they delete a category without products, **Then** the category is removed.

---

### User Story 2 - Admin Product Management (Priority: P1)

An administrator accesses the product management interface to create, read, update, and delete products, assigning them to categories. This ensures products are available for customer preview and purchase.

**Why this priority**: Products are the core entity of the e-commerce system.
**Independent Test**: Can be tested by adding a new product to an existing category and verifying it appears in the catalog for customers.

**Acceptance Scenarios**:
1. **Given** an admin user, **When** they submit a product with title, description, price, and category, **Then** the product is created.
2. **Given** an admin user, **When** they modify a product's price, **Then** the new price is reflected immediately in the customer preview.
3. **Given** an admin user, **When** they soft-delete a product, **Then** the product is hidden from the customer preview.

---

### Edge Cases

- What happens if an admin tries to delete a category that currently contains active products?
- How does the system handle concurrent updates to the same product by two different admins?
- How are products with missing images handled when a customer tries to preview them?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users with the ADMIN role to create, read, update, and delete categories.
- **FR-002**: System MUST allow users with the ADMIN role to create, read, update, and soft-delete products.
- **FR-003**: System MUST enforce that products belong to at least one category.
- **FR-004**: System MUST ensure products added by admins are immediately available for customer preview.
- **FR-005**: System MUST prevent standard customers from accessing the CRUD management actions.

### Non-Functional Requirements (Architecture Constraints)

- **NFR-001**: System MUST be implemented as a Modular Monolith using NestJS.
- **NFR-002**: All data persistence MUST utilize Prisma ORM.
- **NFR-003**: API interfaces MUST be strictly typed and validated using `class-validator`, and fully documented via Swagger/OpenAPI.
- **NFR-004**: System MUST employ asynchronous, non-blocking code and use global exception filters.

### Key Entities

- **Category**: Grouping mechanism. Attributes: id, name, description.
- **Product**: Sellable item. Attributes: id, title, description, price, categoryId, published_status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can successfully create a new category and add a product to it in under 2 minutes.
- **SC-002**: 100% of published products added by admins are visible in the customer preview catalog within 1 second of creation.
- **SC-003**: Unauthorized users have a 0% success rate when attempting to access the Admin CRUD actions.

## Assumptions

- The Identity & Access Management system is already implemented to verify ADMIN roles.
- Admin dashboard UI implementation is out of scope; this specifies the API/backend capabilities.

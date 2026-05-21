# Phase 0: Outline & Research

## Edge Cases & Clarifications

1. **Category Deletion with Active Products**
   - *Decision*: Restrict deletion of categories that have linked products. The API should return a `409 Conflict` if an admin attempts to delete a category that still contains products.
   - *Rationale*: Prevents orphaned products and ensures data integrity.
   - *Alternatives considered*: Cascading delete (too destructive), moving products to an "Uncategorized" bucket (adds unnecessary complexity).

2. **Concurrent Updates**
   - *Decision*: "Last write wins" with standard database locks via Prisma. No optimistic concurrency control (versioning) will be implemented for V1 to keep it simple.
   - *Rationale*: Admin catalog updates are infrequent enough that strict optimistic locking is premature for the MVP.

3. **Missing Product Images**
   - *Decision*: Store images as an array of URLs. If empty, the API will just return an empty array `[]` or `null`. The frontend must render a placeholder. 
   - *Rationale*: Separation of concerns; the API should serve the data as-is without mocking image URLs.

## Dependency Best Practices
- NestJS global exception filters will catch Prisma exceptions (e.g. `P2003` for foreign key constraints on category deletion) and transform them into standard HTTP `409 Conflict` errors.
- Authentication will be enforced via the `@Roles(Role.ADMIN)` guard inherited from the IAM module.
- OpenAPI/Swagger `@ApiBearerAuth()` will be actively applied to ensure the interactive documentation requires the JWT token.

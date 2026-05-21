# Quickstart: Admin Catalog CRUD

## Local Setup
1. Ensure the PostgreSQL database is running.
2. Apply Prisma schema updates: `npx prisma db push` or `npx prisma migrate dev`.
3. Generate Prisma client: `npx prisma generate`.

## Testing
- Run E2E tests for the new Admin endpoints: `npm run test:e2e`

## Manual Verification
1. Start the dev server: `npm run start:dev`
2. Login as an Admin user to obtain the JWT token (`POST /api/auth/login`).
3. Navigate to `http://localhost:3000/api/docs` to view the Swagger UI.
4. Authorize via the UI using the Bearer token.
5. Execute `POST /api/categories` to create a category.
6. Execute `POST /api/products` using the category ID to create a product.
7. Verify the product is visible to standard users.

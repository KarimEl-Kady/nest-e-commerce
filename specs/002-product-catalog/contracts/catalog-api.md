# API Contracts: Product Catalog

**Feature**: 002-product-catalog
**Date**: 2026-05-21
**Base Path**: `/api`

## Product Endpoints

### GET /products

List published products (public). Supports search, filtering, sorting, and pagination.

**Auth**: None required (public endpoint, `@Public()`)

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `limit` | number | 20 | Items per page (max 100) |
| `sort` | string | `createdAt` | Sort field: `price`, `name`, `createdAt` |
| `order` | string | `desc` | Sort direction: `asc`, `desc` |
| `search` | string | — | Full-text search query (name + description) |
| `categoryId` | string | — | Filter by category ID |
| `minPrice` | number | — | Minimum price filter |
| `maxPrice` | number | — | Maximum price filter |
| `inStock` | boolean | — | Filter to only in-stock products (`stock > 0`) |

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `{ "data": [...products], "total": N, "page": N, "limit": N }` | Success |

**Product item shape in listing**:
```json
{
  "id": "cuid",
  "name": "Product Name",
  "description": "Short description...",
  "price": "29.99",
  "stock": 42,
  "images": ["https://cdn.example.com/thumb.jpg"],
  "category": { "id": "cuid", "name": "Electronics" },
  "createdAt": "2026-05-21T12:00:00.000Z"
}
```

---

### GET /products/:id

Get full product details (public).

**Auth**: None required (public endpoint, `@Public()`)

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | Full product object (see below) | Success |
| 404 | `{ "statusCode": 404, "message": "Product not found" }` | Invalid ID or soft-deleted/unpublished product |

**Full product object**:
```json
{
  "id": "cuid",
  "name": "Product Name",
  "description": "Full product description with all details...",
  "price": "29.99",
  "stock": 42,
  "images": [
    "https://cdn.example.com/img1.jpg",
    "https://cdn.example.com/img2.jpg"
  ],
  "sku": "WH-100X",
  "published": true,
  "category": { "id": "cuid", "name": "Electronics" },
  "createdAt": "2026-05-21T12:00:00.000Z",
  "updatedAt": "2026-05-21T12:00:00.000Z"
}
```

---

### POST /products

Create a new product. **Requires**: Bearer token + Admin or Manager role.

**Request Body**:
```json
{
  "name": "Wireless Headphones",
  "description": "Premium noise-cancelling wireless headphones...",
  "price": 79.99,
  "stock": 150,
  "images": ["https://cdn.example.com/headphones1.jpg"],
  "sku": "WH-100X",
  "published": true,
  "categoryId": "category-cuid"
}
```

**Validation**:

| Field | Rules |
|-------|-------|
| `name` | Required. 1–255 characters. |
| `description` | Optional. Max 5000 characters. |
| `price` | Required. Positive number. Max 2 decimal places. |
| `stock` | Required. Non-negative integer. |
| `images` | Optional. Array of valid URLs. Max 10 items. |
| `sku` | Optional. Max 50 characters. Must be unique. |
| `published` | Optional. Boolean. Default: `true`. |
| `categoryId` | Optional. Must reference an existing category. |

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 201 | Full product object | Success |
| 400 | `{ "statusCode": 400, "message": ["...validation errors"] }` | Invalid input |
| 403 | `{ "statusCode": 403, "message": "Forbidden" }` | Insufficient role |
| 409 | `{ "statusCode": 409, "message": "SKU already in use" }` | Duplicate SKU |

---

### PATCH /products/:id

Update an existing product. **Requires**: Bearer token + Admin or Manager role.

**Request Body** (all fields optional):
```json
{
  "name": "Updated Name",
  "price": 89.99,
  "stock": 200,
  "published": false
}
```

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | Updated product object | Success |
| 400 | `{ "statusCode": 400, "message": ["...validation errors"] }` | Invalid input |
| 403 | `{ "statusCode": 403, "message": "Forbidden" }` | Insufficient role |
| 404 | `{ "statusCode": 404, "message": "Product not found" }` | Invalid ID |

---

### DELETE /products/:id

Soft-delete a product. **Requires**: Bearer token + Admin or Manager role.

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `{ "message": "Product deleted successfully" }` | Success |
| 403 | `{ "statusCode": 403, "message": "Forbidden" }` | Insufficient role |
| 404 | `{ "statusCode": 404, "message": "Product not found" }` | Invalid ID or already deleted |

---

## Category Endpoints

### GET /categories

List all categories (public).

**Auth**: None required (public endpoint, `@Public()`)

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `[{ "id": "cuid", "name": "Electronics", "description": "...", "_count": { "products": 42 } }]` | Success |

---

### POST /categories

Create a new category. **Requires**: Bearer token + Admin role.

**Request Body**:
```json
{
  "name": "Electronics",
  "description": "Electronic devices and accessories"
}
```

**Validation**:

| Field | Rules |
|-------|-------|
| `name` | Required. 1–100 characters. Must be unique. |
| `description` | Optional. Max 500 characters. |

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 201 | Full category object | Success |
| 400 | `{ "statusCode": 400, "message": ["...validation errors"] }` | Invalid input |
| 403 | `{ "statusCode": 403, "message": "Forbidden" }` | Insufficient role |
| 409 | `{ "statusCode": 409, "message": "Category name already exists" }` | Duplicate name |

---

### PATCH /categories/:id

Update a category. **Requires**: Bearer token + Admin role.

**Request Body** (all fields optional):
```json
{
  "name": "Updated Category Name",
  "description": "Updated description"
}
```

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | Updated category object | Success |
| 400 | `{ "statusCode": 400, "message": ["...validation errors"] }` | Invalid input |
| 403 | `{ "statusCode": 403, "message": "Forbidden" }` | Insufficient role |
| 404 | `{ "statusCode": 404, "message": "Category not found" }` | Invalid ID |

---

### DELETE /categories/:id

Delete a category. **Requires**: Bearer token + Admin role. Products in this category will have their `categoryId` set to null.

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `{ "message": "Category deleted successfully" }` | Success |
| 403 | `{ "statusCode": 403, "message": "Forbidden" }` | Insufficient role |
| 404 | `{ "statusCode": 404, "message": "Category not found" }` | Invalid ID |

---

## DTO Schemas

### CreateProductDto

```typescript
{
  name: string;         // @IsString, @MinLength(1), @MaxLength(255)
  description?: string; // @IsOptional, @IsString, @MaxLength(5000)
  price: number;        // @IsNumber, @IsPositive, @Max(99999999.99)
  stock: number;        // @IsInt, @Min(0)
  images?: string[];    // @IsOptional, @IsArray, @IsUrl({}, { each: true }), @ArrayMaxSize(10)
  sku?: string;         // @IsOptional, @IsString, @MaxLength(50)
  published?: boolean;  // @IsOptional, @IsBoolean
  categoryId?: string;  // @IsOptional, @IsString
}
```

### UpdateProductDto

Same as CreateProductDto but all fields optional (PartialType).

### ProductQueryDto

```typescript
{
  page?: number;        // @IsOptional, @IsInt, @Min(1), default 1
  limit?: number;       // @IsOptional, @IsInt, @Min(1), @Max(100), default 20
  sort?: string;        // @IsOptional, @IsIn(['price', 'name', 'createdAt'])
  order?: string;       // @IsOptional, @IsIn(['asc', 'desc'])
  search?: string;      // @IsOptional, @IsString
  categoryId?: string;  // @IsOptional, @IsString
  minPrice?: number;    // @IsOptional, @IsNumber, @Min(0)
  maxPrice?: number;    // @IsOptional, @IsNumber, @Min(0)
  inStock?: boolean;    // @IsOptional, @IsBoolean
}
```

### CreateCategoryDto

```typescript
{
  name: string;         // @IsString, @MinLength(1), @MaxLength(100)
  description?: string; // @IsOptional, @IsString, @MaxLength(500)
}
```

### UpdateCategoryDto

Same as CreateCategoryDto but all fields optional (PartialType).

## Error Response Format

Consistent with the IAM module — all errors follow:

```json
{
  "statusCode": 400,
  "message": "Human-readable error message",
  "error": "Bad Request"
}
```

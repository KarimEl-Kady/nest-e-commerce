# Data Model: Inventory Module

This document outlines the database schema updates required to support the Inventory module, specifically addressing reservations and audit tracking.

## Prisma Schema Additions

### Enums

```prisma
enum ReservationStatus {
  ACTIVE
  COMMITTED
  EXPIRED
}
```

### Models

#### Product (Existing - to be referenced)
The existing `Product` model contains a `stock` field (Int) which represents the **Physical Stock**.
*No structural changes needed for the `Product` model itself, but business logic will calculate Available Stock as `Product.stock - SUM(ACTIVE reservations)`.*

#### StockReservation (New)
Represents a temporary hold on inventory during the checkout process.

```prisma
model StockReservation {
  id          String            @id @default(cuid())
  productId   String
  product     Product           @relation(fields: [productId], references: [id], onDelete: Cascade)
  userId      String?           // Nullable if supporting guest checkout
  quantity    Int
  status      ReservationStatus @default(ACTIVE)
  expiresAt   DateTime
  
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@index([productId, status])
  @@index([expiresAt, status])
  @@map("stock_reservations")
}
```

*(Note: We will need to add `reservations StockReservation[]` to the `Product` model.)*

#### InventoryLedger (New)
An append-only audit log tracking all permanent changes to the physical stock.

```prisma
model InventoryLedger {
  id             String   @id @default(cuid())
  productId      String
  product        Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  quantityChange Int      // Positive for restocks, negative for damages/orders
  reason         String   // e.g., "RESTOCK", "DAMAGED", "ORDER_COMPLETED"
  adminId        String?  // Nullable if the system triggered it (e.g., an order)
  
  createdAt      DateTime @default(now())

  @@index([productId])
  @@map("inventory_ledger")
}
```

*(Note: We will need to add `inventoryLedger InventoryLedger[]` to the `Product` model.)*

## Data Integrity Constraints
1. **Pessimistic Locking**: When creating a `StockReservation` or an `InventoryLedger` entry that updates the `Product.stock`, developers MUST use `$transaction` with `prisma.$executeRaw('SELECT * FROM products WHERE id = $1 FOR UPDATE', [productId])` to lock the product row until the transaction commits.
2. **Append-Only**: The `InventoryLedger` table should never have records updated or deleted. Reversals must be implemented as new, opposite-sign records.

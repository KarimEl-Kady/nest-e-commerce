# Quickstart: Testing the Inventory Module

This guide provides steps to manually verify the Inventory module once implemented.

## Prerequisites
- The server is running (`npm run start:dev`)
- You have an Admin JWT token (for adjustments)
- You have a regular User JWT token (for reservations)
- A Product exists in the database. Replace `[PRODUCT_ID]` with its actual ID.

## 1. Add Physical Stock (Admin)

Provide physical stock to the product using the admin adjustment endpoint.

```bash
curl -X POST http://localhost:3000/api/inventory/adjustments \
  -H "Authorization: Bearer [ADMIN_JWT_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "[PRODUCT_ID]",
    "quantityChange": 50,
    "reason": "Initial Restock"
  }'
```

## 2. Check Available Stock

Verify that the available stock is 50.

```bash
curl -X GET http://localhost:3000/api/inventory/availability/[PRODUCT_ID]
```

*Expected output: `{"physicalStock": 50, "activeReservations": 0, "availableStock": 50}`*

## 3. Create a Reservation (Customer)

Reserve 5 items as a customer starting checkout.

```bash
curl -X POST http://localhost:3000/api/inventory/reservations \
  -H "Authorization: Bearer [USER_JWT_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "[PRODUCT_ID]",
    "quantity": 5
  }'
```
*Note the `id` returned from this request as `[RESERVATION_ID]`.*

## 4. Re-check Available Stock

Verify that available stock dropped to 45.

```bash
curl -X GET http://localhost:3000/api/inventory/availability/[PRODUCT_ID]
```

*Expected output: `{"physicalStock": 50, "activeReservations": 5, "availableStock": 45}`*

## 5. Commit the Reservation

Simulate a successful payment and commit the reservation.

```bash
curl -X POST http://localhost:3000/api/inventory/reservations/[RESERVATION_ID]/commit \
  -H "Authorization: Bearer [USER_JWT_TOKEN]"
```

## 6. Final Stock Check

Verify the physical stock is permanently updated.

```bash
curl -X GET http://localhost:3000/api/inventory/availability/[PRODUCT_ID]
```

*Expected output: `{"physicalStock": 45, "activeReservations": 0, "availableStock": 45}`*

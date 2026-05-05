# Luckwin Stores - API Documentation

## Base URL
```
http://localhost:5000/api
```

---

## Items Endpoints

### 1. Get All Items
```
GET /items
```
**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Scaffolding Boards",
      "description": "Wooden scaffolding boards 12ft",
      "dailyRate": 50,
      "totalQuantity": 100,
      "availableQuantity": 85,
      "category": "Scaffolding",
      "unit": "pieces",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 2. Get Single Item
```
GET /items/:id
```
**Response:** Single item object

---

### 3. Create Item
```
POST /items
Content-Type: application/json

{
  "name": "Scaffolding Boards",
  "description": "Wooden scaffolding boards",
  "dailyRate": 50,
  "totalQuantity": 100,
  "category": "Scaffolding",
  "unit": "pieces"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item created successfully",
  "data": { ...item }
}
```

---

### 4. Update Item
```
PUT /items/:id
Content-Type: application/json

{
  "dailyRate": 55,
  "totalQuantity": 150
}
```

**Response:** Updated item object

---

### 5. Delete Item
```
DELETE /items/:id
```
**Note:** Cannot delete if item is in active/overdue rentals

**Response:**
```json
{
  "success": true,
  "message": "Item deleted successfully"
}
```

---

### 6. Get Low Stock Items
```
GET /items/low-stock
```
Returns items with available quantity < 10% of total

---

## Customers Endpoints

### 1. Get All Customers
```
GET /customers
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "name": "John Construction Co",
      "phone": "+1234567890",
      "nic": "NIC123456",
      "email": "john@company.com",
      "address": "123 Main St",
      "city": "New York",
      "companyName": "JCC Ltd",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 2. Search Customers
```
GET /customers/search?query=john
```

**Response:** Array of matching customers

---

### 3. Get Customer Rental History
```
GET /customers/:id/history
```

**Response:**
```json
{
  "success": true,
  "customer": { ...customer },
  "rentals": [ ...rentals ]
}
```

---

### 4. Create Customer
```
POST /customers
Content-Type: application/json

{
  "name": "John Construction Co",
  "phone": "+1234567890",
  "nic": "NIC123456",
  "email": "john@company.com",
  "address": "123 Main St",
  "city": "New York",
  "companyName": "JCC Ltd"
}
```

**Required Fields:** name, phone, nic

---

### 5. Update Customer
```
PUT /customers/:id
Content-Type: application/json

{
  "phone": "+1234567891",
  "email": "newemail@company.com"
}
```

---

### 6. Delete Customer
```
DELETE /customers/:id
```

---

## Rentals Endpoints

### 1. Create New Rental
```
POST /rentals
Content-Type: application/json

{
  "customerId": "65a1b2c3d4e5f6g7h8i9j0k2",
  "rentedItems": [
    {
      "itemId": "65a1b2c3d4e5f6g7h8i9j0k1",
      "quantity": 10
    },
    {
      "itemId": "65a1b2c3d4e5f6g7h8i9j0k3",
      "quantity": 5
    }
  ],
  "expectedReturnDate": "2024-01-20",
  "advancePayment": 500,
  "notes": "For construction at 123 Main St"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rental created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
    "customerId": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "name": "John Construction Co"
    },
    "rentedItems": [
      {
        "itemId": { ...item },
        "quantity": 10,
        "dailyRate": 50
      }
    ],
    "rentDate": "2024-01-15T10:30:00Z",
    "expectedReturnDate": "2024-01-20T00:00:00Z",
    "advancePayment": 500,
    "totalCost": 2500,
    "finalAmount": 2000,
    "status": "Active",
    "agreementToken": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6"
  }
}
```

**Cost Calculation:**
- For each item: `quantity × dailyRate × durationInDays`
- Total: Sum of all item costs
- Final Amount: `totalCost - advancePayment`

---

### 2. Get All Rentals
```
GET /rentals
GET /rentals?status=Active
GET /rentals?customerId=65a1b2c3d4e5f6g7h8i9j0k2
```

**Query Parameters:**
- `status`: Active | Returned | Overdue
- `customerId`: Customer ID

---

### 3. Get Single Rental
```
GET /rentals/:id
```

---

### 4. Get Active Rentals
```
GET /rentals/active
```

Returns only rentals with status "Active"

---

### 5. Get Overdue Rentals
```
GET /rentals/overdue
```

Returns rentals past their expected return date and auto-updates status to "Overdue"

---

### 6. Process Return
```
POST /rentals/:id/return
```

**What happens:**
1. Sets `actualReturnDate` to current date
2. Recalculates `totalCost` based on actual days kept
3. Updates `finalAmount`: `totalCost - advancePayment`
4. Changes status to "Returned"
5. Restores item quantities to inventory

**Response:**
```json
{
  "success": true,
  "message": "Rental returned successfully",
  "data": {
    ...rental with updated costs and status
  }
}
```

---

## Receipt Endpoints

### 1. Get Receipt by Token (PUBLIC)
```
GET /receipt/:token
```

**URL Example:**
```
http://localhost:3000/receipt/a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6
```

**Response:**
```json
{
  "success": true,
  "data": {
    "agreementToken": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
    "status": "Active",
    "customer": {
      "name": "John Construction Co",
      "phone": "+1234567890",
      "nic": "NIC123456",
      "address": "123 Main St",
      "companyName": "JCC Ltd"
    },
    "rentedItems": [
      {
        "name": "Scaffolding Boards",
        "quantity": 10,
        "dailyRate": 50,
        "totalItemCost": 500
      }
    ],
    "rentDate": "2024-01-15T10:30:00Z",
    "expectedReturnDate": "2024-01-20T00:00:00Z",
    "actualReturnDate": null,
    "daysDaysRented": 5,
    "advancePayment": 500,
    "totalCost": 2500,
    "finalAmount": 2000
  }
}
```

---

## Health Check

```
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "message": "Backend server is running",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required fields: name, phone, nic"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Item not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "Customer with this phone already exists"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error message"
}
```

---

## Request/Response Headers

**All requests:**
```
Content-Type: application/json
```

**CORS enabled for:**
```
Access-Control-Allow-Origin: *
```

---

## Rate Limiting

No rate limiting implemented (can be added for production)

---

## Authentication

Currently no authentication (can be added with JWT tokens)

---

## Pagination

Not implemented (can be added with limit/skip parameters)

---

## Field Validation

### Item Creation
- `name`: Required, unique, min 3 chars
- `dailyRate`: Required, >= 0
- `totalQuantity`: Required, >= 0
- `category`: Optional, enum: Scaffolding/Tools/Machinery/Safety/Other

### Customer Creation
- `name`: Required, min 3 chars
- `phone`: Required, unique
- `nic`: Required, unique
- `email`: Optional, valid email format

### Rental Creation
- `customerId`: Required, must exist
- `rentedItems`: Required, non-empty array
  - `itemId`: Required, must exist
  - `quantity`: Required, >= 1, <= availableQuantity
- `expectedReturnDate`: Required, must be future date
- `advancePayment`: Optional, >= 0, <= totalCost

---

## Examples Using cURL

### Create Item
```bash
curl -X POST http://localhost:5000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Scaffolding Boards",
    "dailyRate": 50,
    "totalQuantity": 100,
    "category": "Scaffolding"
  }'
```

### Create Customer
```bash
curl -X POST http://localhost:5000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Construction",
    "phone": "+1234567890",
    "nic": "NIC123456"
  }'
```

### Create Rental
```bash
curl -X POST http://localhost:5000/api/rentals \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUSTOMER_ID",
    "rentedItems": [
      {
        "itemId": "ITEM_ID",
        "quantity": 5
      }
    ],
    "expectedReturnDate": "2024-01-20",
    "advancePayment": 200
  }'
```

### Process Return
```bash
curl -X POST http://localhost:5000/api/rentals/RENTAL_ID/return
```

---

## Notes

- All dates are in ISO 8601 format (UTC)
- All amounts are in USD (can be configured)
- Agreement tokens are UUIDs
- Transactions use MongoDB sessions for atomicity
- Item availability is managed at database level
- Costs are recalculated on return based on actual days

# API Specification

Base URL: `http://localhost:3000`  
All protected endpoints require: `Authorization: Bearer <token>`  
All responses follow: `{ "success": true, "data": ..., "timestamp": "..." }`

---

## Auth

### POST /auth/register
Create a new user account.

**Body:**
```json
{ "email": "user@example.com", "password": "StrongP@ss1" }
```

**Response 201:**
```json
{ "id": "uuid", "email": "user@example.com", "role": "VIEWER", "createdAt": "..." }
```

**Errors:** 409 Duplicate email | 400 Validation

---

### POST /auth/login
Login and receive JWT.

**Body:**
```json
{ "email": "user@example.com", "password": "StrongP@ss1" }
```

**Response 200:**
```json
{ "accessToken": "eyJ...", "user": { "id": "...", "email": "...", "role": "VIEWER" } }
```

**Errors:** 401 Invalid credentials | 401 Inactive account

---

## Users

### GET /users 🔒 ADMIN
List all users.

**Response:** Array of user objects (no passwords)

---

### POST /users 🔒 ADMIN
Create a user with a specified role.

**Body:**
```json
{ "email": "analyst@co.com", "password": "pass1234", "role": "ANALYST" }
```

**Errors:** 409 Duplicate | 400 Validation | 403 Forbidden

---

### GET /users/me 🔒 Any auth
Get own profile.

---

### PATCH /users/:id 🔒 ADMIN
Update role and/or status.

**Body:**
```json
{ "role": "ANALYST", "status": "INACTIVE" }
```

---

## Records

### GET /records 🔒 VIEWER+
List records with optional filters and pagination.

**Query params:**

| Param | Type | Example |
|-------|------|---------|
| type | INCOME\|EXPENSE | INCOME |
| category | string | Salary |
| dateFrom | ISO date | 2024-01-01 |
| dateTo | ISO date | 2024-12-31 |
| page | number | 1 |
| limit | number | 20 |

**Response:**
```json
{
  "items": [...],
  "meta": { "total": 42, "page": 1, "limit": 20, "totalPages": 3 }
}
```

---

### POST /records 🔒 ANALYST+
Create a financial record.

**Body:**
```json
{
  "amount": 1500.00,
  "type": "INCOME",
  "category": "Salary",
  "description": "Monthly pay",
  "date": "2024-03-01T00:00:00.000Z"
}
```

**Errors:** 400 Validation | 403 Insufficient role

---

### PATCH /records/:id 🔒 ANALYST+ (own) / ADMIN (any)
Update a record. Analysts can only update their own records.

**Body:** Any subset of CreateRecordDto fields.

**Errors:** 404 Not found | 403 Ownership violation | 403 Insufficient role

---

### DELETE /records/:id 🔒 ADMIN
Soft-delete a record (sets `deletedAt`).

**Response:** 204 No Content

---

## Dashboard

All endpoints require VIEWER+ role.

### GET /dashboard/summary
```json
{ "totalIncome": 5000, "totalExpenses": 2000, "netBalance": 3000 }
```

### GET /dashboard/by-category
```json
[
  { "category": "Salary", "income": 4000, "expense": 0, "net": 4000 },
  { "category": "Food", "income": 0, "expense": 800, "net": -800 }
]
```

### GET /dashboard/trends?period=monthly
```json
[
  { "period": "2024-01", "income": 2000, "expense": 800, "net": 1200 }
]
```

### GET /dashboard/recent
Returns the 10 most recent non-deleted records.

### GET /dashboard/budget-status
Returns the current spending vs budget goals, calculating utilization percentages.
```json
[
  {
    "category": "Food",
    "budgetLimit": 500,
    "actualSpent": 300,
    "utilizationPercentage": 60,
    "remaining": 200,
    "status": "ON_TRACK"
  }
]
```

---

## Budgets

All endpoints require ANALYST+ role.

### GET /budgets
List all budgeting goals for the current user.

### POST /budgets
Set or update a budget limit for a specific category.
```json
{ "category": "Food", "limit": 500 }
```

### DELETE /budgets/:id
Remove a budget goal entirely.

---

## System

### GET /health
System health check monitoring Database responsive and Memory Heap status. (Public)
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" }
  },
  "error": {},
  "details": { ... }
}
```

### GET /records/export/csv 🔒 VIEWER+
Export financial records to an industrial formatted CSV stream.
(Returns `text/csv` buffer file download)

# ACID-Compliant E-commerce Order Processing API

A robust backend application built using Node.js, Express.js, PostgreSQL, Prisma ORM, and Docker.  
This project demonstrates ACID-compliant transactional order processing with inventory management, rollback handling, concurrency control, and idempotent APIs.

---

# Features

- ACID-compliant database transactions
- PostgreSQL relational database
- Prisma ORM with migrations
- Dockerized environment
- Automatic database seeding
- Inventory management
- Transaction rollback support
- Optimistic locking for concurrency handling
- Order cancellation with stock restoration
- Idempotent cancellation endpoint
- Health check endpoint
- RESTful API architecture

---

# Tech Stack

| Layer                 | Technology     |
| --------------------- | -------------- |
| Backend               | Node.js        |
| Framework             | Express.js     |
| Database              | PostgreSQL     |
| ORM                   | Prisma         |
| Containerization      | Docker         |
| Orchestration         | Docker Compose |
| Environment Variables | dotenv         |

---

# Project Architecture

The application follows a layered architecture:

1. Routes Layer  
   Handles incoming API requests.

2. Controller Layer  
   Processes request and response handling.

3. Service Layer  
   Contains business logic and transactional operations.

4. Database Layer  
   Prisma ORM interacts with PostgreSQL database.

---

# ACID Properties Implemented

## 1. Atomicity

All operations inside an order transaction either succeed completely or fail completely.

Example:

- Inventory update
- Order creation
- Payment insertion

If any step fails, everything is rolled back.

---

## 2. Consistency

Database constraints ensure valid states:

- Stock cannot become negative
- Foreign keys maintain integrity
- Required fields enforced

---

## 3. Isolation

Optimistic locking prevents concurrent stock corruption using version control.

---

## 4. Durability

Committed transactions remain permanently stored in PostgreSQL.

---

# Folder Structure

```bash
ecommerce-api/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── db/
│   └── seeds/
│       └── seed.sql
│
├── src/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── orderController.js
│   │   ├── productController.js
│   │   └── healthController.js
│   │
│   ├── services/
│   │   └── orderService.js
│   │
│   ├── routes/
│   │   ├── orderRoutes.js
│   │   ├── productRoutes.js
│   │   └── healthRoutes.js
│   │
│   ├── middlewares/
│   │   └── errorMiddleware.js
│   │
│   ├── utils/
│   │   └── logger.js
│   │
│   └── app.js
│
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── package.json
├── submission.json
└── README.md
```

---

# Database Schema

## Users Table

| Column    | Type      |
| --------- | --------- |
| id        | Integer   |
| email     | String    |
| password  | String    |
| createdAt | Timestamp |

---

## Products Table

| Column  | Type    |
| ------- | ------- |
| id      | Integer |
| name    | String  |
| price   | Decimal |
| stock   | Integer |
| version | Integer |

---

## Orders Table

| Column      | Type      |
| ----------- | --------- |
| id          | Integer   |
| userId      | Integer   |
| status      | String    |
| totalAmount | Decimal   |
| createdAt   | Timestamp |

---

## Order Items Table

| Column    | Type    |
| --------- | ------- |
| id        | Integer |
| orderId   | Integer |
| productId | Integer |
| quantity  | Integer |
| price     | Decimal |

---

## Payments Table

| Column    | Type      |
| --------- | --------- |
| id        | Integer   |
| orderId   | Integer   |
| amount    | Decimal   |
| status    | String    |
| createdAt | Timestamp |

---

# Prerequisites

Install the following:

- Docker
- Docker Compose
- Node.js
- npm

---

# Environment Variables

Create a `.env` file using `.env.example`

## .env.example

```env
API_PORT=8080

DATABASE_URL="postgresql://user:password@db:5432/ecommerce"

DB_USER=user
DB_PASSWORD=password
DB_NAME=ecommerce
```

---

# Installation and Setup

## Step 1 Clone Repository

```bash
git clone <repository-url>
cd ecommerce-api
```

---

## Step 2 Install Dependencies

```bash
npm install
```

---

## Step 3 Start Application

```bash
docker-compose up --build
```

This command:

- Builds application container
- Starts PostgreSQL container
- Applies migrations
- Seeds database
- Starts API server

---

# Docker Configuration

## Dockerfile

Responsible for:

- Installing dependencies
- Generating Prisma client
- Running application

---

## docker-compose.yml

Defines:

- app service
- PostgreSQL database service
- health checks
- environment variables
- seed mounting

---

# Database Migration

## Generate Migration

```bash
npx prisma migrate dev --name init
```

---

## Apply Migration in Production

```bash
npx prisma migrate deploy
```

---

# Database Seeding

Seed files are located in:

```bash
db/seeds/
```

PostgreSQL automatically executes `.sql` files mounted to:

```bash
/docker-entrypoint-initdb.d
```

---

# API Endpoints

# 1. Health Check

## Endpoint

```http
GET /health
```

## Success Response

```json
{
  "status": "ok",
  "db": "healthy"
}
```

---

# 2. Get All Products

## Endpoint

```http
GET /api/products
```

## Response

```json
[
  {
    "id": 1,
    "name": "Laptop",
    "price": 80000,
    "stock": 10
  }
]
```

---

# 3. Create Order

## Endpoint

```http
POST /api/orders
```

## Request Body

```json
{
  "userId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ]
}
```

## Success Response

```json
{
  "orderId": 1,
  "status": "processing",
  "totalAmount": 160000
}
```

---

# Order Creation Workflow

The following operations happen inside a single transaction:

1. Start transaction
2. Validate products
3. Check inventory stock
4. Lock/update inventory
5. Calculate total amount
6. Create order
7. Create order items
8. Create payment record
9. Commit transaction

If any step fails:

- Entire transaction rolls back

---

# Rollback Example

Scenario:
User orders more quantity than available stock.

Example:

- Product stock = 2
- Requested quantity = 5

Result:

- Transaction fails
- No order created
- Stock unchanged
- Payment not recorded

---

# 4. Get Order Details

## Endpoint

```http
GET /api/orders/:orderId
```

## Response

```json
{
  "orderId": 1,
  "status": "processing",
  "totalAmount": 160000,
  "createdAt": "2026-05-17T10:00:00.000Z",
  "user": {
    "id": 1,
    "email": "user1@test.com"
  },
  "items": [
    {
      "productId": 1,
      "productName": "Laptop",
      "quantity": 2,
      "price": 80000
    }
  ]
}
```

---

# 5. Cancel Order

## Endpoint

```http
PUT /api/orders/:orderId/cancel
```

## Response

```json
{
  "orderId": 1,
  "status": "cancelled"
}
```

---

# Order Cancellation Workflow

1. Start transaction
2. Fetch order and items
3. Validate order state
4. Restore inventory stock
5. Update order status
6. Commit transaction

---

# Idempotent Cancellation

If an already cancelled order is cancelled again:

- API still returns success
- Stock is NOT restored twice
- Database state remains unchanged

---

# Concurrency Handling

The application uses optimistic locking.

## Why?

To prevent:

- Race conditions
- Double inventory deduction
- Overselling products

---

# Optimistic Locking Strategy

Products table contains:

```sql
version INTEGER
```

Update query checks:

```sql
WHERE id = ? AND version = ?
```

If another transaction already modified the row:

- Update fails
- Transaction rolls back safely

---

# Health Checks

Both services include Docker health checks.

## App Health Check

```yaml
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:8080/health']
```

---

## Database Health Check

```yaml
healthcheck:
  test: ['CMD-SHELL', 'pg_isready -U ${DB_USER} -d ${DB_NAME}']
```

---

# Testing the Application

## Start Containers

```bash
docker-compose up --build
```

---

## Test Health Endpoint

```bash
curl http://localhost:8080/health
```

---

## Test Product Listing

```bash
curl http://localhost:8080/api/products
```

---

## Test Create Order

```bash
curl -X POST http://localhost:8080/api/orders \
-H "Content-Type: application/json" \
-d '{
  "userId":1,
  "items":[
    {
      "productId":1,
      "quantity":2
    }
  ]
}'
```

---

## Test Cancel Order

```bash
curl -X PUT http://localhost:8080/api/orders/1/cancel
```

---

# Submission Configuration

## submission.json

```json
{
  "testUser": {
    "id": 1,
    "email": "user1@test.com"
  },
  "testProducts": {
    "inStockProductId": 1,
    "outOfStockProductId": 5
  }
}
```

---

# Error Handling

The application handles:

- Product not found
- Insufficient stock
- Invalid orders
- Concurrent updates
- Database failures

---

# Logging

Structured logging can be implemented using:

- Winston
- Pino

Suggested log events:

- TRANSACTION_START
- INVENTORY_CHECK
- PAYMENT_SUCCESS
- PAYMENT_FAILURE
- TRANSACTION_ROLLBACK

---

# Future Improvements

- JWT Authentication
- Swagger API Documentation
- Unit Testing
- Integration Testing
- Redis Caching
- Payment Gateway Integration
- CI/CD Pipeline
- Kubernetes Deployment

---

# Common Problems and Solutions

## Problem: Database connection failed

### Solution

Check:

- DATABASE_URL
- PostgreSQL container
- Docker network

---

## Problem: Seed file not executing

### Solution

Verify:

- File extension is `.sql`
- Correct mount path
- PostgreSQL initialized correctly

---

## Problem: Prisma migration error

### Solution

Run:

```bash
npx prisma generate
npx prisma migrate dev
```

---

# Evaluation Checklist

## Mandatory Files

- README.md
- Dockerfile
- docker-compose.yml
- .env.example
- submission.json
- Prisma migrations
- Seed files

---

## Mandatory Features

- Health endpoint
- Product listing
- Create order transaction
- Rollback support
- Get order details
- Cancel order transaction
- Idempotent cancellation

---

# Author

Developed as part of the ACID-Compliant E-commerce Order Processing API backend project.

---

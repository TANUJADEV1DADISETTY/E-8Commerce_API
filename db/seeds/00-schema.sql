-- ============================================================
-- 00-schema.sql
-- Auto-executed by PostgreSQL Docker container on first init.
-- Creates all required tables for the e-commerce API.
-- Prisma db push is used at startup to sync the schema.
-- ============================================================

-- ============================================================
-- Users table
-- ============================================================
CREATE TABLE IF NOT EXISTS "users" (
    "id"         SERIAL PRIMARY KEY,
    "email"      VARCHAR UNIQUE NOT NULL,
    "password"   VARCHAR NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Products table (with CHECK constraint + optimistic locking version)
-- ============================================================
CREATE TABLE IF NOT EXISTS "products" (
    "id"      SERIAL PRIMARY KEY,
    "name"    VARCHAR NOT NULL,
    "price"   DECIMAL(10,2) NOT NULL,
    "stock"   INTEGER NOT NULL CHECK (stock >= 0),
    "version" INTEGER NOT NULL DEFAULT 1
);

-- ============================================================
-- Orders table
-- ============================================================
CREATE TABLE IF NOT EXISTS "orders" (
    "id"           SERIAL PRIMARY KEY,
    "user_id"      INTEGER NOT NULL REFERENCES "users"("id"),
    "status"       VARCHAR NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Order Items table
-- ============================================================
CREATE TABLE IF NOT EXISTS "order_items" (
    "id"         SERIAL PRIMARY KEY,
    "order_id"   INTEGER NOT NULL REFERENCES "orders"("id"),
    "product_id" INTEGER NOT NULL REFERENCES "products"("id"),
    "quantity"   INTEGER NOT NULL,
    "price"      DECIMAL(10,2) NOT NULL
);

-- ============================================================
-- Payments table
-- ============================================================
CREATE TABLE IF NOT EXISTS "payments" (
    "id"         SERIAL PRIMARY KEY,
    "order_id"   INTEGER NOT NULL REFERENCES "orders"("id"),
    "amount"     DECIMAL(10,2) NOT NULL,
    "status"     VARCHAR NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- ============================================================
-- Foreign Keys (already defined inline above, but adding
-- named constraints to match Prisma migration expectations)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_user_id_fkey'
    ) THEN
        ALTER TABLE "orders"
            ADD CONSTRAINT "orders_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'order_items_order_id_fkey'
    ) THEN
        ALTER TABLE "order_items"
            ADD CONSTRAINT "order_items_order_id_fkey"
            FOREIGN KEY ("order_id") REFERENCES "orders"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'order_items_product_id_fkey'
    ) THEN
        ALTER TABLE "order_items"
            ADD CONSTRAINT "order_items_product_id_fkey"
            FOREIGN KEY ("product_id") REFERENCES "products"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'payments_order_id_fkey'
    ) THEN
        ALTER TABLE "payments"
            ADD CONSTRAINT "payments_order_id_fkey"
            FOREIGN KEY ("order_id") REFERENCES "orders"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END$$;

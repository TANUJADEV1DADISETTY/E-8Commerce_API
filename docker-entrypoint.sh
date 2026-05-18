#!/bin/sh
set -e

echo "Syncing Prisma schema with database..."
# Use db push instead of migrate deploy to avoid checksum conflicts
# when tables are already created by Docker seed SQL scripts
npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || true

echo "Starting application..."
exec node dist/server.js

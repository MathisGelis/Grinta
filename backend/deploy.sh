#!/bin/bash
set -e

echo "→ Pulling latest changes..."
git pull

echo "→ Installing dependencies..."
npm ci

echo "→ Building..."
npm run build

# Before the restart: if a migration fails, set -e stops here and the
# previous version keeps running on the previous schema.
echo "→ Running database migrations..."
npm run migration:run:prod

# The migrations table only records which migrations ran, not that their
# columns are still there. Stops here, on the previous version, if the schema
# lacks anything the new code uses.
echo "→ Checking the database schema..."
npm run schema:check:prod

echo "→ Restarting PM2..."
pm2 restart grinta-api

echo "✓ Deploy successful"
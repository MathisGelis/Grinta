#!/bin/bash
set -e

echo "→ Pulling latest changes..."
git pull

echo "→ Installing dependencies..."
npm ci

echo "→ Building..."
npm run build

echo "→ Restarting PM2..."
pm2 restart grinta-api

echo "✓ Deploy successful"
#!/bin/bash
set -e

# Load environment variables from .env.local
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | grep -v '^$' | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not found in .env.local"
    exit 1
fi

echo "🌱 Seeding remote database..."
echo "⚠️  Note: This will fail if data already exists (which is expected)"
echo ""

# Run the seed SQL directly against the remote database
# Ignore errors for duplicate keys (data already exists)
psql "$DATABASE_URL" -f supabase/seed.sql 2>&1 | grep -v "duplicate key" || true

echo ""
echo "✅ Remote database seeding complete!"
echo ""
echo "📊 Checking data..."
psql "$DATABASE_URL" -c "SELECT COUNT(*) as clubs FROM clubs; SELECT COUNT(*) as financials FROM financials;"

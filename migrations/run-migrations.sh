#!/bin/bash

# Migration runner for Patent Forge Supabase database
# Usage: ./run-migrations.sh [DATABASE_URL]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get database URL from argument or environment
if [ -n "$1" ]; then
    DATABASE_URL="$1"
elif [ -n "$DATABASE_URL" ]; then
    echo -e "${BLUE}Using DATABASE_URL from environment${NC}"
else
    echo -e "${RED}Error: DATABASE_URL required${NC}"
    echo "Usage: $0 <DATABASE_URL>"
    echo "Or set DATABASE_URL environment variable"
    exit 1
fi

echo -e "${BLUE}Running Patent Forge database migrations...${NC}"
echo -e "${YELLOW}Database: ${DATABASE_URL}${NC}"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql not found. Please install PostgreSQL client tools.${NC}"
    exit 1
fi

# Get list of migration files
MIGRATION_FILES=($(ls migrations/*.sql | sort))

if [ ${#MIGRATION_FILES[@]} -eq 0 ]; then
    echo -e "${YELLOW}No migration files found in migrations/ directory${NC}"
    exit 0
fi

echo -e "${BLUE}Found ${#MIGRATION_FILES[@]} migration files:${NC}"
for file in "${MIGRATION_FILES[@]}"; do
    echo -e "  - $(basename "$file")"
done

# Create migrations tracking table if it doesn't exist
echo -e "${BLUE}Setting up migrations tracking...${NC}"
psql "$DATABASE_URL" -c "
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
" -q

# Run each migration
for migration_file in "${MIGRATION_FILES[@]}"; do
    migration_name=$(basename "$migration_file")
    migration_version=$(echo "$migration_name" | cut -d'_' -f1)
    
    echo -e "${BLUE}Checking migration: $migration_name${NC}"
    
    # Check if migration already applied
    if psql "$DATABASE_URL" -t -c "SELECT 1 FROM schema_migrations WHERE version = '$migration_version';" | grep -q 1; then
        echo -e "${YELLOW}  ✓ Already applied: $migration_name${NC}"
        continue
    fi
    
    echo -e "${GREEN}  → Applying: $migration_name${NC}"
    
    # Run the migration
    if psql "$DATABASE_URL" -f "$migration_file" -q; then
        # Record migration as applied
        psql "$DATABASE_URL" -c "INSERT INTO schema_migrations (version) VALUES ('$migration_version');" -q
        echo -e "${GREEN}  ✓ Successfully applied: $migration_name${NC}"
    else
        echo -e "${RED}  ✗ Failed to apply: $migration_name${NC}"
        exit 1
    fi
done

echo -e "${GREEN}All migrations completed successfully!${NC}"

# Show current schema status
echo -e "${BLUE}Current database schema:${NC}"
psql "$DATABASE_URL" -c "
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
" -q

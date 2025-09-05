#!/bin/bash

# Migration status checker for Patent Forge
# Usage: ./check-migrations.sh [DATABASE_URL]

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

echo -e "${BLUE}Checking Patent Forge database migration status...${NC}"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql not found. Please install PostgreSQL client tools.${NC}"
    exit 1
fi

# Check if migrations table exists
echo -e "${BLUE}Checking migrations tracking table...${NC}"
if psql "$DATABASE_URL" -t -c "SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_migrations';" | grep -q 1; then
    echo -e "${GREEN}✓ Migrations tracking table exists${NC}"
else
    echo -e "${YELLOW}⚠ Migrations tracking table not found${NC}"
    echo -e "${YELLOW}  Run migrations first: ./run-migrations.sh${NC}"
    exit 1
fi

# Get list of migration files
MIGRATION_FILES=($(ls migrations/*.sql | sort))
echo -e "${BLUE}Found ${#MIGRATION_FILES[@]} migration files:${NC}"

# Check each migration
for migration_file in "${MIGRATION_FILES[@]}"; do
    migration_name=$(basename "$migration_file")
    migration_version=$(echo "$migration_name" | cut -d'_' -f1)
    
    if psql "$DATABASE_URL" -t -c "SELECT 1 FROM schema_migrations WHERE version = '$migration_version';" | grep -q 1; then
        echo -e "${GREEN}  ✓ Applied: $migration_name${NC}"
    else
        echo -e "${RED}  ✗ Not applied: $migration_name${NC}"
    fi
done

# Show database schema status
echo -e "\n${BLUE}Database schema status:${NC}"
psql "$DATABASE_URL" -c "
SELECT 
    tablename as \"Table Name\",
    tableowner as \"Owner\",
    hasindexes as \"Has Indexes\"
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
" -q

# Show table row counts
echo -e "\n${BLUE}Table row counts:${NC}"
psql "$DATABASE_URL" -c "
SELECT 
    'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 
    'patents' as table_name, COUNT(*) as row_count FROM patents
UNION ALL
SELECT 
    'theses' as table_name, COUNT(*) as row_count FROM theses
UNION ALL
SELECT 
    'watchlist' as table_name, COUNT(*) as row_count FROM watchlist
ORDER BY table_name;
" -q

# Check for any issues
echo -e "\n${BLUE}Checking for potential issues...${NC}"

# Check for orphaned records
ORPHANED_PATENTS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM patents p LEFT JOIN users u ON p.user_id = u.id WHERE u.id IS NULL;" | tr -d ' ')
ORPHANED_THESES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM theses t LEFT JOIN users u ON t.user_id = u.id WHERE u.id IS NULL;" | tr -d ' ')
ORPHANED_WATCHLIST=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM watchlist w LEFT JOIN users u ON w.user_id = u.id WHERE u.id IS NULL;" | tr -d ' ')

if [ "$ORPHANED_PATENTS" -gt 0 ] || [ "$ORPHANED_THESES" -gt 0 ] || [ "$ORPHANED_WATCHLIST" -gt 0 ]; then
    echo -e "${RED}⚠ Found orphaned records:${NC}"
    [ "$ORPHANED_PATENTS" -gt 0 ] && echo -e "${RED}  - $ORPHANED_PATENTS orphaned patents${NC}"
    [ "$ORPHANED_THESES" -gt 0 ] && echo -e "${RED}  - $ORPHANED_THESES orphaned theses${NC}"
    [ "$ORPHANED_WATCHLIST" -gt 0 ] && echo -e "${RED}  - $ORPHANED_WATCHLIST orphaned watchlist items${NC}"
else
    echo -e "${GREEN}✓ No orphaned records found${NC}"
fi

# Check indexes
echo -e "\n${BLUE}Checking indexes:${NC}"
psql "$DATABASE_URL" -c "
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
" -q

echo -e "\n${GREEN}Migration status check completed!${NC}"

# Database Migrations Guide

This guide covers how to manage database migrations for Patent Forge using Supabase PostgreSQL.

## Migration Files Structure

```
migrations/
├── 001_init.sql              # Initial schema setup
├── run-migrations.sh         # Migration runner script
└── README.md                 # This file
```

## Running Migrations

### Method 1: Using the Migration Script (Recommended)

```bash
# Using environment variable
export DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
./migrations/run-migrations.sh

# Or pass DATABASE_URL directly
./migrations/run-migrations.sh "postgresql://username:password@host:port/database?sslmode=require"
```

### Method 2: Using Supabase CLI

```bash
# Install Supabase CLI first
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### Method 3: Using psql Directly

```bash
# Run individual migration
psql "postgresql://username:password@host:port/database?sslmode=require" -f migrations/001_init.sql

# Or run all migrations
for file in migrations/*.sql; do
    echo "Running $file..."
    psql "postgresql://username:password@host:port/database?sslmode=require" -f "$file"
done
```

## Migration Naming Convention

- `001_init.sql` - Initial schema setup
- `002_add_feature.sql` - Add new feature tables
- `003_update_schema.sql` - Modify existing tables
- `004_add_indexes.sql` - Add performance indexes
- `005_data_migration.sql` - Data transformation

## Current Schema (001_init.sql)

### Tables Created:
1. **users** - User authentication and profiles
2. **patents** - Saved patent information with inventors
3. **theses** - User thesis documents with starring
4. **watchlist** - Unified watchlist for all saved items

### Key Features:
- ✅ **User isolation** - All data scoped by user_id
- ✅ **Cascading deletes** - User deletion cleans up all data
- ✅ **JSONB storage** - Flexible data for inventors and watchlist items
- ✅ **Performance indexes** - Optimized queries on user_id and item_type
- ✅ **Data integrity** - Foreign key constraints and unique constraints

## Adding New Migrations

### 1. Create Migration File
```bash
# Create next migration file
touch migrations/002_add_new_feature.sql
```

### 2. Write Migration SQL
```sql
-- Migration 002: Add new feature
-- Description of what this migration does

-- Add new table
CREATE TABLE IF NOT EXISTS new_table (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  -- other columns
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_new_table_user_id ON new_table(user_id);

-- Add comments
COMMENT ON TABLE new_table IS 'Description of new table';
```

### 3. Test Migration
```bash
# Test on development database first
./migrations/run-migrations.sh "your-dev-database-url"

# Then apply to production
./migrations/run-migrations.sh "your-prod-database-url"
```

## Migration Best Practices

### ✅ Do:
- **Test migrations** on development database first
- **Use IF NOT EXISTS** for table/column creation
- **Add comments** to document schema changes
- **Create indexes** for new columns that will be queried
- **Use transactions** for complex migrations
- **Backup data** before destructive changes

### ❌ Don't:
- **Modify existing migration files** after they've been applied
- **Drop columns** without data migration
- **Rename tables** without proper migration
- **Skip testing** on development environment

## Rollback Strategy

For destructive changes, create rollback migrations:

```sql
-- Migration 003: Add new column
ALTER TABLE patents ADD COLUMN new_field VARCHAR(255);

-- Migration 004: Rollback new column (if needed)
ALTER TABLE patents DROP COLUMN IF EXISTS new_field;
```

## Environment-Specific Migrations

### Development
```bash
# Local development
export DATABASE_URL="postgresql://localhost:5432/patent_forge_dev"
./migrations/run-migrations.sh
```

### Staging
```bash
# Staging environment
export DATABASE_URL="postgresql://staging-host:5432/patent_forge_staging"
./migrations/run-migrations.sh
```

### Production
```bash
# Production environment (be extra careful!)
export DATABASE_URL="postgresql://prod-host:5432/patent_forge_prod"
./migrations/run-migrations.sh
```

## Troubleshooting

### Common Issues:

1. **Connection Refused**
   ```bash
   # Check DATABASE_URL format
   echo $DATABASE_URL
   # Should be: postgresql://user:pass@host:port/db?sslmode=require
   ```

2. **Permission Denied**
   ```bash
   # Make script executable
   chmod +x migrations/run-migrations.sh
   ```

3. **Migration Already Applied**
   ```bash
   # Check applied migrations
   psql "$DATABASE_URL" -c "SELECT * FROM schema_migrations ORDER BY applied_at;"
   ```

4. **Schema Conflicts**
   ```bash
   # Check existing tables
   psql "$DATABASE_URL" -c "\dt"
   ```

## Monitoring Migrations

### Check Migration Status
```sql
-- View applied migrations
SELECT * FROM schema_migrations ORDER BY applied_at;

-- Check table structure
\d users
\d patents
\d theses
\d watchlist
```

### Verify Data Integrity
```sql
-- Check foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY';
```

## Integration with Deployment

### Render Deployment
Add to your `render.yaml`:
```yaml
services:
  - type: web
    name: patent-forge-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        sync: false
    # Run migrations after build
    postDeployCommand: ./migrations/run-migrations.sh
```

### GitHub Actions
```yaml
- name: Run Database Migrations
  run: |
    export DATABASE_URL="${{ secrets.DATABASE_URL }}"
    ./migrations/run-migrations.sh
```

This migration system ensures your database schema stays in sync across all environments! 🚀

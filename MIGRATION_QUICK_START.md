# Quick Migration Reference

## 🚀 Quick Start

```bash
# 1. Set your Supabase DATABASE_URL
export DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# 2. Run initial migration
./migrations/run-migrations.sh

# 3. Check migration status
./migrations/check-migrations.sh
```

## 📁 Migration Files Created

- `migrations/001_init.sql` - Complete database schema
- `migrations/run-migrations.sh` - Migration runner script
- `migrations/check-migrations.sh` - Status checker script
- `migrations/README.md` - Detailed documentation

## 🎯 What Gets Created

### Tables:
- ✅ `users` - User authentication
- ✅ `patents` - Patent data with inventors array
- ✅ `theses` - Thesis documents with starring
- ✅ `watchlist` - Unified watchlist system
- ✅ `schema_migrations` - Migration tracking

### Features:
- ✅ User-scoped data (all queries filtered by user_id)
- ✅ JSONB storage for flexible data (inventors, watchlist items)
- ✅ Performance indexes on user_id and item_type
- ✅ Cascading deletes (user deletion cleans up all data)
- ✅ Data integrity constraints

## 🔧 Commands

```bash
# Run all pending migrations
./migrations/run-migrations.sh

# Check migration status
./migrations/check-migrations.sh

# Run specific migration
psql "$DATABASE_URL" -f migrations/001_init.sql

# Check database schema
psql "$DATABASE_URL" -c "\dt"
```

## ⚠️ Important Notes

1. **Run migrations BEFORE starting the app** - The app expects tables to exist
2. **Test on development first** - Always test migrations before production
3. **Backup production data** - Before running migrations on production
4. **Use DATABASE_URL** - Set this environment variable for your Supabase connection

## 🎉 Ready for Deployment!

Your database is now properly set up with:
- ✅ **Proper migration system** for schema management
- ✅ **All required tables** for patents, theses, and watchlist
- ✅ **Correct data structure** matching your frontend
- ✅ **User isolation** ensuring data privacy
- ✅ **Persistent storage** across deployments

Run the migration and your Supabase integration will be complete! 🚀

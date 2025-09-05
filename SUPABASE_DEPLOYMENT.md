# Supabase Integration Deployment Guide

## Overview
This guide covers deploying the updated Patent Forge backend with Supabase PostgreSQL integration.

## Prerequisites
- Supabase project with PostgreSQL database
- `DATABASE_URL` environment variable configured
- Node.js backend with updated dependencies

## Environment Variables

### Required Environment Variables
```bash
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
SERPAPI_API_KEY=your_serpapi_key_here
```

### Optional Environment Variables
```bash
NODE_ENV=production
PORT=3001
```

## Database Schema

The following tables are automatically created on startup:

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Theses Table
```sql
CREATE TABLE theses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Patents Table
```sql
CREATE TABLE patents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  patent_id VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  abstract TEXT,
  assignee VARCHAR(255),
  inventors JSONB,
  link VARCHAR(500),
  date_filed DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Watchlist Table
```sql
CREATE TABLE watchlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('patent', 'inventor', 'query')),
  item_id VARCHAR(100) NOT NULL,
  item_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, item_type, item_id)
);
```

## API Endpoints

### User Management
- `GET /api/user/profile` - Get user profile
- `POST /api/user/profile` - Update user profile

### Watchlist Management
- `GET /api/watchlist` - Get all watchlist items
- `POST /api/watchlist/patents` - Save patent to watchlist
- `POST /api/watchlist/queries` - Save search query
- `POST /api/watchlist/inventors` - Save inventor
- `DELETE /api/watchlist/patents/:id` - Delete patent from watchlist
- `DELETE /api/watchlist/queries/:id` - Delete query from watchlist
- `DELETE /api/watchlist/inventors/:id` - Delete inventor from watchlist

### Thesis Management
- `GET /api/theses` - Get user's theses
- `POST /api/theses` - Create new thesis
- `POST /api/theses/:id/star` - Star a thesis
- `GET /api/theses/starred` - Get starred thesis
- `DELETE /api/theses/:id` - Delete thesis

### Search
- `GET /api/patents/search/serpapi` - Search patents using SerpAPI

### Health Check
- `GET /api/health` - Health check with database status

## Deployment Steps

### 1. Update Render Settings

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
npm start
```

**Root Directory:**
Leave empty (or set to `/`)

### 2. Environment Variables
Add the following environment variables in Render:
- `DATABASE_URL` - Your Supabase PostgreSQL connection string
- `SERPAPI_API_KEY` - Your SerpAPI key

### 3. Test Deployment
After deployment, test the following endpoints:

```bash
# Health check
curl https://your-app.onrender.com/api/health

# Should return:
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "multi_tenant": true
}
```

## Data Migration

### From File-Based Storage
If migrating from the old file-based storage:

1. **Export existing data** from `user_data/` directory
2. **Create migration script** to import data into Supabase
3. **Test migration** with a subset of users
4. **Deploy updated backend** with Supabase integration

### Migration Script Example
```javascript
const fs = require('fs').promises;
const path = require('path');
const dbService = require('./databaseService');

async function migrateUserData(userId, userData) {
  // Migrate theses
  if (userData.theses) {
    for (const thesis of userData.theses) {
      await dbService.createThesis(userId, thesis.title, thesis.content);
    }
  }
  
  // Migrate patents
  if (userData.patents) {
    for (const patent of userData.patents) {
      await dbService.createPatent(userId, patent);
      await dbService.addToWatchlist(userId, 'patent', patent.patent_id, patent);
    }
  }
  
  // Migrate queries
  if (userData.queries) {
    for (const query of userData.queries) {
      await dbService.addToWatchlist(userId, 'query', query.query, query);
    }
  }
  
  // Migrate inventors
  if (userData.inventors) {
    for (const inventor of userData.inventors) {
      await dbService.addToWatchlist(userId, 'inventor', inventor.name, inventor);
    }
  }
}
```

## Testing

### Local Testing
```bash
# Install dependencies
npm install

# Set environment variables
export DATABASE_URL="your_supabase_connection_string"
export SERPAPI_API_KEY="your_serpapi_key"

# Run tests
node test-supabase.js

# Start server
npm start
```

### Production Testing
1. **Health Check**: Verify database connection
2. **User Authentication**: Test login with existing users
3. **Data Persistence**: Save items and verify they persist across restarts
4. **API Compatibility**: Ensure frontend still works with updated backend

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` format
   - Verify Supabase project is active
   - Check SSL settings

2. **Tables Not Created**
   - Check database permissions
   - Verify connection string includes correct database name
   - Check logs for initialization errors

3. **Authentication Issues**
   - Verify `X-User-Email` header is being sent
   - Check user creation in database
   - Verify email format

4. **Data Not Persisting**
   - Check foreign key constraints
   - Verify user_id is being passed correctly
   - Check database transaction logs

### Debug Commands
```bash
# Test database connection
node -e "const {pool} = require('./database'); pool.query('SELECT 1').then(() => console.log('Connected')).catch(console.error)"

# Check environment variables
node -e "console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')"

# Run integration tests
node test-supabase.js
```

## Performance Considerations

1. **Connection Pooling**: Uses pg connection pooling for efficiency
2. **Indexes**: Automatic indexes on user_id and item_type for fast queries
3. **Cascading Deletes**: User deletion automatically cleans up related data
4. **JSONB Storage**: Flexible item_data storage for watchlist items

## Security Notes

1. **User Isolation**: All queries are scoped by user_id
2. **SQL Injection Protection**: Uses parameterized queries
3. **SSL Required**: Production connections use SSL
4. **Environment Variables**: Sensitive data stored in environment variables

## Monitoring

Monitor the following metrics:
- Database connection health
- Query response times
- Error rates
- User authentication success rates
- Data persistence across deployments

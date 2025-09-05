-- Migration 001: Initial database schema
-- Creates all core tables for Patent Forge application

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patents table
CREATE TABLE IF NOT EXISTS patents (
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

-- Theses table
CREATE TABLE IF NOT EXISTS theses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('patent', 'inventor', 'query')),
  item_id VARCHAR(100) NOT NULL,
  item_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, item_type, item_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_theses_user_id ON theses(user_id);
CREATE INDEX IF NOT EXISTS idx_patents_user_id ON patents(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_item_type ON watchlist(item_type);

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts and authentication data';
COMMENT ON TABLE patents IS 'Saved patent information with full inventor details';
COMMENT ON TABLE theses IS 'User thesis documents with starring functionality';
COMMENT ON TABLE watchlist IS 'Unified watchlist for patents, inventors, and search queries';

COMMENT ON COLUMN patents.inventors IS 'JSONB array of inventor objects with name and linkedin_url';
COMMENT ON COLUMN watchlist.item_data IS 'JSONB storage for flexible item metadata';
COMMENT ON COLUMN watchlist.item_type IS 'Type of watchlist item: patent, inventor, or query';

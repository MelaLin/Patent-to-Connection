#!/bin/bash

# Patent Forge Backend Docker Startup Script

echo "Starting Patent Forge Backend in Docker..."

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Start the application
echo "Starting FastAPI application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000

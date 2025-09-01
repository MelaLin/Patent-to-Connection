#!/bin/bash

# Patent Forge Backend Startup Script

echo "Starting Patent Forge Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp env.example .env
    echo "Please edit .env file with your configuration before running the application."
    exit 1
fi

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Start the application
echo "Starting FastAPI application..."
python run.py

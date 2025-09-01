# Multi-stage Dockerfile for Patent Forge

# Stage 1: Build Frontend
FROM node:20 as frontend-builder
WORKDIR /frontend
COPY frontend/ .
RUN npm install && npm run build

# Stage 2: Build Backend
FROM python:3.11-slim as backend
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy backend files
COPY backend/ ./backend/

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy frontend/dist into backend/app/static
COPY --from=frontend-builder /frontend/dist ./backend/app/static

# Set working directory to backend and add to Python path
WORKDIR /app/backend

# Make startup script executable
RUN chmod +x start-docker.sh

# Expose port
EXPOSE 8000

# Run startup script that handles migrations and starts the app
CMD ["./start-docker.sh"]


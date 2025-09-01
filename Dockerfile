# Multi-stage Dockerfile for Patent Forge

# Stage 1: Build Frontend
FROM node:20 as frontend-builder
WORKDIR /frontend
COPY frontend/ .
RUN npm install && npm run build

# Stage 2: Build Backend
FROM python:3.11-slim as backend
WORKDIR /app
COPY backend/ ./backend/
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy frontend/dist into backend/app/static
COPY --from=frontend-builder /frontend/dist ./backend/app/static

# Expose port
EXPOSE 8000

# Run uvicorn backend.app.main:app on port 8000
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]


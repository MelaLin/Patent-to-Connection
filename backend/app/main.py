from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from pathlib import Path
from app.core.config import settings
from app.routers import patents, watchlist, alerts, saved_items

app = FastAPI(
    title="Patent Forge API",
    description="Backend API for Patent Forge application",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(patents.router, prefix="/api", tags=["patents"])
app.include_router(watchlist.router, prefix="/api", tags=["watchlist"])
app.include_router(alerts.router, prefix="/api", tags=["alerts"])
app.include_router(saved_items.router, prefix="/api", tags=["saved_items"])

# Mount static files from app/static (copied from frontend/dist in Docker)
static_path = Path(__file__).parent / "static"
if static_path.exists():
    app.mount("/", StaticFiles(directory=str(static_path), html=True), name="static")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/health")
async def api_health_check():
    """Health check for API endpoints"""
    return {
        "status": "healthy",
        "endpoints": {
            "patents": "/api/patents",
            "saved_patents": "/api/patents/save",
            "saved_inventors": "/api/inventors/save"
        }
    }

# Fallback route for React client-side routing
@app.get("/{full_path:path}")
async def serve_spa(full_path: str, request: Request):
    # Don't interfere with API routes
    if full_path.startswith("api/"):
        return {"error": "API route not found"}
    
    # Check if the file exists in the static directory
    static_path = Path(__file__).parent / "static"
    file_path = static_path / full_path
    
    # If the file exists, serve it
    if file_path.exists() and file_path.is_file():
        return FileResponse(str(file_path))
    
    # Otherwise, serve index.html for client-side routing
    index_path = static_path / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    
    # If index.html doesn't exist, return a helpful error
    return {"error": "Frontend not built. Please run 'npm run build' in the frontend directory"}

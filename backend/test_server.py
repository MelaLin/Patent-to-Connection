from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
from pathlib import Path
from datetime import datetime

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple file storage
data_dir = Path("data")
data_dir.mkdir(exist_ok=True)

def load_json_file(filename: str):
    file_path = data_dir / filename
    if file_path.exists():
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_json_file(filename: str, data):
    file_path = data_dir / filename
    try:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        return True
    except:
        return False

@app.post("/api/watchlist/patents")
async def save_patent(patent_data: dict):
    """Save a patent"""
    try:
        patents = load_json_file("patents.json")
        
        patent_record = {
            "id": len(patents) + 1,
            "patent_number": patent_data.get("patentNumber"),
            "title": patent_data["title"],
            "abstract": patent_data["abstract"],
            "assignee": patent_data["assignee"],
            "inventors": [{"name": inv} for inv in patent_data["inventors"]],
            "link": patent_data.get("googlePatentsLink"),
            "date_filed": patent_data.get("filingDate"),
            "google_patents_link": patent_data.get("googlePatentsLink"),
            "tags": patent_data.get("tags", []),
            "user_id": "dev",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        patents.append(patent_record)
        if save_json_file("patents.json", patents):
            return {"ok": True, "patent": patent_record}
        else:
            return {"ok": False, "error": "Failed to save patent"}
            
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.post("/api/watchlist/queries")
async def save_query(query_data: dict):
    """Save a query"""
    try:
        queries = load_json_file("queries.json")
        
        query_record = {
            "id": len(queries) + 1,
            "query": query_data["query"],
            "filters": query_data.get("filters"),
            "hash": f"hash_{len(queries) + 1}",
            "user_id": "dev",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        queries.append(query_record)
        if save_json_file("queries.json", queries):
            return {"ok": True, "query": query_record}
        else:
            return {"ok": False, "error": "Failed to save query"}
            
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.get("/api/watchlist")
async def get_watchlist():
    """Get all saved patents and queries"""
    try:
        patents = load_json_file("patents.json")
        queries = load_json_file("queries.json")
        
        # Filter by user_id
        user_patents = [p for p in patents if p.get("user_id") == "dev"]
        user_queries = [q for q in queries if q.get("user_id") == "dev"]
        
        return {
            "ok": True,
            "patents": user_patents,
            "queries": user_queries
        }
            
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

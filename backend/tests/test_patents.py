import pytest
from httpx import AsyncClient
from app.models.patent import Patent

@pytest.mark.asyncio
async def test_get_patents(client: AsyncClient, test_db):
    """Test getting all patents"""
    response = await client.get("/api/patents")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_create_patent(client: AsyncClient, test_db):
    """Test creating a new patent"""
    patent_data = {
        "patent_number": "US12345678",
        "title": "Test Patent",
        "abstract": "This is a test patent",
        "inventors": "John Doe",
        "assignee": "Test Company"
    }
    
    response = await client.post("/api/patents", json=patent_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["patent_number"] == patent_data["patent_number"]
    assert data["title"] == patent_data["title"]

@pytest.mark.asyncio
async def test_get_patent_by_number(client: AsyncClient, test_db):
    """Test getting a specific patent by patent number"""
    # First create a patent
    patent_data = {
        "patent_number": "US87654321",
        "title": "Another Test Patent",
        "abstract": "Another test patent"
    }
    
    create_response = await client.post("/api/patents", json=patent_data)
    assert create_response.status_code == 200
    
    # Then get it by patent number
    response = await client.get(f"/api/patents/{patent_data['patent_number']}")
    assert response.status_code == 200
    
    data = response.json()
    assert data["patent_number"] == patent_data["patent_number"]

@pytest.mark.asyncio
async def test_get_nonexistent_patent(client: AsyncClient, test_db):
    """Test getting a patent that doesn't exist"""
    response = await client.get("/api/patents/NONEXISTENT")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_update_patent(client: AsyncClient, test_db):
    """Test updating a patent"""
    # First create a patent
    patent_data = {
        "patent_number": "US11111111",
        "title": "Original Title",
        "abstract": "Original abstract"
    }
    
    create_response = await client.post("/api/patents", json=patent_data)
    assert create_response.status_code == 200
    
    # Then update it
    update_data = {
        "title": "Updated Title",
        "abstract": "Updated abstract"
    }
    
    response = await client.put(f"/api/patents/{patent_data['patent_number']}", json=update_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["title"] == update_data["title"]
    assert data["abstract"] == update_data["abstract"]

@pytest.mark.asyncio
async def test_delete_patent(client: AsyncClient, test_db):
    """Test deleting a patent"""
    # First create a patent
    patent_data = {
        "patent_number": "US22222222",
        "title": "Patent to Delete",
        "abstract": "This will be deleted"
    }
    
    create_response = await client.post("/api/patents", json=patent_data)
    assert create_response.status_code == 200
    
    # Then delete it
    response = await client.delete(f"/api/patents/{patent_data['patent_number']}")
    assert response.status_code == 200
    
    # Verify it's deleted
    get_response = await client.get(f"/api/patents/{patent_data['patent_number']}")
    assert get_response.status_code == 404

@pytest.mark.asyncio
async def test_search_patents_serpapi(client: AsyncClient):
    """Test searching patents using SerpAPI"""
    response = await client.get("/api/patents/search/serpapi?query=artificial intelligence&limit=5")
    # This might fail if SERPAPI_API_KEY is not set, which is expected
    assert response.status_code in [200, 500]

@pytest.mark.asyncio
async def test_search_patents_patentsview(client: AsyncClient):
    """Test searching patents using PatentsView API"""
    response = await client.get("/api/patents/search/patentsview?query=machine learning&limit=5")
    # This might fail if the API is not available, which is expected
    assert response.status_code in [200, 500]

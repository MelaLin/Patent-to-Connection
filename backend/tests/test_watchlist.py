import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_get_watchlist(client: AsyncClient, test_db):
    """Test getting user's watchlist"""
    response = await client.get("/api/watchlist?user_id=test_user")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_add_to_watchlist(client: AsyncClient, test_db):
    """Test adding a patent to watchlist"""
    watchlist_data = {
        "user_id": "test_user",
        "patent_number": "US12345678",
        "notes": "Interesting patent to watch"
    }
    
    response = await client.post("/api/watchlist", json=watchlist_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["user_id"] == watchlist_data["user_id"]
    assert data["patent_number"] == watchlist_data["patent_number"]
    assert data["notes"] == watchlist_data["notes"]

@pytest.mark.asyncio
async def test_add_duplicate_to_watchlist(client: AsyncClient, test_db):
    """Test adding the same patent to watchlist twice"""
    watchlist_data = {
        "user_id": "test_user",
        "patent_number": "US87654321",
        "notes": "First addition"
    }
    
    # First addition
    response1 = await client.post("/api/watchlist", json=watchlist_data)
    assert response1.status_code == 200
    
    # Second addition (should fail)
    response2 = await client.post("/api/watchlist", json=watchlist_data)
    assert response2.status_code == 400

@pytest.mark.asyncio
async def test_update_watchlist_item(client: AsyncClient, test_db):
    """Test updating a watchlist item"""
    # First add to watchlist
    watchlist_data = {
        "user_id": "test_user",
        "patent_number": "US11111111",
        "notes": "Original notes"
    }
    
    create_response = await client.post("/api/watchlist", json=watchlist_data)
    assert create_response.status_code == 200
    
    item_id = create_response.json()["id"]
    
    # Then update it
    update_data = {
        "notes": "Updated notes",
        "is_active": True
    }
    
    response = await client.put(f"/api/watchlist/{item_id}", json=update_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["notes"] == update_data["notes"]

@pytest.mark.asyncio
async def test_remove_from_watchlist(client: AsyncClient, test_db):
    """Test removing a patent from watchlist"""
    # First add to watchlist
    watchlist_data = {
        "user_id": "test_user",
        "patent_number": "US22222222",
        "notes": "Will be removed"
    }
    
    create_response = await client.post("/api/watchlist", json=watchlist_data)
    assert create_response.status_code == 200
    
    item_id = create_response.json()["id"]
    
    # Then remove it
    response = await client.delete(f"/api/watchlist/{item_id}")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_check_watchlist_status(client: AsyncClient, test_db):
    """Test checking if a patent is in watchlist"""
    # First add to watchlist
    watchlist_data = {
        "user_id": "test_user",
        "patent_number": "US33333333",
        "notes": "Test patent"
    }
    
    create_response = await client.post("/api/watchlist", json=watchlist_data)
    assert create_response.status_code == 200
    
    # Check status
    response = await client.get(f"/api/watchlist/check/{watchlist_data['patent_number']}?user_id={watchlist_data['user_id']}")
    assert response.status_code == 200
    
    data = response.json()
    assert data["in_watchlist"] == True
    assert data["patent_number"] == watchlist_data["patent_number"]

@pytest.mark.asyncio
async def test_get_watchlist_count(client: AsyncClient, test_db):
    """Test getting watchlist count"""
    # Add multiple items to watchlist
    watchlist_items = [
        {"user_id": "test_user", "patent_number": "US44444444", "notes": "Item 1"},
        {"user_id": "test_user", "patent_number": "US55555555", "notes": "Item 2"},
        {"user_id": "test_user", "patent_number": "US66666666", "notes": "Item 3"}
    ]
    
    for item in watchlist_items:
        response = await client.post("/api/watchlist", json=item)
        assert response.status_code == 200
    
    # Get count
    response = await client.get(f"/api/watchlist/count?user_id=test_user")
    assert response.status_code == 200
    
    data = response.json()
    assert data["count"] == 3
    assert data["user_id"] == "test_user"

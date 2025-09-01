import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_get_alerts(client: AsyncClient, test_db):
    """Test getting user's alerts"""
    response = await client.get("/api/alerts?user_id=test_user")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_create_alert(client: AsyncClient, test_db):
    """Test creating a new alert"""
    alert_data = {
        "user_id": "test_user",
        "alert_type": "patent_status",
        "title": "Patent Status Changed",
        "message": "Patent US12345678 status has been updated",
        "patent_number": "US12345678"
    }
    
    response = await client.post("/api/alerts", json=alert_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["user_id"] == alert_data["user_id"]
    assert data["alert_type"] == alert_data["alert_type"]
    assert data["title"] == alert_data["title"]
    assert data["message"] == alert_data["message"]
    assert data["is_read"] == False

@pytest.mark.asyncio
async def test_get_alert_by_id(client: AsyncClient, test_db):
    """Test getting a specific alert by ID"""
    # First create an alert
    alert_data = {
        "user_id": "test_user",
        "alert_type": "new_patent",
        "title": "New Patent Filed",
        "message": "A new patent has been filed in your area of interest"
    }
    
    create_response = await client.post("/api/alerts", json=alert_data)
    assert create_response.status_code == 200
    
    alert_id = create_response.json()["id"]
    
    # Then get it by ID
    response = await client.get(f"/api/alerts/{alert_id}")
    assert response.status_code == 200
    
    data = response.json()
    assert data["id"] == alert_id
    assert data["user_id"] == alert_data["user_id"]

@pytest.mark.asyncio
async def test_update_alert(client: AsyncClient, test_db):
    """Test updating an alert"""
    # First create an alert
    alert_data = {
        "user_id": "test_user",
        "alert_type": "deadline",
        "title": "Patent Deadline",
        "message": "Patent deadline approaching"
    }
    
    create_response = await client.post("/api/alerts", json=alert_data)
    assert create_response.status_code == 200
    
    alert_id = create_response.json()["id"]
    
    # Then update it
    update_data = {
        "is_read": True
    }
    
    response = await client.put(f"/api/alerts/{alert_id}", json=update_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["is_read"] == True
    assert data["read_at"] is not None

@pytest.mark.asyncio
async def test_mark_alert_as_read(client: AsyncClient, test_db):
    """Test marking an alert as read"""
    # First create an alert
    alert_data = {
        "user_id": "test_user",
        "alert_type": "patent_status",
        "title": "Status Update",
        "message": "Patent status updated"
    }
    
    create_response = await client.post("/api/alerts", json=alert_data)
    assert create_response.status_code == 200
    
    alert_id = create_response.json()["id"]
    
    # Mark as read
    response = await client.post(f"/api/alerts/{alert_id}/read")
    assert response.status_code == 200
    
    # Verify it's marked as read
    get_response = await client.get(f"/api/alerts/{alert_id}")
    assert get_response.status_code == 200
    
    data = get_response.json()
    assert data["is_read"] == True

@pytest.mark.asyncio
async def test_mark_all_alerts_as_read(client: AsyncClient, test_db):
    """Test marking all user's alerts as read"""
    # Create multiple alerts
    alert_data_list = [
        {
            "user_id": "test_user",
            "alert_type": "patent_status",
            "title": "Alert 1",
            "message": "First alert"
        },
        {
            "user_id": "test_user",
            "alert_type": "new_patent",
            "title": "Alert 2",
            "message": "Second alert"
        }
    ]
    
    for alert_data in alert_data_list:
        response = await client.post("/api/alerts", json=alert_data)
        assert response.status_code == 200
    
    # Mark all as read
    response = await client.post("/api/alerts/read-all?user_id=test_user")
    assert response.status_code == 200
    
    # Verify all are marked as read
    alerts_response = await client.get("/api/alerts?user_id=test_user&unread_only=true")
    assert alerts_response.status_code == 200
    assert len(alerts_response.json()) == 0

@pytest.mark.asyncio
async def test_get_alerts_count(client: AsyncClient, test_db):
    """Test getting alerts count"""
    # Create multiple alerts
    alert_data_list = [
        {
            "user_id": "test_user",
            "alert_type": "patent_status",
            "title": "Count Alert 1",
            "message": "First count alert"
        },
        {
            "user_id": "test_user",
            "alert_type": "new_patent",
            "title": "Count Alert 2",
            "message": "Second count alert"
        },
        {
            "user_id": "test_user",
            "alert_type": "deadline",
            "title": "Count Alert 3",
            "message": "Third count alert"
        }
    ]
    
    for alert_data in alert_data_list:
        response = await client.post("/api/alerts", json=alert_data)
        assert response.status_code == 200
    
    # Get total count
    response = await client.get("/api/alerts/count?user_id=test_user")
    assert response.status_code == 200
    
    data = response.json()
    assert data["count"] == 3
    assert data["user_id"] == "test_user"

@pytest.mark.asyncio
async def test_get_alert_types(client: AsyncClient, test_db):
    """Test getting alerts by type"""
    # Create alerts of different types
    alert_data_list = [
        {
            "user_id": "test_user",
            "alert_type": "patent_status",
            "title": "Status Alert",
            "message": "Status alert"
        },
        {
            "user_id": "test_user",
            "alert_type": "patent_status",
            "title": "Another Status Alert",
            "message": "Another status alert"
        },
        {
            "user_id": "test_user",
            "alert_type": "new_patent",
            "title": "New Patent Alert",
            "message": "New patent alert"
        }
    ]
    
    for alert_data in alert_data_list:
        response = await client.post("/api/alerts", json=alert_data)
        assert response.status_code == 200
    
    # Get alert types
    response = await client.get("/api/alerts/types?user_id=test_user")
    assert response.status_code == 200
    
    data = response.json()
    assert data["user_id"] == "test_user"
    assert data["alert_types"]["patent_status"] == 2
    assert data["alert_types"]["new_patent"] == 1

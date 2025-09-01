from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.models.alert import Alert
from app.schemas.alert import AlertCreate, AlertResponse, AlertUpdate

router = APIRouter()

@router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(
    user_id: str = Query(..., description="User ID"),
    unread_only: bool = Query(False, description="Show only unread alerts"),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get user's alerts"""
    query = select(Alert).where(Alert.user_id == user_id)
    
    if unread_only:
        query = query.where(Alert.is_read == False)
    
    result = await db.execute(query.order_by(Alert.created_at.desc()).offset(skip).limit(limit))
    alerts = result.scalars().all()
    return alerts

@router.get("/alerts/{alert_id}", response_model=AlertResponse)
async def get_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific alert"""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return alert

@router.post("/alerts", response_model=AlertResponse)
async def create_alert(alert: AlertCreate, db: AsyncSession = Depends(get_db)):
    """Create a new alert"""
    db_alert = Alert(**alert.model_dump())
    db.add(db_alert)
    await db.commit()
    await db.refresh(db_alert)
    
    return db_alert

@router.put("/alerts/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: int,
    alert_update: AlertUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an alert"""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    update_data = alert_update.model_dump(exclude_unset=True)
    
    # If marking as read, set read_at timestamp
    if update_data.get("is_read") and not alert.is_read:
        update_data["read_at"] = datetime.now()
    
    for field, value in update_data.items():
        setattr(alert, field, value)
    
    await db.commit()
    await db.refresh(alert)
    
    return alert

@router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    """Delete an alert"""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    await db.delete(alert)
    await db.commit()
    
    return {"message": "Alert deleted successfully"}

@router.post("/alerts/{alert_id}/read")
async def mark_alert_as_read(alert_id: int, db: AsyncSession = Depends(get_db)):
    """Mark an alert as read"""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.is_read = True
    alert.read_at = datetime.now()
    await db.commit()
    
    return {"message": "Alert marked as read"}

@router.post("/alerts/read-all")
async def mark_all_alerts_as_read(
    user_id: str = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db)
):
    """Mark all user's alerts as read"""
    await db.execute(
        update(Alert)
        .where(Alert.user_id == user_id, Alert.is_read == False)
        .values(is_read=True, read_at=datetime.now())
    )
    await db.commit()
    
    return {"message": "All alerts marked as read"}

@router.get("/alerts/count")
async def get_alerts_count(
    user_id: str = Query(..., description="User ID"),
    unread_only: bool = Query(False, description="Count only unread alerts"),
    db: AsyncSession = Depends(get_db)
):
    """Get count of user's alerts"""
    query = select(Alert).where(Alert.user_id == user_id)
    
    if unread_only:
        query = query.where(Alert.is_read == False)
    
    result = await db.execute(query)
    alerts = result.scalars().all()
    
    return {
        "user_id": user_id,
        "count": len(alerts),
        "unread_only": unread_only
    }

@router.get("/alerts/types")
async def get_alert_types(
    user_id: str = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db)
):
    """Get count of alerts by type"""
    result = await db.execute(
        select(Alert.alert_type, Alert.id)
        .where(Alert.user_id == user_id)
    )
    alerts = result.all()
    
    type_counts = {}
    for alert_type, _ in alerts:
        type_counts[alert_type] = type_counts.get(alert_type, 0) + 1
    
    return {
        "user_id": user_id,
        "alert_types": type_counts
    }

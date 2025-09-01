from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models.watchlist import WatchlistItem
from app.schemas.watchlist import WatchlistItemCreate, WatchlistItemResponse, WatchlistItemUpdate

router = APIRouter()

@router.get("/watchlist", response_model=List[WatchlistItemResponse])
async def get_watchlist(
    user_id: str = Query(..., description="User ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get user's watchlist"""
    result = await db.execute(
        select(WatchlistItem)
        .where(WatchlistItem.user_id == user_id, WatchlistItem.is_active == True)
        .offset(skip)
        .limit(limit)
    )
    watchlist_items = result.scalars().all()
    return watchlist_items

@router.get("/watchlist/{item_id}", response_model=WatchlistItemResponse)
async def get_watchlist_item(item_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific watchlist item"""
    result = await db.execute(select(WatchlistItem).where(WatchlistItem.id == item_id))
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    
    return item

@router.post("/watchlist", response_model=WatchlistItemResponse)
async def add_to_watchlist(item: WatchlistItemCreate, db: AsyncSession = Depends(get_db)):
    """Add a patent to user's watchlist"""
    # Check if already in watchlist
    result = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.user_id == item.user_id,
            WatchlistItem.patent_number == item.patent_number,
            WatchlistItem.is_active == True
        )
    )
    existing_item = result.scalar_one_or_none()
    
    if existing_item:
        raise HTTPException(status_code=400, detail="Patent already in watchlist")
    
    db_item = WatchlistItem(**item.model_dump())
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    
    return db_item

@router.put("/watchlist/{item_id}", response_model=WatchlistItemResponse)
async def update_watchlist_item(
    item_id: int,
    item_update: WatchlistItemUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a watchlist item"""
    result = await db.execute(select(WatchlistItem).where(WatchlistItem.id == item_id))
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    
    update_data = item_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    
    await db.commit()
    await db.refresh(item)
    
    return item

@router.delete("/watchlist/{item_id}")
async def remove_from_watchlist(item_id: int, db: AsyncSession = Depends(get_db)):
    """Remove a patent from watchlist (soft delete)"""
    result = await db.execute(select(WatchlistItem).where(WatchlistItem.id == item_id))
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    
    item.is_active = False
    await db.commit()
    
    return {"message": "Patent removed from watchlist"}

@router.get("/watchlist/check/{patent_number}")
async def check_watchlist_status(
    patent_number: str,
    user_id: str = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db)
):
    """Check if a patent is in user's watchlist"""
    result = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.user_id == user_id,
            WatchlistItem.patent_number == patent_number,
            WatchlistItem.is_active == True
        )
    )
    item = result.scalar_one_or_none()
    
    return {
        "patent_number": patent_number,
        "user_id": user_id,
        "in_watchlist": item is not None,
        "item_id": item.id if item else None
    }

@router.get("/watchlist/count")
async def get_watchlist_count(
    user_id: str = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db)
):
    """Get count of items in user's watchlist"""
    result = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.user_id == user_id,
            WatchlistItem.is_active == True
        )
    )
    items = result.scalars().all()
    
    return {
        "user_id": user_id,
        "count": len(items)
    }

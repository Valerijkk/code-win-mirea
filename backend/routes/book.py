# backend/routes/book.py
from fastapi import APIRouter, HTTPException
router = APIRouter()
@router.get("/book")
async def book():
    raise HTTPException(status_code=501, detail="Not implemented")

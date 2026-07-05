from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.agents.management import generate_digest

router = APIRouter()

@router.get("/digest")
def get_management_digest(db: Session = Depends(get_db)):
    try:
        result = generate_digest(db)
        return {"status": "success", "digest": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

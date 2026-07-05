from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.agents.general import handle_general_event

router = APIRouter()

@router.post("/general/{event_id}")
def process_general_event(event_id: int, db: Session = Depends(get_db)):
    try:
        result = handle_general_event(db, event_id)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

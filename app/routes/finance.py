from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models
from app.database import get_db
from app.agents.finance import handle_finance_event

router = APIRouter()

@router.post("/finance/{event_id}")
def process_finance_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if event.domain != "finance":
        raise HTTPException(status_code=400, detail="Event is not routed to finance domain. Route it first.")
        
    try:
        finding, suggested_status = handle_finance_event(event, db)
        
        event.agent_response = finding
        models.update_event_status(db, event, suggested_status)
        
        return {"status": "success", "event": event}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

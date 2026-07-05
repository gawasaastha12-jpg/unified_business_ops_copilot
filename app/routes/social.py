from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models
from app.database import get_db
from app.agents.social import handle_social_event

router = APIRouter()

@router.post("/social/{event_id}")
def process_social_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if event.domain != "social":
        raise HTTPException(status_code=400, detail="Event is not routed to social domain. Route it first.")
        
    try:
        result = handle_social_event(event)
        if isinstance(result[0], dict) and "error" in result[0]:
            raise HTTPException(status_code=503, detail=result[0]["error"])
            
        finding, suggested_status = result
        
        event.agent_response = finding
        models.update_event_status(db, event, suggested_status)
        
        return {"status": "success", "event": event}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

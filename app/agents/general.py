from sqlalchemy.orm import Session
from app import models

def handle_general_event(db: Session, event_id: int):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        return {"error": "Event not found"}
        
    # Log it as needing manual review and set status
    models.update_event_status(db, event, "needs_manual_routing")
    
    return {"status": "success", "event": event}

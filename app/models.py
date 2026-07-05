from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from datetime import datetime, timezone
from app.database import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source = Column(String, index=True)
    domain = Column(String, nullable=True)
    raw_content = Column(Text)
    urgency = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    agent_response = Column(Text, nullable=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class StatusLog(Base):
    __tablename__ = "status_log"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, index=True) # Could use ForeignKey, keeping simple for SQLite
    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=True)
    changed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

def update_event_status(db, event: Event, new_status: str):
    if event.status == new_status:
        return
    
    log = StatusLog(
        event_id=event.id,
        old_status=event.status,
        new_status=new_status
    )
    event.status = new_status
    
    db.add(log)
    db.commit()
    db.refresh(event)

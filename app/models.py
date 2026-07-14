from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from datetime import datetime, timezone
from app.database import Base
import hashlib
import secrets

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
    reasoning_trace = Column(Text, nullable=True)

class StatusLog(Base):
    __tablename__ = "status_log"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, index=True) # Could use ForeignKey, keeping simple for SQLite
    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=True)
    changed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class FAQEmbedding(Base):
    __tablename__ = "faq_embeddings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    faq_id = Column(Integer, index=True, unique=True)
    embedding_json = Column(Text)

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

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, index=True, unique=True)
    password_hash = Column(String)
    salt = Column(String)

def hash_password(password: str, salt: str = None) -> tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
    return hashed, salt

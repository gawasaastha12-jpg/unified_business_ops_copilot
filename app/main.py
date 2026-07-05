from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os
from typing import Optional
from app import models
from app.database import engine, get_db
from app.routes.router import router as api_router
from app.routes.customer_care import router as customer_care_router
from app.routes.finance import router as finance_router
from app.routes.social import router as social_router
from app.routes.management import router as management_router
from app.routes.general import router as general_router

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Unified Business Ops Copilot")


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
app.include_router(customer_care_router, prefix="/api/agents")
app.include_router(finance_router, prefix="/api/agents")
app.include_router(social_router, prefix="/api/agents")
app.include_router(general_router, prefix="/api/agents")
app.include_router(management_router, prefix="/api/agents")

@app.get("/api/events")
def list_events(
    domain: Optional[str] = None, 
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Event)
    if domain:
        query = query.filter(models.Event.domain == domain)
    if status:
        query = query.filter(models.Event.status == status)
    return query.all()

@app.get("/api/events/{event_id}")
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        return {"error": "Event not found"}
    return event

# Serve frontend static files
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend_v1", "dist", "public"))
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

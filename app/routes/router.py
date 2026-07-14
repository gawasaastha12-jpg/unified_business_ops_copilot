from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models
from app.database import get_db
from app.llm import generate_json
import json
from pydantic import BaseModel
from app.agents.customer_care import handle_customer_care_event
from app.agents.social import handle_social_event
from app.agents.finance import handle_finance_event
from app.agents.general import handle_general_event

class StatusUpdate(BaseModel):
    status: str

class ResponseUpdate(BaseModel):
    agent_response: str

class SimulateEvent(BaseModel):
    source: str
    raw_content: str

router = APIRouter()

@router.post("/route/{event_id}")
def route_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    prompt = f"""
    Classify the following business event.
    
    Event Source: {event.source}
    Event Content:
    {event.raw_content}
    
    Return a JSON object with exactly these fields:
    - "domain": string, must be one of ["customer_care", "social", "finance", "management"]. Note: social media posts (source: twitter) should be classified as "social". Customer emails (source: email) regarding billing, disputes, or subscription questions should be classified as "customer_care". Only raw transaction logs (source: transaction_csv) should be classified as "finance".
    - "urgency": string, must be one of ["low", "medium", "high"]
    - "confidence": float, a confidence score between 0.0 and 1.0
    """
    
    try:
        classification = generate_json(prompt)
        if "error" in classification:
            raise HTTPException(status_code=503, detail=classification["error"])
            
        domain = classification.get("domain")
        urgency = classification.get("urgency")
        confidence = float(classification.get("confidence", 0.0))
        
        if confidence < 0.5 or domain not in ["customer_care", "social", "finance", "management"]:
            domain = "general"
            
        event.domain = domain
        event.urgency = urgency
        event.confidence = confidence
        
        if domain == "general":
            models.update_event_status(db, event, "needs_manual_routing")
            
        db.commit()
        db.refresh(event)
        
        return {"status": "success", "event": event}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/events/{event_id}/status")
def update_event_status(event_id: int, update: StatusUpdate, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    models.update_event_status(db, event, update.status)
    return {"status": "success", "event": event}

@router.patch("/events/{event_id}/response")
def update_event_response(event_id: int, update: ResponseUpdate, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    event.agent_response = update.agent_response
    
    log = models.StatusLog(
        event_id=event.id,
        old_status=event.status,
        new_status="response_edited"
    )
    db.add(log)
    db.commit()
    db.refresh(event)
    
    return {"status": "success", "event": event}

@router.get("/events/{event_id}/history")
def get_event_history(event_id: int, db: Session = Depends(get_db)):
    history = db.query(models.StatusLog).filter(models.StatusLog.event_id == event_id).order_by(models.StatusLog.changed_at.asc()).all()
    return {"status": "success", "history": history}

@router.post("/events/simulate")
def simulate_event(req: SimulateEvent, db: Session = Depends(get_db)):
    event = models.Event(source=req.source, raw_content=req.raw_content, status="pending")
    db.add(event)
    db.commit()
    db.refresh(event)
    return {"status": "success", "event": event}

def process_single_event(event, db: Session):
    # 1. Route if needed
    if not event.domain:
        # We can just call the route_event logic
        # But wait, route_event is a fastapi route. We can just run the logic directly.
        prompt = f"""
        Classify the following business event.
        
        Event Source: {event.source}
        Event Content:
        {event.raw_content}
        
        Return a JSON object with exactly these fields:
        - "domain": string, must be one of ["customer_care", "social", "finance", "management"]. Note: social media posts (source: twitter) should be classified as "social". Customer emails (source: email) regarding billing, disputes, or subscription questions should be classified as "customer_care". Only raw transaction logs (source: transaction_csv) should be classified as "finance".
        - "urgency": string, must be one of ["low", "medium", "high"]
        - "confidence": float, a confidence score between 0.0 and 1.0
        """
        classification = generate_json(prompt)
        if "error" in classification:
            return {"error": classification["error"]}
            
        domain = classification.get("domain")
        urgency = classification.get("urgency")
        confidence = float(classification.get("confidence", 0.0))
        
        if confidence < 0.5 or domain not in ["customer_care", "social", "finance", "management"]:
            domain = "general"
            
        event.domain = domain
        event.urgency = urgency
        event.confidence = confidence
        event.reasoning_trace = f"Router: Assigned domain={domain}, urgency={urgency}, confidence={confidence:.2f}."
        
        if domain == "general":
            models.update_event_status(db, event, "needs_manual_routing")
            
        db.commit()
        db.refresh(event)
    else:
        if not event.reasoning_trace:
            event.reasoning_trace = f"Router: Pre-assigned domain={event.domain}, urgency={event.urgency}, confidence={event.confidence}."
    
    # 2. Process based on domain
    if event.status == "pending" or (event.domain == "general" and event.status == "needs_manual_routing"):
        if event.domain == "customer_care":
            result = handle_customer_care_event(event)
            if isinstance(result[0], dict) and "error" in result[0]:
                return {"error": result[0]["error"]}
            drafted_reply, suggested_status = result
            event.agent_response = drafted_reply
            models.update_event_status(db, event, suggested_status)
            event.reasoning_trace = (event.reasoning_trace or "") + f"\nCustomer Care Agent: Drafted email response based on FAQ context. Set suggested status to {suggested_status}."
        elif event.domain == "social":
            result = handle_social_event(event)
            if isinstance(result[0], dict) and "error" in result[0]:
                return {"error": result[0]["error"]}
            finding, suggested_status = result
            event.agent_response = finding
            models.update_event_status(db, event, suggested_status)
            event.reasoning_trace = (event.reasoning_trace or "") + f"\nSocial Agent: Analyzed sentiment and drafted public reply. Set suggested status to {suggested_status}."
        elif event.domain == "finance":
            finding, suggested_status = handle_finance_event(event, db)
            event.agent_response = finding
            models.update_event_status(db, event, suggested_status)
            event.reasoning_trace = (event.reasoning_trace or "") + f"\nFinance Agent: Ran duplicate charge and spike detection. Anomaly result: {finding}. Set suggested status to {suggested_status}."
        elif event.domain == "general":
            handle_general_event(db, event.id)
            event.reasoning_trace = (event.reasoning_trace or "") + f"\nGeneral Agent: Set status to needs_manual_routing due to low confidence classification."
            
    db.commit()
    db.refresh(event)
    return {"status": "success", "event": event}

@router.post("/process/{event_id}")
def process_event_endpoint(event_id: int, db: Session = Depends(get_db)):
    import traceback
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    try:
        result = process_single_event(event, db)
        if "error" in result:
            raise HTTPException(status_code=503, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-all")
def process_all_events(db: Session = Depends(get_db)):
    pending_events = db.query(models.Event).filter(models.Event.status == "pending").all()
    processed_count = 0
    updated_events = []
    
    for event in pending_events:
        result = process_single_event(event, db)
        if "error" not in result:
            processed_count += 1
            updated_events.append(result["event"])
            
    return {
        "status": "success", 
        "processed_count": processed_count,
        "updated_events": updated_events
    }

from dotenv import load_dotenv
load_dotenv()

from app.database import SessionLocal
from app import models
from app.agents.customer_care import handle_customer_care_event
import json

db = SessionLocal()

print("--- Testing Phase 4: Composite Confidence Gating ---")

# Let's seed a test event that matches the earbuds keyword, and has high LLM confidence (e.g. 0.95), but matches a cross-domain pattern
# (meaning there's another earbuds event in the DB, which we have!)
# Event #11 is: "The wireless earbuds I ordered stopped charging after 3 days, need a replacement."
# Let's check if there are other earbuds events. Yes, Event #12 and Event #13 are also earbuds events.
event_earbuds = db.query(models.Event).filter(models.Event.id == 11).first()
if event_earbuds:
    # Ensure it has high confidence and low urgency
    event_earbuds.confidence = 0.95
    event_earbuds.urgency = "low"
    event_earbuds.reasoning_trace = "Router: Assigned domain=customer_care, urgency=low, confidence=0.95."
    db.commit()
    db.refresh(event_earbuds)
    
    print(f"Testing Earbuds Event #{event_earbuds.id}:")
    print(f"  Raw Content: {event_earbuds.raw_content}")
    print(f"  Pre-test State: Confidence={event_earbuds.confidence}, Urgency={event_earbuds.urgency}")
    
    # Run the handler
    reply, status = handle_customer_care_event(event_earbuds)
    
    print(f"  Post-test State: Suggested Status = {status} (Expected: pending_approval due to cross-domain pattern)")
    print(f"  Reasoning Trace:\n{event_earbuds.reasoning_trace}")
    print("-" * 60)
else:
    print("Event #11 not found in database.")

db.close()

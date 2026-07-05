import json
from sqlalchemy.orm import Session
from app import models

def handle_finance_event(event, db: Session) -> tuple[str, str]:
    # Parse event JSON
    try:
        txn = json.loads(event.raw_content)
        amount = float(txn.get("amount", 0))
        user_id = txn.get("user_id")
    except Exception as e:
        return f"Parse error: {str(e)}", "flagged"

    # Fetch other finance events
    other_events = db.query(models.Event).filter(
        models.Event.domain == "finance",
        models.Event.id != event.id
    ).all()

    other_txns = []
    for e in other_events:
        try:
            parsed = json.loads(e.raw_content)
            other_txns.append(parsed)
        except Exception:
            continue

    # 1. Duplicate check
    duplicate = None
    for otxn in other_txns:
        if otxn.get("user_id") == user_id and float(otxn.get("amount", 0)) == amount:
            duplicate = otxn
            break
            
    if duplicate:
        return f"Duplicate charge: ${amount:.2f} matches transaction {duplicate.get('txn_id', 'unknown')} for same customer.", "flagged"

    # 2. Spike check
    if other_txns:
        avg_amount = sum(float(t.get("amount", 0)) for t in other_txns) / len(other_txns)
        if avg_amount > 0 and amount > avg_amount * 3:
            return f"Unusual amount: ${amount:.2f} is more than 3x the average of ${avg_amount:.2f}.", "flagged"

    return "No anomaly detected", "resolved"

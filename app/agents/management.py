from sqlalchemy.orm import Session
from app import models
from app.llm import generate_json
from collections import Counter

_cached_digest = None

def generate_digest(db: Session):
    global _cached_digest
    events = db.query(models.Event).all()
    
    # 1. Compute aggregate stats
    domain_counts = Counter(e.domain for e in events if e.domain)
    urgency_counts = Counter(e.urgency for e in events if e.urgency)
    status_counts = Counter(e.status for e in events if e.status)
    
    # Simple cache matching the event count to avoid calling LLM on page refresh
    cache_key = len(events)
    if _cached_digest and _cached_digest.get("cache_key") == cache_key:
        return {
            "stats": {
                "total_events": len(events),
                "by_domain": dict(domain_counts),
                "by_urgency": dict(urgency_counts),
                "by_status": dict(status_counts)
            },
            "digest_paragraph": _cached_digest["digest_paragraph"],
            "cross_domain_patterns": _cached_digest["cross_domain_patterns"]
        }
    
    # 2. Build compact summary
    summary_lines = []
    for e in events:
        domain_str = e.domain or "unrouted"
        status_str = e.status or "pending"
        urgency_str = e.urgency or "unknown"
        
        content_excerpt = e.raw_content[:150] + ("..." if len(e.raw_content) > 150 else "") if e.raw_content else ""
        response_excerpt = e.agent_response[:100] + ("..." if len(e.agent_response) > 100 else "") if e.agent_response else ""
        
        summary_lines.append(
            f"Event ID: {e.id} | Domain: {domain_str} | Urgency: {urgency_str} | Status: {status_str}\n"
            f"Content: {content_excerpt}\n"
            f"Agent Response: {response_excerpt}\n"
        )
        
    events_context = "\n".join(summary_lines)
    
    # 3. LLM Prompt
    prompt = f"""
    You are a Management Ops AI. Your job is to provide a brief digest of the current state of operations.
    
    Here is a summary of all recent events across customer care, social media, and finance:
    
    --- EVENTS SUMMARY ---
    {events_context}
    ----------------------
    
    Please write a short natural-language digest paragraph (3-5 sentences) summarizing what happened, in a tone appropriate for a business owner.
    
    IMPORTANT: Identify any cross-domain patterns or correlations across the events (e.g. a customer care complaint and a finance anomaly that seem related). 
    If none exist, say so explicitly rather than inventing a connection.
    
    Return EXACTLY this JSON structure:
    - "digest_paragraph": string
    - "cross_domain_patterns": array of objects, where each object has:
      - "related_event_ids": array of integers
      - "reason": string (short explanation of the connection)
    If no patterns are found, "cross_domain_patterns" should be an empty array.
    """
    
    response = generate_json(prompt)
    
    # Cache the response for subsequent quick loads
    _cached_digest = {
        "cache_key": len(events),
        "digest_paragraph": response.get("digest_paragraph", ""),
        "cross_domain_patterns": response.get("cross_domain_patterns", [])
    }
    
    # 4. Return everything
    return {
        "stats": {
            "total_events": len(events),
            "by_domain": dict(domain_counts),
            "by_urgency": dict(urgency_counts),
            "by_status": dict(status_counts)
        },
        "digest_paragraph": _cached_digest["digest_paragraph"],
        "cross_domain_patterns": _cached_digest["cross_domain_patterns"]
    }

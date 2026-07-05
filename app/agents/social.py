from app.llm import generate_json

def handle_social_event(event) -> tuple[str, str]:
    prompt = f"""
    You are a social media manager for a brand. We received this mention on social media:
    
    CONTENT:
    {event.raw_content}
    
    Please analyze this post.
    1. Classify it as either "risky" (public complaint, negative sentiment, brand risk) or "routine" (positive or neutral mention).
    2. Draft a brief, on-brand public reply. If risky, redirect to DMs or support. If routine, give a friendly acknowledgment.
    
    Return EXACTLY this JSON structure:
    - "classification": string ("risky" or "routine")
    - "drafted_reply": string
    """
    
    response = generate_json(prompt)
    if "error" in response:
        return {"error": response["error"]}, ""
        
    classification = response.get("classification", "risky").lower()
    drafted_reply = response.get("drafted_reply", "Thanks for reaching out! Please DM us for further assistance.")
    
    suggested_status = "pending_approval" if classification == "risky" else "ready_to_send"
    
    finding = f"[{classification.upper()}] {drafted_reply}"
    return finding, suggested_status

from app.agents.retrieval import retrieve_relevant_faqs
from app.llm import generate_json
import json

def handle_customer_care_event(event) -> tuple[str, str]:
    """
    Handles a customer care event by retrieving relevant FAQs and asking the LLM to draft a response.
    Returns: (drafted_reply_text, suggested_status)
    """
    
    # 1. Retrieve relevant context
    faqs = retrieve_relevant_faqs(event.raw_content, top_k=3)
    
    # Format the context
    context_str = "\n\n".join([f"Q: {faq['question']}\nA: {faq['answer']}" for faq in faqs])
    
    # 2. Build the LLM prompt
    prompt = f"""
    You are an empathetic, helpful customer care agent for a brand.
    A customer has reached out with the following message:
    
    CUSTOMER MESSAGE:
    {event.raw_content}
    
    Here is our official FAQ Knowledge Base that might be relevant:
    --- FAQ KNOWLEDGE BASE ---
    {context_str}
    --------------------------
    
    Based on the Customer Message and the FAQ Knowledge Base, please draft a helpful and empathetic reply to the customer.
    If the FAQ does not cover their exact issue, do your best to address their concern empathetically and let them know we are looking into it.
    
    You must output a JSON object with exactly this field:
    - "drafted_reply": string, the text of the email/message you would send back to the customer.
    """
    
    # 3. Call the LLM wrapper
    response_json = generate_json(prompt)
    if "error" in response_json:
        return {"error": response_json["error"]}, ""

    drafted_reply = response_json.get("drafted_reply", "Failed to generate reply.")
    
    # 4. Determine suggested status
    suggested_status = "pending_approval"
    if event.confidence is not None and event.confidence > 0.8 and event.urgency != "high":
        suggested_status = "ready_to_send"
        
    return drafted_reply, suggested_status

from dotenv import load_dotenv
load_dotenv()

from app.agents.retrieval import retrieve_relevant_faqs
from app.llm import (
    generate_json, 
    MODEL_FALLBACK_CHAIN, 
    _is_transient_or_quota_error, 
    _parse_retry_delay, 
    client
)
from google.genai import types
from app.database import SessionLocal
from app import models
import json
import time

def handle_customer_care_event_agentic(event) -> tuple[str, str]:
    tool_called = False
    called_args = {}
    found_events_count = 0
    related_events_info = []

    # 1. Define the tool locally so it has access to nonlocal tracking variables and database
    def find_related_events(customer_identifier: str | None = None, product_keyword: str | None = None) -> list:
        """
        Search the shared event store for other events matching the customer identifier or product keyword.
        
        Args:
            customer_identifier: A customer identifier (e.g. email, order ID like #12345, user ID).
            product_keyword: A product keyword or name (e.g. 'earbuds', 'static', 'battery').
        """
        nonlocal tool_called, called_args, found_events_count, related_events_info
        tool_called = True
        called_args = {"customer_identifier": customer_identifier, "product_keyword": product_keyword}
        
        print(f"--- [Tool Called] find_related_events: customer_identifier={customer_identifier}, product_keyword={product_keyword}")
        
        db = SessionLocal()
        try:
            from sqlalchemy import or_
            filters = []
            if customer_identifier:
                clean_id = customer_identifier.replace("#", "")
                filters.append(models.Event.raw_content.like(f"%{customer_identifier}%"))
                filters.append(models.Event.raw_content.like(f"%{clean_id}%"))
            if product_keyword:
                filters.append(models.Event.raw_content.like(f"%{product_keyword}%"))
                
            if not filters:
                return []
                
            results = db.query(models.Event).filter(
                models.Event.id != event.id,
                or_(*filters)
            ).all()
            
            found_events_count = len(results)
            related_events_info = [f"Event #{e.id} ({e.domain})" for e in results]
            
            serialized = [{
                "id": e.id,
                "source": e.source,
                "domain": e.domain,
                "raw_content": e.raw_content,
                "urgency": e.urgency,
                "status": e.status
            } for e in results]
            print(f"--- [Tool Success] Found {len(serialized)} related events.")
            return serialized
        except Exception as ex:
            print("Tool database lookup error:", ex)
            return []
        finally:
            db.close()

    # 2. Retrieve FAQs for RAG fallback/context
    faqs = retrieve_relevant_faqs(event.raw_content, top_k=3)
    context_str = "\n\n".join([f"Q: {faq['question']}\nA: {faq['answer']}" for faq in faqs])

    # 3. Build the agent prompt
    prompt = f"""
    You are an empathetic, helpful customer care agent for a brand.
    A customer has reached out with the following message:
    
    CUSTOMER MESSAGE:
    {event.raw_content}
    
    Here is our official FAQ Knowledge Base that might be relevant:
    --- FAQ KNOWLEDGE BASE ---
    {context_str}
    --------------------------
    
    You have a tool `find_related_events` that you can call to search for other customer complaints or transaction events in the database if the customer message suggests a broader issue, order dispute, billing issue, or product quality problem (like broken earbuds or duplicate charges).
    
    If the customer message is a simple, routine question (like a billing address change request), do NOT call the tool.
    
    If you call the tool and find related events, you MUST incorporate that context into your final answer.
    
    Your final response MUST be a JSON object with exactly this field:
    - "drafted_reply": string, the text of the email/message you would send back to the customer.
    """

    # 4. Generate with Tool Calling (handling retries & fallback)
    config = types.GenerateContentConfig(
        tools=[find_related_events],
        temperature=0.0
    )
    
    response_text = None
    for model in MODEL_FALLBACK_CHAIN:
        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=config
                )
                response_text = response.text
                break
            except Exception as e:
                error_str = str(e)
                is_transient = _is_transient_or_quota_error(error_str)
                if is_transient and attempt < 2:
                    delay = _parse_retry_delay(error_str)
                    wait = min(delay, 20.0)
                    time.sleep(wait)
                elif is_transient:
                    break
                else:
                    if attempt < 2:
                        time.sleep(2)
                    else:
                        break
        if response_text:
            break

    # 5. Parse output and handle reasoning trace
    drafted_reply = None
    if response_text:
        try:
            # Clean response text if it has markdown formatting
            cleaned_text = response_text.strip()
            if cleaned_text.startswith("```"):
                lines = cleaned_text.split("\n")
                if lines[0].startswith("```json") or lines[0].startswith("```"):
                    cleaned_text = "\n".join(lines[1:-1]).strip()
            parsed = json.loads(cleaned_text)
            drafted_reply = parsed.get("drafted_reply")
        except Exception as pe:
            print("Failed to parse JSON response:", pe)
            print("Raw text was:", response_text)

    # 6. Fallback if JSON parsing or generation failed
    if not drafted_reply:
        print("Falling back to standard one-shot generation...")
        fallback_json = generate_json(prompt)
        drafted_reply = fallback_json.get("drafted_reply", "Failed to generate reply.")

    # 7. Determine status
    suggested_status = "pending_approval"
    # If the tool was called and found related cross-domain events, ALWAYS require approval (pending_approval)
    # Otherwise, check the standard criteria
    if not tool_called or found_events_count == 0:
        if event.confidence is not None and event.confidence > 0.8 and event.urgency != "high":
            suggested_status = "ready_to_send"

    # 8. Record reasoning trace
    trace_lines = []
    if tool_called:
        trace_lines.append(f"Customer Care Agent: Considered cross-domain lookup and invoked find_related_events tool (args: {called_args}).")
        if found_events_count > 0:
            trace_lines.append(f"Found {found_events_count} related events ({', '.join(related_events_info)}). Incorporated context into reply.")
        else:
            trace_lines.append("No related events found in database.")
    else:
        trace_lines.append("Customer Care Agent: Handled directly. Decided related event search was not necessary because the request is routine.")
    
    trace_lines.append(f"Suggested status set to {suggested_status}.")
    event.reasoning_trace = (event.reasoning_trace or "") + "\n" + "\n".join(trace_lines)

    return drafted_reply, suggested_status

# Run local test
if __name__ == "__main__":
    db = SessionLocal()
    # Test case A: wrong item in order #12345
    event_correlated = db.query(models.Event).filter(models.Event.id == 3).first()
    if event_correlated:
        print("\n=== Testing Correlated Event (id=3) ===")
        print("Raw Content:", event_correlated.raw_content)
        reply, status = handle_customer_care_event_agentic(event_correlated)
        print("Drafted Reply:", reply[:150] + "...")
        print("Reasoning Trace:\n", event_correlated.reasoning_trace)
        
    # Test case B: change billing address
    event_routine = db.query(models.Event).filter(models.Event.id == 2).first()
    if event_routine:
        print("\n=== Testing Routine Event (id=2) ===")
        print("Raw Content:", event_routine.raw_content)
        reply, status = handle_customer_care_event_agentic(event_routine)
        print("Drafted Reply:", reply[:150] + "...")
        print("Reasoning Trace:\n", event_routine.reasoning_trace)
    
    db.close()

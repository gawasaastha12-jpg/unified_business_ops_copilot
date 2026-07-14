import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# Define the tool function with clear type annotations and docstring
def find_related_events(customer_identifier: str | None = None, product_keyword: str | None = None) -> str:
    """
    Search the shared event store for other events matching the customer identifier or product keyword.
    
    Args:
        customer_identifier: A unique identifier for the customer (e.g. email, name, order ID like #12345).
        product_keyword: A product keyword or name (e.g. 'earbuds', 'battery').
        
    Returns:
        A list of related events found.
    """
    print(f"--- [Tool Executed] find_related_events with args: customer_identifier={customer_identifier}, product_keyword={product_keyword}")
    if product_keyword == "earbuds" or (customer_identifier and "#12345" in customer_identifier):
        return "[Event #31: email - refund earbuds stopped charging, Event #32: twitter - earbuds died in 3 days]"
    return "[]"

# Test Case 1: Correlated Event (order complaint)
prompt_correlated = """
Identify if we need to search for related customer events.
Customer message: "I received the wrong item in my order #12345. I need a replacement ASAP."
"""

# Test Case 2: Routine Event
prompt_routine = """
Identify if we need to search for related customer events.
Customer message: "How do I change my billing address?"
"""

def test_prompt(prompt_text):
    print(f"\nPrompt: {prompt_text.strip()}")
    # Configure tool calling
    config = types.GenerateContentConfig(
        tools=[find_related_events],
        temperature=0.0
    )
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt_text,
            config=config
        )
        print("Response text:", response.text)
        print("Function calls:", response.function_calls)
    except Exception as e:
        print("Error:", e)

print("--- Testing Correlated Prompt ---")
test_prompt(prompt_correlated)

print("--- Testing Routine Prompt ---")
test_prompt(prompt_routine)

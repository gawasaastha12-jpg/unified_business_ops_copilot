import os
import json
import time
import re
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# Model priority list — each has its own independent quota on the free tier
MODELS = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",       # separate quota
    "gemini-2.5-flash-lite",       # separate quota
    "gemini-2.5-flash",            # separate quota
    "gemini-2.0-flash-lite-001",
    "gemini-2.0-flash-001",
    "gemini-2.5-pro",
    "gemini-flash-latest",         # Gemini 1.5 Flash fallback
    "gemini-flash-lite-latest",    # Gemini 1.5 Flash-Lite fallback
    "gemini-pro-latest",           # Gemini 1.5 Pro fallback
]

# New fallback chain for generate_json (primary then lighter models)
MODEL_FALLBACK_CHAIN = [
    "gemini-flash-latest",         # Gemini 1.5 Flash equivalent
    "gemini-flash-lite-latest",    # Gemini 1.5 Flash-Lite equivalent
    "gemini-pro-latest",           # Gemini 1.5 Pro equivalent
]

def _parse_retry_delay(error_str: str) -> float:
    """Extract retry delay in seconds from a Gemini quota error message."""
    match = re.search(r"'retryDelay':\s*'(\d+)s'", str(error_str))
    if match:
        return float(match.group(1))
    match = re.search(r'retry_delay\s*\{\s*seconds:\s*(\d+)', str(error_str))
    if match:
        return float(match.group(1))
    return 3.0

def _is_transient_or_quota_error(error_str: str) -> bool:
    return (
        "RESOURCE_EXHAUSTED" in error_str
        or "429" in error_str
        or "UNAVAILABLE" in error_str
        or "503" in error_str
        or "high demand" in error_str.lower()
    )

def generate_json(prompt: str) -> dict:
    """Calls Gemini and returns parsed JSON. Tries multiple models on quota/transient errors."""
    config = types.GenerateContentConfig(response_mime_type="application/json")
    full_prompt = prompt + "\n\nRespond with ONLY valid JSON."

    for model in MODEL_FALLBACK_CHAIN:
        for attempt in range(3):  # 3 attempts per model
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=full_prompt,
                    config=config
                )
                result = json.loads(response.text)
                # Include which model served the response for debugging
                if isinstance(result, dict):
                    result["_model_used"] = model
                return result
            except Exception as e:
                error_str = str(e)
                is_transient = _is_transient_or_quota_error(error_str)

                if is_transient and attempt < 2:
                    delay = _parse_retry_delay(error_str)
                    wait = min(delay, 20.0)  # Cap at 20s for web requests
                    print(f"[{model}] Quota/Transient hit (attempt {attempt+1}), waiting {wait:.0f}s: {error_str[:120]}...")
                    time.sleep(wait)
                elif is_transient:
                    # Exhausted/unavailable for this model — try next model
                    print(f"[{model}] Model unavailable/exhausted, trying next model...")
                    time.sleep(1)  # Short pause before trying the next model
                    break
                else:
                    # Non-transient error (e.g. invalid prompt, syntax, etc.)
                    if attempt < 2:
                        time.sleep(2)
                    else:
                        print(f"[{model}] Non-transient error: {e}")
                        break

    print("All models exhausted or unavailable.")
    return {"error": "llm_unavailable"}

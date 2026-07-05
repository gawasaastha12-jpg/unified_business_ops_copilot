import traceback
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

try:
    config = types.GenerateContentConfig(response_mime_type="application/json")
    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents="Hello\n\nRespond with ONLY valid JSON.",
        config=config
    )
    print("Success:", response.text)
except Exception as e:
    traceback.print_exc()

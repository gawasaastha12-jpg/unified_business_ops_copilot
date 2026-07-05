import json
from app.llm import generate_json

prompt = 'Return a JSON object with key "colors" containing a list of three colors.'
result = generate_json(prompt)
print(json.dumps(result, indent=2))

import os
from google import genai
from dotenv import load_dotenv
load_dotenv()

client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))
try:
    print('Testing models/text-embedding-004:')
    result = client.models.embed_content(
        model='text-embedding-004',
        contents='test text'
    )
    print('Success! Embedding length:', len(result.embeddings[0].values))
except Exception as e:
    print('Failed models/text-embedding-004:', e)

try:
    print('\nTesting text-embedding-004 (no models/ prefix):')
    result = client.models.embed_content(
        model='text-embedding-004',
        contents='test text'
    )
    print('Success! Embedding length:', len(result.embeddings[0].values))
except Exception as e:
    print('Failed text-embedding-004:', e)

try:
    print('\nTesting models/gemini-embedding-2:')
    result = client.models.embed_content(
        model='models/gemini-embedding-2',
        contents='test text'
    )
    print('Success! Embedding length:', len(result.embeddings[0].values))
except Exception as e:
    print('Failed models/gemini-embedding-2:', e)

try:
    print('\nTesting gemini-embedding-2 (no models/ prefix):')
    result = client.models.embed_content(
        model='gemini-embedding-2',
        contents='test text'
    )
    print('Success! Embedding length:', len(result.embeddings[0].values))
except Exception as e:
    print('Failed gemini-embedding-2:', e)

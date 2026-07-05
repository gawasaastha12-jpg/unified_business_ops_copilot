import json
import math
import os
from google import genai
from typing import List, Dict

# In-memory storage for FAQ embeddings
faq_knowledge_base = []

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    dot_product = sum(x * y for x, y in zip(vec1, vec2))
    mag1 = math.sqrt(sum(x * x for x in vec1))
    mag2 = math.sqrt(sum(x * x for x in vec2))
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot_product / (mag1 * mag2)

def get_embedding(text: str, task_type: str = "RETRIEVAL_DOCUMENT") -> List[float]:
    result = client.models.embed_content(
        model="gemini-embedding-2",
        contents=text,
        config=genai.types.EmbedContentConfig(task_type=task_type)
    )
    return result.embeddings[0].values

def load_and_embed_faqs():
    """Loads FAQs from JSON and computes embeddings. Run once on startup."""
    global faq_knowledge_base
    if faq_knowledge_base:
        return # Already loaded
        
    faq_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "faq.json")
    with open(faq_path, "r", encoding="utf-8") as f:
        faqs = json.load(f)
        
    for faq in faqs:
        combined_text = f"Q: {faq['question']}\nA: {faq['answer']}"
        embedding = get_embedding(combined_text, task_type="RETRIEVAL_DOCUMENT")
        faq_knowledge_base.append({
            "faq": faq,
            "embedding": embedding
        })
    print(f"Loaded and embedded {len(faq_knowledge_base)} FAQs.")

def retrieve_relevant_faqs(query: str, top_k: int = 3) -> List[Dict]:
    """Retrieves the top_k most relevant FAQs for a given query."""
    if not faq_knowledge_base:
        load_and_embed_faqs()
        
    query_embedding = get_embedding(query, task_type="RETRIEVAL_QUERY")
    
    # Calculate similarities
    scored_faqs = []
    for item in faq_knowledge_base:
        score = cosine_similarity(query_embedding, item["embedding"])
        scored_faqs.append((score, item["faq"]))
        
    # Sort by descending score
    scored_faqs.sort(key=lambda x: x[0], reverse=True)
    
    # Return top_k faqs
    return [item[1] for item in scored_faqs[:top_k]]

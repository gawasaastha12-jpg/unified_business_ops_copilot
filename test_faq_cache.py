import os
from dotenv import load_dotenv
load_dotenv()

import sqlite3
import json
from app.database import Base, engine, SessionLocal
from app.models import FAQEmbedding
from app.agents.retrieval import load_and_embed_faqs, faq_knowledge_base

def test_cache():
    # Make sure tables exist
    Base.metadata.create_all(bind=engine)
    
    # Clean cache table
    db = SessionLocal()
    db.query(FAQEmbedding).delete()
    db.commit()
    db.close()
    
    print("FAQEmbedding table cleared.")
    
    # Clear in-memory cache
    faq_knowledge_base.clear()
    
    # 1st run: Should compute and store
    print("\n--- First Run (Computing Embeddings) ---")
    load_and_embed_faqs()
    
    # Check count in DB
    db = SessionLocal()
    cached_count = db.query(FAQEmbedding).count()
    print(f"Stored in FAQEmbedding table: {cached_count} entries.")
    db.close()
    
    assert cached_count > 0, "No embeddings saved to SQLite database!"
    
    # Clear in-memory cache
    faq_knowledge_base.clear()
    
    # 2nd run: Should load from cache
    print("\n--- Second Run (Loading from Cache) ---")
    load_and_embed_faqs()
    print("Success! Second run loaded successfully.")

if __name__ == "__main__":
    test_cache()

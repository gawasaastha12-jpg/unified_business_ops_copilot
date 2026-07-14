from dotenv import load_dotenv
load_dotenv()

from app.database import SessionLocal
from app.agents.management import generate_digest
import json

db = SessionLocal()
try:
    print("Generating operations digest...")
    digest = generate_digest(db)
    print("\n--- OP DIGEST PARAGRAPH ---")
    print(digest["digest_paragraph"])
    print("\n--- DETECTED CROSS-DOMAIN PATTERNS ---")
    print(json.dumps(digest["cross_domain_patterns"], indent=2))
finally:
    db.close()

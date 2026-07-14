from app.database import engine, SessionLocal
from app import models
from app.seed_data import seed
from app.routes.router import process_single_event

print("Creating tables...")
models.Base.metadata.create_all(bind=engine)

print("Seeding database...")
seed()

db = SessionLocal()
try:
    pending = db.query(models.Event).filter(models.Event.status == "pending").all()
    print(f"Found {len(pending)} pending events. Processing them...")
    for e in pending:
        print(f"Processing event #{e.id} (source={e.source})...")
        res = process_single_event(e, db)
        if "error" in res:
            print(f"Error processing event #{e.id}: {res['error']}")
        else:
            # Query it back
            db.refresh(e)
            print(f"Event #{e.id} processed successfully:")
            print(f"  Domain: {e.domain}")
            print(f"  Status: {e.status}")
            print(f"  Reasoning Trace: {e.reasoning_trace}")
            print("-" * 50)
finally:
    db.close()

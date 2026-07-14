from app.database import SessionLocal, engine
from app import models

def seed():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(models.Event).count() > 0:
        print("Database already seeded.")
        return
        
    events = [
        # Customer Care
        models.Event(source="email", raw_content="My account is locked and I can't access my recent purchases. Help!"),
        models.Event(source="email", raw_content="How do I change my billing address?"),
        models.Event(source="email", raw_content="I received the wrong item in my order #12345. I need a replacement ASAP."),
        models.Event(source="email", raw_content="Just writing to say I love your new product line."),
        
        # Social
        models.Event(source="twitter", raw_content="Terrible experience with @YourBrand today. The app keeps crashing when I try to checkout. #fail"),
        models.Event(source="twitter", raw_content="Huge shoutout to @YourBrand for the amazing customer service today!"),
        models.Event(source="twitter", raw_content="Does anyone know if @YourBrand is having a Black Friday sale?"),
        
        # Finance Events (transaction parsing and anomaly detection)
        models.Event(source="transaction_csv", raw_content='{"txn_id": "T001", "amount": 49.99, "user_id": "U123"}'),
        models.Event(source="transaction_csv", raw_content='{"txn_id": "T002", "amount": 49.99, "user_id": "U123"}'), # duplicate
        models.Event(source="transaction_csv", raw_content='{"txn_id": "T003", "amount": 15000.00, "user_id": "U999"}'), # spike
        
        # New Cross-Domain Scenario: Earbuds
        models.Event(source="email", raw_content="The wireless earbuds I ordered stopped charging after 3 days, need a replacement."),
        models.Event(source="twitter", raw_content="@YourBrand earbuds died in 3 days, not impressed."),
        models.Event(source="transaction_csv", raw_content='{"txn_id": "T004", "amount": 129.99, "user_id": "U888", "notes": "refund for broken earbuds"}'),
        
        # New Cross-Domain Scenario: Subscription billing dispute
        models.Event(source="email", raw_content="Hi support, I was billed twice for my subscription this month. I see two charges of $49.99 for user U123. Can you check and refund the duplicate?"),
    ]
    
    db.add_all(events)
    db.commit()
    print("Database seeded with demo events!")

if __name__ == "__main__":
    seed()

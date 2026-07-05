from app.database import SessionLocal
from app import models

db = SessionLocal()

events = [
    models.Event(source='email', raw_content='The wireless earbuds I ordered stopped charging after 3 days, need a replacement.'),
    models.Event(source='twitter', raw_content='@YourBrand earbuds died in 3 days, not impressed.'),
    models.Event(source='transaction_csv', raw_content='{"txn_id": "T004", "amount": 129.99, "user_id": "U888", "notes": "refund for broken earbuds"}'),
]

db.add_all(events)
db.commit()
print('Added earbuds events!')

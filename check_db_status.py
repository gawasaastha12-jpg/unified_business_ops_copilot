import sqlite3
import os

if os.path.exists('copilot.db'):
    conn = sqlite3.connect('copilot.db')
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, domain, status FROM events")
        rows = cursor.fetchall()
        print(f"Total events in DB: {len(rows)}")
        processed = [r for r in rows if r[2] != 'pending']
        print(f"Processed events: {len(processed)}")
        for r in rows:
            print(f"Event #{r[0]}: Domain={r[1]}, Status={r[2]}")
    except Exception as e:
        print("Error query db:", e)
    finally:
        conn.close()
else:
    print("DB file does not exist")

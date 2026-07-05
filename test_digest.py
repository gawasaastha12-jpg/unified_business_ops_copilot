import requests
r = requests.get('http://127.0.0.1:8000/api/digest')
print(f'Status: {r.status_code}')
d = r.json()
stats = d.get('stats', {})
print(f'Stats: {stats}')
patterns = d.get('cross_domain_patterns', [])
print(f'Patterns count: {len(patterns)}')
for p in patterns:
    print(f'  Pattern: {p}')
digest = d.get('digest_paragraph', '')
print(f'Digest: {digest[:300]}')

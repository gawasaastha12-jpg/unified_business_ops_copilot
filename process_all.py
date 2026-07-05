import requests
base_url = 'http://127.0.0.1:8000'

def process_all():
    events = requests.get(f'{base_url}/api/events').json()
    for e in events:
        eid = e['id']
        domain = e.get('domain')
        if not domain:
            print(f'Routing {eid}...')
            res = requests.post(f'{base_url}/api/route/{eid}')
            if res.status_code == 200:
                domain = res.json()['event']['domain']
            
        status = e.get('status')
        # Re-fetch event to get updated status after routing
        if not status or status == 'pending':
            e_updated = requests.get(f'{base_url}/api/events/{eid}').json()
            status = e_updated.get('status')
            
        if status == 'pending':
            print(f'Processing {eid} via {domain}...')
            if domain == 'customer_care':
                requests.post(f'{base_url}/api/agents/customer-care/{eid}')
            elif domain == 'social':
                requests.post(f'{base_url}/api/agents/social/{eid}')
            elif domain == 'finance':
                requests.post(f'{base_url}/api/agents/finance/{eid}')

process_all()
print('All events processed!')

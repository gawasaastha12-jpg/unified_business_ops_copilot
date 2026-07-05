from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        print("Navigating to http://localhost:5173")
        page.goto('http://localhost:5173', wait_until='domcontentloaded', timeout=30000)

        # Wait for the loading state to clear and the panel to render
        print("Waiting for Simulate Live Event panel to load (up to 3 minutes for API latency)...")
        panel = page.locator('.glass-panel').filter(has_text='Simulate Live Event')
        panel.wait_for(state="visible", timeout=180000)
        print("Panel loaded successfully!")

        # 1. Fill input with user's specific query and take panel screenshot
        page.locator('.glass-panel').filter(has_text='Simulate Live Event').locator('input').fill('hello, i have received a faultyy mouse. need a replacement')
        panel.screenshot(path='simulate_panel_filled.png')
        print('Took simulate panel screenshot')

        # 2. Take full dashboard screenshot showing event #24 at the bottom
        page.screenshot(path='dashboard_final.png', full_page=True)
        print('Took full dashboard screenshot')

        browser.close()

run()

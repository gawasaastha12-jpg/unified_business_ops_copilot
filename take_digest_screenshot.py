from playwright.sync_api import sync_playwright
import os
import time

def take_screenshot():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Ensure we have a clean context
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()
        
        print("Navigating to landing page...")
        page.goto('http://localhost:5173', wait_until='networkidle', timeout=60000)
        
        # Click the "Enter the Dashboard" button
        print("Clicking 'Enter the Dashboard'...")
        cta = page.locator('button').filter(has_text='Enter the Dashboard')
        cta.click()
        
        # Wait for the dashboard stats and digest to render
        print("Waiting for dashboard to load...")
        time.sleep(5)  # Wait for API data fetching to settle
        
        # Find the Management Digest panel
        print("Locating Management Digest panel...")
        digest_panel = page.locator('h3').filter(has_text='Management Digest').locator('xpath=..')
        digest_panel.wait_for(state="visible", timeout=30000)
        
        # Ensure public directory exists
        public_dir = os.path.join('frontend_v1', 'client', 'public')
        os.makedirs(public_dir, exist_ok=True)
        
        target_path = os.path.join(public_dir, 'digest_screenshot.png')
        print(f"Taking screenshot and saving to {target_path}...")
        digest_panel.screenshot(path=target_path)
        print("Screenshot taken successfully!")
        
        browser.close()

if __name__ == "__main__":
    take_screenshot()

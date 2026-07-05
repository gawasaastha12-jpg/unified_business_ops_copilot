from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # 1. Load the dashboard
        print("Navigating to http://localhost:5173")
        page.goto("http://localhost:5173", wait_until="domcontentloaded", timeout=15000)
        
        # Click Refresh to ensure backend data loads
        page.wait_for_selector("text=Simulate Live Event", timeout=10000)
        page.click("text=Refresh Data")
        page.wait_for_timeout(3000)  # wait for data to load
        
        # Take initial screenshot (should show events loaded)
        page.screenshot(path="initial_dashboard.png")
        print("Took initial screenshot: initial_dashboard.png")
        
        # 2. Fill out the simulate form
        print("Filling out simulate form...")
        # Use first select in the Simulate panel (the source dropdown)
        page.locator(".glass-panel").filter(has_text="Simulate Live Event").locator("select").first.select_option("email")
        page.locator(".glass-panel").filter(has_text="Simulate Live Event").locator("input").fill("The earbuds I bought are still not charging properly, third time now")
        
        # Screenshot of the panel
        panel = page.locator(".glass-panel").filter(has_text="Simulate Live Event")
        panel.screenshot(path="simulate_panel.png")
        print("Took simulate panel screenshot: simulate_panel.png")
        
        # 3. Submit and wait for processing
        print("Submitting...")
        page.click('button:has-text("Submit & Process")')
        
        # Wait for the feed to update (loading finishes when button is re-enabled)
        page.wait_for_selector('button:has-text("Submit & Process"):not([disabled])', timeout=30000)
        time.sleep(2) # Give React a moment to render the new row
        
        # Take screenshot of the feed to show the new event
        page.screenshot(path="dashboard_after_simulate.png")
        print("Took screenshot after simulate: dashboard_after_simulate.png")
        
        # 4. Expand the newly created event (it should be the highest ID, likely at the top or bottom depending on sorting, but let's just click the row containing our text)
        print("Expanding the event row...")
        row = page.locator('tr:has-text("The earbuds I bought")').first
        row.click()
        
        # Wait for expanded content
        page.wait_for_selector('text=Approve')
        
        # 5. Approve the event
        print("Approving the event...")
        page.click('button:has-text("Approve")')
        
        # Wait for loading to finish (button returns to Approve from Wait...)
        page.wait_for_selector('button:has-text("Approve"):not([disabled])', timeout=30000)
        
        # 6. Check history
        print("Checking history...")
        page.click('button:has-text("Show History")')
        page.wait_for_selector('text=approved')
        
        # Take final screenshot showing history and approved status
        page.screenshot(path="dashboard_final_approved.png")
        print("Took final screenshot: dashboard_final_approved.png")
        
        browser.close()

if __name__ == '__main__':
    run()

"""QA Test Script for HyperFrames Tab"""
import json
import os
from playwright.sync_api import sync_playwright

EVIDENCE_DIR = r"C:\Projects\3d-avatar-generate\.sisyphus\evidence\final-qa"
BASE_URL = "http://localhost:3001"

# Track results
results = {
    "scenarios": [],
    "integration": [],
    "edge_cases": [],
    "console_errors": [],
}

def screenshot(page, name):
    path = os.path.join(EVIDENCE_DIR, f"{name}.png")
    page.screenshot(path=path, full_page=True)
    print(f"  📸 Screenshot saved: {name}.png")
    return path

def check_element(page, selector, description):
    """Check if element exists and is visible"""
    try:
        el = page.locator(selector).first
        if el.is_visible(timeout=3000):
            print(f"  ✅ {description} — visible")
            return True
        else:
            print(f"  ❌ {description} — exists but not visible")
            return False
    except Exception as e:
        print(f"  ❌ {description} — not found ({e})")
        return False

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    
    # Collect console messages
    console_messages = []
    page = context.new_page()
    
    def handle_console(msg):
        if msg.type in ("error", "warning"):
            console_messages.append({"type": msg.type, "text": msg.text})
    
    page.on("console", handle_console)
    
    # ========================================
    # SCENARIO 1: Main page loads, Seedance tab default
    # ========================================
    print("\n=== SCENARIO 1: Main page loads ===")
    page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(2000)
    screenshot(page, "01-main-page-seedance-tab")
    
    # Check main tabs visible
    tabs_visible = True
    for tab_name in ["Seedance", "HeyGen", "HyperFrames"]:
        found = check_element(page, f'text="{tab_name}"', f"Tab '{tab_name}'")
        if not found:
            tabs_visible = False
    
    results["scenarios"].append({
        "name": "Main page loads with tabs",
        "pass": tabs_visible
    })
    
    # ========================================
    # SCENARIO 2: Click HyperFrames tab
    # ========================================
    print("\n=== SCENARIO 2: Click HyperFrames tab ===")
    try:
        hf_tab = page.locator('text="HyperFrames"').first
        hf_tab.click(timeout=5000)
        page.wait_for_timeout(2000)
        screenshot(page, "02-hyperframes-tab")
        results["scenarios"].append({"name": "HyperFrames tab clickable", "pass": True})
    except Exception as e:
        print(f"  ❌ Failed to click HyperFrames tab: {e}")
        screenshot(page, "02-hyperframes-tab-fail")
        results["scenarios"].append({"name": "HyperFrames tab clickable", "pass": False})
    
    # ========================================
    # SCENARIO 3: Verify key UI elements in HyperFrames
    # ========================================
    print("\n=== SCENARIO 3: Verify HyperFrames UI elements ===")
    
    ui_checks = {
        "Toolbar (New/Open/Save/Import/Render)": False,
        "Code editor area": False,
        "Preview area": False,
        "Timeline area": False,
        "Bottom tab bar": False,
    }
    
    # Check toolbar buttons
    toolbar_found = 0
    for btn_text in ["New", "Open", "Save", "Import", "Render"]:
        if check_element(page, f'button:has-text("{btn_text}")', f"Toolbar button '{btn_text}'"):
            toolbar_found += 1
    ui_checks["Toolbar (New/Open/Save/Import/Render)"] = toolbar_found >= 3
    
    # Check editor/preview/timeline areas by common patterns
    # Look for common class names or data attributes
    for keyword in ["editor", "Editor", "code", "Code"]:
        if check_element(page, f'[class*="{keyword}" i]', f"Editor area ({keyword})"):
            ui_checks["Code editor area"] = True
            break
    
    for keyword in ["preview", "Preview", "canvas", "Canvas"]:
        if check_element(page, f'[class*="{keyword}" i]', f"Preview area ({keyword})"):
            ui_checks["Preview area"] = True
            break
    
    for keyword in ["timeline", "Timeline", "time-line"]:
        if check_element(page, f'[class*="{keyword}" i]', f"Timeline area ({keyword})"):
            ui_checks["Timeline area"] = True
            break
    
    # Check bottom tabs
    bottom_tabs_found = 0
    for tab_name in ["Inspector", "Blocks", "Shaders", "Audio", "Export"]:
        if check_element(page, f'text="{tab_name}"', f"Bottom tab '{tab_name}'"):
            bottom_tabs_found += 1
    ui_checks["Bottom tab bar"] = bottom_tabs_found >= 2
    
    for name, passed in ui_checks.items():
        results["scenarios"].append({"name": f"UI: {name}", "pass": passed})
    
    # ========================================
    # SCENARIO 4: Console errors check
    # ========================================
    print("\n=== SCENARIO 4: Console errors ===")
    errors = [m for m in console_messages if m["type"] == "error"]
    if errors:
        print(f"  ⚠️ Found {len(errors)} console errors:")
        for e in errors[:10]:
            print(f"     - {e['text'][:120]}")
        results["console_errors"] = errors
    else:
        print("  ✅ No console errors")
    
    # ========================================
    # SCENARIO 5: Onboarding wizard (clear localStorage)
    # ========================================
    print("\n=== SCENARIO 5: Onboarding wizard ===")
    page.evaluate("localStorage.clear()")
    page.reload(wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(2000)
    
    # Click HyperFrames tab again
    try:
        hf_tab = page.locator('text="HyperFrames"').first
        hf_tab.click(timeout=5000)
        page.wait_for_timeout(2000)
    except:
        pass
    
    screenshot(page, "05-onboarding-wizard")
    
    # Check for onboarding-related elements
    onboarding_found = False
    for selector in [
        '[class*="onboarding" i]',
        '[class*="wizard" i]',
        '[class*="welcome" i]',
        '[class*="tutorial" i]',
        'text="Welcome"',
        'text="Get Started"',
        'text="Let\'s go"',
        'text="Next"',
    ]:
        try:
            el = page.locator(selector).first
            if el.is_visible(timeout=2000):
                print(f"  ✅ Onboarding element found: {selector}")
                onboarding_found = True
                break
        except:
            pass
    
    if not onboarding_found:
        print("  ⚠️ No onboarding wizard detected (may need specific localStorage key)")
        # Try setting the specific key
        page.evaluate("localStorage.removeItem('hyperframes_onboarding_completed')")
        page.reload(wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(2000)
        try:
            hf_tab = page.locator('text="HyperFrames"').first
            hf_tab.click(timeout=5000)
            page.wait_for_timeout(2000)
        except:
            pass
        screenshot(page, "05b-onboarding-wizard-retry")
        
        for selector in [
            '[class*="onboarding" i]',
            '[class*="wizard" i]',
            '[class*="welcome" i]',
            'text="Welcome"',
            'text="Get Started"',
        ]:
            try:
                el = page.locator(selector).first
                if el.is_visible(timeout=2000):
                    print(f"  ✅ Onboarding element found on retry: {selector}")
                    onboarding_found = True
                    break
            except:
                pass
    
    results["scenarios"].append({"name": "Onboarding wizard appears", "pass": onboarding_found})
    
    # ========================================
    # SCENARIO 6: Cross-tab "Use in HyperFrames" button (Seedance)
    # ========================================
    print("\n=== SCENARIO 6: Cross-tab integration (Seedance) ===")
    
    # Set onboarding as completed so we don't get wizard
    page.evaluate("localStorage.setItem('hyperframes_onboarding_completed', 'true')")
    
    # Go to Seedance tab
    try:
        seedance_tab = page.locator('text="Seedance"').first
        seedance_tab.click(timeout=5000)
        page.wait_for_timeout(2000)
        screenshot(page, "06-seedance-tab")
    except:
        print("  ❌ Could not switch to Seedance tab")
    
    # Look for "Use in HyperFrames" button
    use_in_hf_seedance = False
    for selector in [
        'text="Use in HyperFrames"',
        'text="Use in HyperFrames"',
        'button:has-text("HyperFrames")',
        '[class*="hyperframes" i] button',
    ]:
        try:
            el = page.locator(selector).first
            if el.is_visible(timeout=2000):
                print(f"  ✅ 'Use in HyperFrames' found in Seedance: {selector}")
                use_in_hf_seedance = True
                break
        except:
            pass
    
    if not use_in_hf_seedance:
        print("  ⚠️ 'Use in HyperFrames' button not found in Seedance tab (may only appear after video generation)")
    
    results["integration"].append({"name": "Seedance: 'Use in HyperFrames' button", "pass": use_in_hf_seedance})
    
    # ========================================
    # SCENARIO 7: Cross-tab "Использовать в HyperFrames" button (HeyGen)
    # ========================================
    print("\n=== SCENARIO 7: Cross-tab integration (HeyGen) ===")
    try:
        heygen_tab = page.locator('text="HeyGen"').first
        heygen_tab.click(timeout=5000)
        page.wait_for_timeout(2000)
        screenshot(page, "07-heygen-tab")
    except:
        print("  ❌ Could not switch to HeyGen tab")
    
    use_in_hf_heygen = False
    for selector in [
        'text="Использовать в HyperFrames"',
        'text="Use in HyperFrames"',
        'button:has-text("HyperFrames")',
        '[class*="hyperframes" i] button',
    ]:
        try:
            el = page.locator(selector).first
            if el.is_visible(timeout=2000):
                print(f"  ✅ 'Использовать в HyperFrames' found in HeyGen: {selector}")
                use_in_hf_heygen = True
                break
        except:
            pass
    
    if not use_in_hf_heygen:
        print("  ⚠️ 'Использовать в HyperFrames' button not found in HeyGen tab (may only appear after video generation)")
    
    results["integration"].append({"name": "HeyGen: 'Использовать в HyperFrames' button", "pass": use_in_hf_heygen})
    
    # ========================================
    # SCENARIO 8: Edge cases
    # ========================================
    print("\n=== SCENARIO 8: Edge cases ===")
    
    # 8a: Click HyperFrames with no composition → template gallery
    page.evaluate("localStorage.clear()")
    page.evaluate("localStorage.setItem('hyperframes_onboarding_completed', 'true')")
    page.reload(wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(2000)
    
    try:
        hf_tab = page.locator('text="HyperFrames"').first
        hf_tab.click(timeout=5000)
        page.wait_for_timeout(2000)
    except:
        pass
    
    screenshot(page, "08a-hyperframes-no-composition")
    
    template_gallery = False
    for selector in [
        '[class*="template" i]',
        '[class*="gallery" i]',
        'text="Template"',
        'text="Gallery"',
        'text="Choose a template"',
        'text="Start from template"',
        'text="Blank"',
        'text="Empty"',
    ]:
        try:
            el = page.locator(selector).first
            if el.is_visible(timeout=2000):
                print(f"  ✅ Template/gallery element found: {selector}")
                template_gallery = True
                break
        except:
            pass
    
    results["edge_cases"].append({"name": "No composition → template gallery", "pass": template_gallery})
    
    # 8b: Click bottom tabs
    bottom_tab_clicks = 0
    for tab_name in ["Inspector", "Blocks", "Shaders", "Audio", "Export"]:
        try:
            tab = page.locator(f'text="{tab_name}"').first
            if tab.is_visible(timeout=2000):
                tab.click(timeout=3000)
                page.wait_for_timeout(500)
                bottom_tab_clicks += 1
                print(f"  ✅ Clicked bottom tab: {tab_name}")
        except Exception as e:
            print(f"  ⚠️ Could not click bottom tab '{tab_name}': {e}")
    
    screenshot(page, "08b-bottom-tabs-tested")
    results["edge_cases"].append({
        "name": "Bottom tabs clickable",
        "pass": bottom_tab_clicks >= 2,
        "detail": f"{bottom_tab_clicks}/5 tabs clicked"
    })
    
    # ========================================
    # Final: Get all console errors
    # ========================================
    print("\n=== FINAL: Console error summary ===")
    all_errors = [m for m in console_messages if m["type"] == "error"]
    react_errors = [e for e in all_errors if "react" in e["text"].lower() or "module" in e["text"].lower()]
    
    if react_errors:
        print(f"  ❌ CRITICAL: {len(react_errors)} React/module errors found!")
        for e in react_errors[:5]:
            print(f"     - {e['text'][:150]}")
    elif all_errors:
        print(f"  ⚠️ {len(all_errors)} non-critical console errors")
    else:
        print("  ✅ No console errors at all")
    
    # Save results
    results["total_console_errors"] = len(all_errors)
    results["react_module_errors"] = len(react_errors)
    
    results_path = os.path.join(EVIDENCE_DIR, "qa-results.json")
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n📊 Results saved to {results_path}")
    
    # Print summary
    scenarios_pass = sum(1 for s in results["scenarios"] if s["pass"])
    scenarios_total = len(results["scenarios"])
    integration_pass = sum(1 for s in results["integration"] if s["pass"])
    integration_total = len(results["integration"])
    edge_pass = sum(1 for s in results["edge_cases"] if s["pass"])
    edge_total = len(results["edge_cases"])
    
    print(f"\n{'='*60}")
    print(f"FINAL QA VERDICT")
    print(f"{'='*60}")
    print(f"Scenarios     [{scenarios_pass}/{scenarios_total} pass]")
    print(f"Integration   [{integration_pass}/{integration_total}]")
    print(f"Edge Cases    [{edge_total} tested, {edge_pass} pass]")
    print(f"Console Errors: {len(all_errors)} total, {len(react_errors)} React/module")
    
    # Determine verdict
    critical_fail = len(react_errors) > 0 or scenarios_pass < scenarios_total * 0.5
    if critical_fail:
        print(f"\nVERDICT: ❌ FAIL — Critical issues found")
    elif scenarios_pass == scenarios_total and integration_pass == integration_total:
        print(f"\nVERDICT: ✅ PASS — All scenarios and integration checks pass")
    elif scenarios_pass >= scenarios_total * 0.8:
        print(f"\nVERDICT: ⚠️ PARTIAL — Most checks pass but some issues")
    else:
        print(f"\nVERDICT: ❌ FAIL — Too many failing checks")
    
    browser.close()

#!/usr/bin/env python3
"""
PlantMaintHQ Pre-Deployment Verification Test Suite
Verifies that compiled static pages, routes, structured data, redirects,
and metadata meet production standards before deployment.
"""
import os, sys, json, re

PUBLIC_DIR = "public"

def run_checks():
    print("🔍 Running PlantMaintHQ Pre-Deployment Verification Suite...\n")
    errors = []
    
    # 1. Check core directory structure
    required_paths = [
        "index.html",
        "sitemap.xml",
        "robots.txt",
        "style.css",
        "analytics.js",
        "favicon.svg",
        "og-image.png",
        "contact/index.html",
        "roi-calculator/index.html",
        "best-cmms-for-manufacturing/index.html",
        "best-cmms-for-facilities/index.html",
        "pricing/best-free-cmms-software/index.html",
        "pricing/affordable-cmms-under-50/index.html",
        "cmms/limble-cmms/index.html",
        "cmms/maintainx/index.html",
        "vs/limble-cmms-vs-maintainx/index.html",
        "go/limble-cmms/index.html",
        "cmms_data.json"
    ]
    
    for path in required_paths:
        full_path = os.path.join(PUBLIC_DIR, path)
        if not os.path.exists(full_path):
            errors.append(f"Missing file: {full_path}")
        else:
            size = os.path.getsize(full_path)
            if size == 0:
                errors.append(f"Empty file: {full_path}")
            else:
                print(f"  [OK] Found {path} ({size:,} bytes)")

    # 2. Check robots.txt has Disallow: /go/
    robots_path = os.path.join(PUBLIC_DIR, "robots.txt")
    if os.path.exists(robots_path):
        with open(robots_path) as f:
            robots_content = f.read()
        if "Disallow: /go/" not in robots_content:
            errors.append("robots.txt missing 'Disallow: /go/'")
        else:
            print("  [OK] robots.txt contains 'Disallow: /go/'")

    # 3. Check Sitemap has 5,600+ URLs
    sitemap_path = os.path.join(PUBLIC_DIR, "sitemap.xml")
    if os.path.exists(sitemap_path):
        with open(sitemap_path) as f:
            sitemap_content = f.read()
        url_count = sitemap_content.count("<loc>")
        if url_count < 5600:
            errors.append(f"Sitemap has only {url_count} URLs, expected > 5600")
        else:
            print(f"  [OK] Sitemap contains {url_count:,} indexable URLs")

    # 4. Check JSON-LD in Limble CMMS review page
    limble_path = os.path.join(PUBLIC_DIR, "cmms/limble-cmms/index.html")
    if os.path.exists(limble_path):
        with open(limble_path) as f:
            limble_html = f.read()
        m = re.search(r'<script type="application/ld\+json">(.*?)</script>', limble_html, re.DOTALL)
        if not m:
            errors.append("Limble review missing application/ld+json")
        else:
            try:
                schema = json.loads(m.group(1))
                graph = schema.get("@graph", [])
                types = [item.get("@type") for item in graph]
                if "SoftwareApplication" not in types or "BreadcrumbList" not in types:
                    errors.append(f"Limble review schema missing types: {types}")
                else:
                    print("  [OK] Limble CMMS schema verified (SoftwareApplication + BreadcrumbList)")
            except Exception as e:
                errors.append(f"Limble schema JSON invalid: {e}")

    # 5. Check /go/ redirect has meta refresh
    go_path = os.path.join(PUBLIC_DIR, "go/limble-cmms/index.html")
    if os.path.exists(go_path):
        with open(go_path) as f:
            go_html = f.read()
        if "http-equiv=\"refresh\"" not in go_html or "utm_source=plantmainthq" not in go_html:
            errors.append("/go/limble-cmms/index.html missing meta refresh or UTM parameters")
        else:
            print("  [OK] /go/limble-cmms/ redirect verified with UTM attribution")

    # 6. Check ROI Calculator page
    roi_path = os.path.join(PUBLIC_DIR, "roi-calculator/index.html")
    if os.path.exists(roi_path):
        with open(roi_path) as f:
            roi_html = f.read()
        if "CMMS Maintenance ROI Calculator" not in roi_html or "calculateROI" not in roi_html:
            errors.append("ROI calculator page missing expected title or calculation script")
        else:
            print("  [OK] Interactive ROI Calculator verified with calculation logic")

    # Final summary
    print("\n--------------------------------------------------------")
    if errors:
        print(f"🚨 Verification FAILED with {len(errors)} error(s):")
        for err in errors:
            print(f"  - {err}")
        return False
    else:
        print("✅ All Pre-Deployment Verifications Passed!")
        print("--------------------------------------------------------\n")
        return True

if __name__ == "__main__":
    success = run_checks()
    sys.exit(0 if success else 1)

#!/usr/bin/env python3
"""
PlantMaintHQ - Google Search Console Sitemap Submitter
Submits https://plantmainthq.com/sitemap.xml via the Webmasters v3 REST API.
"""
import subprocess, urllib.request, urllib.parse, json, sys

def submit_to_search_console():
    print(">>> [1/3] Checking Application Default Credentials token...")
    try:
        token = subprocess.check_output(
            ["gcloud", "auth", "application-default", "print-access-token"],
            text=True, stderr=subprocess.DEVNULL
        ).strip()
    except Exception as e:
        print("Notice: gcloud ADC token not found or not authenticated. Skipping GSC ping.")
        return

    headers = {
        "Authorization": f"Bearer {token}",
        "X-Goog-User-Project": "multi-site-ai-engine",
        "Content-Length": "0"
    }

    sitemap_url = "https://plantmainthq.com/sitemap.xml"
    encoded_sitemap = urllib.parse.quote(sitemap_url, safe="")
    properties = ["https://plantmainthq.com/", "sc-domain:plantmainthq.com"]

    print(">>> [2/3] Submitting sitemap across verified properties...")
    for prop in properties:
        encoded_prop = urllib.parse.quote(prop, safe="")
        api_url = f"https://www.googleapis.com/webmasters/v3/sites/{encoded_prop}/sitemaps/{encoded_sitemap}"
        req = urllib.request.Request(api_url, method="PUT", headers=headers)
        try:
            with urllib.request.urlopen(req) as resp:
                print(f"  [PUT] {prop} -> HTTP {resp.status} (Registered)")
        except urllib.error.HTTPError as he:
            print(f"  [PUT Error] {prop} -> HTTP {he.code}")
            continue

    print(">>> [3/3] Search Console Submission Complete!")

if __name__ == "__main__":
    submit_to_search_console()

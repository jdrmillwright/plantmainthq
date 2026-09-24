import os
import json
import urllib.request
import urllib.error

def update_cloudflare_dns():
    zone_id = "2fbca3b93cf96c7c889772871fb335d3"
    record_id = "d25a8f3facb41eadd1c4036390bcde8e"
    token = os.environ.get("CF_TOKEN")

    if not token:
        print("Error: CF_TOKEN environment variable is not set.")
        return

    url = f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/{record_id}"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Using PATCH to update only specific fields without needing the record's name or type
    payload = {
        "content": "jdrmillwright1995.github.io",
        "proxied": False
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method='PATCH')
    
    try:
        with urllib.request.urlopen(req) as response:
            response_data = json.loads(response.read().decode('utf-8'))
            if response_data.get("success"):
                print("Successfully updated Cloudflare DNS record.")
            else:
                print("API returned success=false. Errors:", response_data.get("errors"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"HTTP Error {e.code}: {e.reason}")
        print(f"Details: {error_body}")
    except urllib.error.URLError as e:
        print(f"URL Error: {e.reason}")

if __name__ == "__main__":
    update_cloudflare_dns()

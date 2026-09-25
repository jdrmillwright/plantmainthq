#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
from datetime import datetime

PORT = int(os.environ.get('PORT', 8080))
DIRECTORY = "public"

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Set intelligent HTTP caching headers
        path = self.path.lower()
        if any(path.endswith(ext) for ext in ['.css', '.js', '.png', '.svg', '.ico', '.woff2', '.jpg', '.webp']):
            self.send_header('Cache-Control', 'public, max-age=86400, immutable')
        elif path.endswith('.xml') or path.endswith('.json'):
            self.send_header('Cache-Control', 'public, max-age=3600')
        else:
            self.send_header('Cache-Control', 'public, max-age=600, must-revalidate')
        super().end_headers()

    def do_POST(self):
        if self.path == '/api/contact':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                payload = json.loads(post_data.decode('utf-8'))
                payload['timestamp'] = datetime.utcnow().isoformat()
                
                # Append to local ledger
                ledger_path = 'leads.json'
                if os.path.exists(ledger_path):
                    with open(ledger_path, 'r') as f:
                        leads = json.load(f)
                else:
                    leads = []
                
                leads.append(payload)
                
                with open(ledger_path, 'w') as f:
                    json.dump(leads, f, indent=2)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        print(f"Serving HTTP on port {PORT}...")
        httpd.serve_forever()

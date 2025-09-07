#!/usr/bin/env python3
from flask import Flask, request, Response
import subprocess
import threading
import time
import signal
import os
import requests
from urllib.parse import urljoin

app = Flask(__name__)

# Proxy all requests to the Node.js server
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def proxy_to_node(path):
    # Forward the request to the Node.js server
    try:
        url = f"http://localhost:3000/{path}"
        
        # Forward query parameters
        if request.query_string:
            url += f"?{request.query_string.decode()}"
            
        # Forward the request with the same method and headers
        resp = requests.request(
            method=request.method,
            url=url,
            headers={key: value for (key, value) in request.headers if key != 'Host'},
            data=request.get_data(),
            cookies=request.cookies,
            allow_redirects=False,
            timeout=30
        )
        
        # Create response to return
        excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
        headers = [(name, value) for (name, value) in resp.raw.headers.items()
                  if name.lower() not in excluded_headers]
        
        response = Response(resp.content, resp.status_code, headers)
        return response
        
    except Exception as e:
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Loading...</title>
            <meta http-equiv="refresh" content="2">
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 100px;">
            <h2>Starting TradeFlow...</h2>
            <p>Please wait a moment while the application starts.</p>
            <div style="margin: 20px;">
                <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </body>
        </html>
        """, 200

def run_tsx_server():
    os.chdir('/home/runner/workspace')
    env = os.environ.copy()
    env['NODE_ENV'] = 'development'
    env['PORT'] = '3000'
    
    subprocess.run(['npx', 'tsx', 'server/index.ts'], env=env)

# Start tsx server in background
tsx_thread = threading.Thread(target=run_tsx_server, daemon=True)
tsx_thread.start()

if __name__ == '__main__':
    # Give tsx time to start
    time.sleep(2)
    app.run(host='0.0.0.0', port=5000, debug=False)
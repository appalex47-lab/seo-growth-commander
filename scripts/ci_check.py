#!/usr/bin/env python3
"""Local CI gate for Growth SEO Command Center."""
from __future__ import annotations
import json, subprocess, sys, threading, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from functools import partial

ROOT = Path(__file__).resolve().parents[1]

def run(cmd):
    print('+', ' '.join(cmd))
    subprocess.run(cmd, cwd=ROOT, check=True)

def main():
    run([sys.executable, '-m', 'pytest', '-q', 'tests'])
    run([sys.executable, '-m', 'py_compile', 'pipeline/business_rules.py', 'pipeline/integrations.py', 'pipeline/pipeline.py'])
    js_files = sorted((ROOT/'frontend/js').glob('*.js'))
    for path in js_files:
        run(['node', '--check', str(path)])
    for path in [ROOT/'data/data_mock.json', ROOT/'data/test_scenarios.json', ROOT/'data/integration_contract.json']:
        json.loads(path.read_text(encoding='utf-8'))
        print('+ json', path.relative_to(ROOT))

    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self, *_): pass
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(Quiet, directory=str(ROOT)))
    server_thread = threading.Thread(target=lambda: server.serve_forever(), daemon=True)
    server_thread.start()
    try:
        import urllib.request
        time.sleep(0.15)
        for path in ['/index.html', '/frontend/js/app.js', '/data/data_mock.json']:
            with urllib.request.urlopen(f'http://127.0.0.1:{server.server_port}' + path, timeout=3) as response:
                assert response.status == 200, (path, response.status)
        print('+ http smoke PASS')
    finally:
        server.shutdown()
    print('CI_CHECK_OK')

if __name__ == '__main__':
    main()

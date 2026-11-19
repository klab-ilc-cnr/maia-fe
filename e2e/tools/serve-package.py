#!/usr/bin/env python3
"""Server di prova con la topologia della VM di test:
   /maia/...        -> file statici del pacchetto (cartella passata come argomento)
   /maia/maia/...   -> inoltrato a https://klabsrv:19443/maia/maia/... (backend reale)
Uso: python3 e2e/tools/serve-package.py <cartella_pacchetto> <porta>   (es. dist/projectx-fe 8099)
   poi: E2E_BASE_URL=http://127.0.0.1:8099/maia/ npx playwright test"""
import http.server, os, ssl, sys, urllib.request, urllib.error

ROOT, PORT = sys.argv[1], int(sys.argv[2])
BACKEND = 'https://klabsrv:19443'
CTX = ssl.create_default_context(); CTX.check_hostname = False; CTX.verify_mode = ssl.CERT_NONE

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a): pass
    def _proxy(self):
        body = self.rfile.read(int(self.headers.get('Content-Length') or 0)) or None
        req = urllib.request.Request(BACKEND + self.path, data=body, method=self.command,
              headers={k: v for k, v in self.headers.items() if k.lower() not in ('host', 'connection', 'accept-encoding')})
        try:
            r = urllib.request.urlopen(req, context=CTX, timeout=60); status, hdrs, data = r.status, r.headers, r.read()
        except urllib.error.HTTPError as e:
            status, hdrs, data = e.code, e.headers, e.read()
        self.send_response(status)
        for k, v in hdrs.items():
            if k.lower() not in ('transfer-encoding', 'connection', 'content-length', 'content-encoding'): self.send_header(k, v)
        self.send_header('Content-Length', str(len(data))); self.end_headers(); self.wfile.write(data)
    def _route(self):
        if self.path.startswith('/maia/maia/'): return self._proxy()
        if self.command != 'GET': self.send_error(405); return
        if self.path.startswith('/maia/'): self.path = self.path[len('/maia'):]
        elif self.path == '/maia': self.path = '/'
        return super().do_GET()
    do_GET = do_POST = do_PUT = do_DELETE = do_OPTIONS = do_PATCH = _route

http.server.ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()

"""Servidor local con actualización oficial compartida, cada 60 segundos."""
import json
import time
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from update_data import ROOT, update

lock = threading.Lock()
last_refresh = 0

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        global last_refresh
        if self.path.split('?')[0] == '/api/premier':
            with lock:
                try:
                    if time.monotonic() - last_refresh >= 60:
                        update()
                        last_refresh = time.monotonic()
                    data = (ROOT / 'premier.json').read_bytes()
                    self.send_response(200)
                except Exception:
                    data = json.dumps({'error': 'No se pudo consultar la fuente oficial'}).encode()
                    self.send_response(503)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(data)
            return
        # Servir únicamente recursos públicos de la aplicación.
        if self.path.split('?')[0] not in ['/', '/index.html', '/app.js', '/styles.css', '/premier.json', '/manifest.webmanifest', '/icon.svg', '/sw.js']:
            self.send_error(404)
            return
        super().do_GET()

if __name__ == '__main__':
    print('APP PREMIER: http://127.0.0.1:8012', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8012), Handler).serve_forever()

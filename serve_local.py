#!/usr/bin/env python3
"""Serve this extracted package on loopback only. Python 3 standard library; no uploads."""
from __future__ import annotations
import argparse, functools, http.server, threading, webbrowser
from pathlib import Path
from urllib.parse import urlsplit
ROOT = Path(__file__).resolve().parent
class LocalHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm'}
    def _valid_host(self) -> bool:
        try:
            return urlsplit('http://' + self.headers.get('Host', '')).hostname in {'localhost', '127.0.0.1'}
        except ValueError:
            return False
    def do_GET(self) -> None:
        if not self._valid_host():
            self.send_error(403, 'Loopback Host required'); return
        super().do_GET()
    def do_HEAD(self) -> None:
        if not self._valid_host():
            self.send_error(403, 'Loopback Host required'); return
        super().do_HEAD()
    def translate_path(self, path: str) -> str:
        candidate = Path(super().translate_path(path)).resolve()
        try:
            candidate.relative_to(ROOT)
        except ValueError:
            return str(ROOT / '__outside_package_denied__')
        return str(candidate)
    def end_headers(self) -> None:
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
def main() -> int:
    parser = argparse.ArgumentParser(description='Poker EDO: servidor local, sin instalaciones adicionales.')
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--benchmark', action='store_true')
    parser.add_argument('--no-browser', action='store_true')
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535:
        parser.error('El puerto debe estar entre 1024 y 65535.')
    handler = functools.partial(LocalHandler, directory=str(ROOT))
    try:
        server = http.server.ThreadingHTTPServer(('127.0.0.1', args.port), handler)
    except OSError as exc:
        print(f'No se pudo abrir el puerto {args.port}: {exc}')
        print('Cierra otro servidor de prueba o usa --port 8001. Otro puerto tiene una cache distinta.')
        return 1
    url = f'http://localhost:{args.port}/' + ('validation/benchmark.html' if args.benchmark else '')
    print(f'Poker EDO v7.2.1 RC\nCarpeta: {ROOT}\nAbre: {url}\nCtrl+C detiene el servidor.')
    print('No se expone el servidor a otros equipos y no se abre un intento hasta iniciar la partida.')
    if not args.no_browser:
        timer = threading.Timer(0.7, lambda: webbrowser.open(url)); timer.daemon = True; timer.start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServidor detenido.')
    finally:
        server.server_close()
    return 0
if __name__ == '__main__':
    raise SystemExit(main())

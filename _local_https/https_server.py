from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import ssl

BASE = Path(__file__).resolve().parent
WEB = BASE.parent

handler = partial(SimpleHTTPRequestHandler, directory=str(WEB))
server = ThreadingHTTPServer(("0.0.0.0", 8443), handler)

ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain(
    certfile=str(BASE / "server.crt"),
    keyfile=str(BASE / "server.key")
)

server.socket = ctx.wrap_socket(server.socket, server_side=True)

print("HTTPS 서버 실행 중 — port 8443")
server.serve_forever()

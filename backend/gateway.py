#!/usr/bin/env python3
"""Secure integration gateway foundation for Growth SEO Command Center.

Phase 14 deliberately implements the OAuth/security boundary, not provider data
sync. Secrets stay server-side. Token persistence is intentionally NOT included;
production must use a managed secret/token store.
"""
from __future__ import annotations

import base64
import hashlib
import html
import json
import os
import secrets
import time
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

HOST = os.getenv("GSSC_GATEWAY_HOST", "127.0.0.1")
PORT = int(os.getenv("GSSC_GATEWAY_PORT", "8787"))
PUBLIC_BASE_URL = os.getenv("GSSC_PUBLIC_BASE_URL", f"http://{HOST}:{PORT}").rstrip("/")
ALLOWED_ORIGINS = {x.strip() for x in os.getenv("GSSC_ALLOWED_ORIGINS", "http://127.0.0.1:8787,http://localhost:8787").split(",") if x.strip()}

GOOGLE_CLIENT_ID = os.getenv("GSSC_GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GSSC_GOOGLE_CLIENT_SECRET", "")
GOOGLE_SCOPES = {
    "gsc": "https://www.googleapis.com/auth/webmasters.readonly",
    "ga4": "https://www.googleapis.com/auth/analytics.readonly",
    "merchant": "https://www.googleapis.com/auth/content",
    "ads": "https://www.googleapis.com/auth/adwords",
}
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

# Development-only in-memory state. Restarting the gateway invalidates it.
_oauth_states: dict[str, dict[str, Any]] = {}
_tokens: dict[str, dict[str, Any]] = {}


def _json(handler: BaseHTTPRequestHandler, status: int, payload: dict[str, Any]) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("X-Content-Type-Options", "nosniff")
    handler.send_header("Referrer-Policy", "no-referrer")
    handler.send_header("Content-Length", str(len(body)))
    origin = handler.headers.get("Origin")
    if origin in ALLOWED_ORIGINS:
        handler.send_header("Access-Control-Allow-Origin", origin)
        handler.send_header("Vary", "Origin")
    handler.end_headers()
    handler.wfile.write(body)


def _html(handler: BaseHTTPRequestHandler, status: int, body: str) -> None:
    raw = body.encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "text/html; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("X-Content-Type-Options", "nosniff")
    handler.send_header("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'")
    handler.send_header("Content-Length", str(len(raw)))
    handler.end_headers()
    handler.wfile.write(raw)


def _pkce_verifier() -> str:
    return base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b"=").decode()


def _pkce_challenge(verifier: str) -> str:
    return base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()


def _google_ready() -> bool:
    return bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)


def _cleanup_states() -> None:
    now = time.time()
    for key, value in list(_oauth_states.items()):
        if now - value["created_at"] > 600:
            _oauth_states.pop(key, None)


def _oauth_start(source: str) -> tuple[int, dict[str, Any]]:
    if source not in GOOGLE_SCOPES:
        return 400, {"error": "unsupported_source", "message": "Fuente OAuth no soportada."}
    if not _google_ready():
        return 503, {"error": "google_not_configured", "message": "Faltan GSSC_GOOGLE_CLIENT_ID y/o GSSC_GOOGLE_CLIENT_SECRET en el gateway."}
    _cleanup_states()
    state = secrets.token_urlsafe(32)
    verifier = _pkce_verifier()
    _oauth_states[state] = {"source": source, "verifier": verifier, "created_at": time.time()}
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": f"{PUBLIC_BASE_URL}/api/oauth/google/callback",
        "response_type": "code",
        "scope": GOOGLE_SCOPES[source],
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
        "code_challenge": _pkce_challenge(verifier),
        "code_challenge_method": "S256",
    }
    return 200, {"authorization_url": GOOGLE_AUTH_URL + "?" + urllib.parse.urlencode(params), "source": source}


def _exchange_code(code: str, state_data: dict[str, Any]) -> dict[str, Any]:
    payload = urllib.parse.urlencode({
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": f"{PUBLIC_BASE_URL}/api/oauth/google/callback",
        "grant_type": "authorization_code",
        "code_verifier": state_data["verifier"],
    }).encode()
    request = urllib.request.Request(GOOGLE_TOKEN_URL, data=payload, headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST")
    with urllib.request.urlopen(request, timeout=15) as response:
        return json.loads(response.read().decode("utf-8"))


class Handler(BaseHTTPRequestHandler):
    server_version = "GSSC-Gateway/0.1"

    def log_message(self, fmt: str, *args: Any) -> None:
        # Avoid logging authorization codes/tokens accidentally.
        print("[gateway] " + (fmt % args))

    def do_OPTIONS(self) -> None:
        origin = self.headers.get("Origin")
        if origin not in ALLOWED_ORIGINS:
            _json(self, 403, {"error": "origin_not_allowed"})
            return
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Vary", "Origin")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == "/api/health":
            _json(self, 200, {"ok": True, "service": "gssc-gateway", "phase": 14, "google_configured": _google_ready(), "token_persistence": "memory_only_dev"})
            return

        if path == "/api/integrations/status":
            _json(self, 200, {"google": {"configured": _google_ready(), "sources": sorted(GOOGLE_SCOPES)}, "cohere": {"server_configured": bool(os.getenv("GSSC_COHERE_API_KEY"))}, "production_ready": False})
            return

        if path.startswith("/api/oauth/google/start/"):
            source = path.rsplit("/", 1)[-1]
            status, payload = _oauth_start(source)
            _json(self, status, payload)
            return

        if path == "/api/oauth/google/callback":
            state = query.get("state", [""])[0]
            code = query.get("code", [""])[0]
            error = query.get("error", [""])[0]
            state_data = _oauth_states.pop(state, None)
            if error:
                _html(self, 400, f"<h1>Autorización cancelada</h1><p>{html.escape(error)}</p><p>Puedes cerrar esta ventana.</p>")
                return
            if not state or not state_data or not code:
                _html(self, 400, "<h1>Solicitud OAuth inválida</h1><p>El estado OAuth no es válido o expiró.</p>")
                return
            try:
                token = _exchange_code(code, state_data)
                connection_id = secrets.token_urlsafe(18)
                _tokens[connection_id] = {"source": state_data["source"], "token": token, "created_at": time.time()}
                # The browser receives only an opaque connection id; no token is rendered.
                _html(self, 200, f"<h1>Google conectado</h1><p>Fuente: {html.escape(state_data['source'])}</p><p>Conexión creada correctamente.</p><p>Identificador: <code>{html.escape(connection_id)}</code></p><p>Puedes cerrar esta ventana y volver a GSSC.</p>")
            except Exception:
                _html(self, 502, "<h1>No se pudo completar OAuth</h1><p>El gateway no pudo intercambiar el código. Revisa la configuración de Google y los logs del servidor.</p>")
            return

        _json(self, 404, {"error": "not_found"})


def serve() -> None:
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"GSSC gateway listening on http://{HOST}:{PORT}")
    print(f"Allowed origins: {sorted(ALLOWED_ORIGINS)}")
    print(f"Google OAuth configured: {_google_ready()}")
    server.serve_forever()


if __name__ == "__main__":
    serve()

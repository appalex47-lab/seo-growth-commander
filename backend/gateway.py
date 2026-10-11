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
GSC_ANALYTICS_URL = "https://searchconsole.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query"
GA4_RUN_REPORT_URL = "https://analyticsdata.googleapis.com/v1beta/properties/{property_id}:runReport"

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


def _oauth_start(source: str, origin: str | None = None) -> tuple[int, dict[str, Any]]:
    if source not in GOOGLE_SCOPES:
        return 400, {"error": "unsupported_source", "message": "Fuente OAuth no soportada."}
    if not _google_ready():
        return 503, {"error": "google_not_configured", "message": "Faltan GSSC_GOOGLE_CLIENT_ID y/o GSSC_GOOGLE_CLIENT_SECRET en el gateway."}
    _cleanup_states()
    state = secrets.token_urlsafe(32)
    verifier = _pkce_verifier()
    _oauth_states[state] = {"source": source, "verifier": verifier, "created_at": time.time(), "origin": origin if origin in ALLOWED_ORIGINS else None}
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


def _google_api_json(url: str, access_token: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(url, data=data, headers=headers, method="GET" if data is None else "POST")
    with urllib.request.urlopen(request, timeout=25) as response:
        return json.loads(response.read().decode("utf-8"))


def _refresh_token(token_data: dict[str, Any]) -> str:
    token = token_data.get("token", {})
    if token.get("access_token") and float(token.get("expires_at", 0)) > time.time() + 60:
        return str(token["access_token"])
    refresh = token.get("refresh_token")
    if not refresh:
        raise ValueError("reauthorization_required")
    payload = urllib.parse.urlencode({"client_id": GOOGLE_CLIENT_ID, "client_secret": GOOGLE_CLIENT_SECRET,
        "refresh_token": refresh, "grant_type": "refresh_token"}).encode()
    request = urllib.request.Request(GOOGLE_TOKEN_URL, data=payload, headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST")
    with urllib.request.urlopen(request, timeout=15) as response:
        renewed = json.loads(response.read().decode("utf-8"))
    renewed["refresh_token"] = refresh
    renewed["expires_at"] = time.time() + int(renewed.get("expires_in", 3600))
    token_data["token"] = renewed
    return str(renewed["access_token"])


def _connection_for(connection_id: str, source: str) -> tuple[dict[str, Any] | None, str | None]:
    connection = _tokens.get(connection_id)
    if not connection:
        return None, "connection_not_found"
    if connection.get("source") != source:
        return None, "connection_source_mismatch"
    return connection, None


def _validate_dates(start_date: Any, end_date: Any) -> bool:
    try:
        start = time.strptime(str(start_date), "%Y-%m-%d")
        end = time.strptime(str(end_date), "%Y-%m-%d")
        return start <= end
    except (TypeError, ValueError):
        return False


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

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path not in ("/api/sync/gsc/query", "/api/sync/ga4/report"):
            _json(self, 404, {"error": "not_found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 65536:
                _json(self, 400, {"error": "invalid_body_size"}); return
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            source = "gsc" if parsed.path.endswith("gsc/query") else "ga4"
            connection, error = _connection_for(str(body.get("connection_id", "")), source)
            if error:
                _json(self, 401, {"error": error, "message": "Conecta nuevamente la fuente desde Integraciones."}); return
            start_date, end_date = body.get("start_date"), body.get("end_date")
            if not _validate_dates(start_date, end_date):
                _json(self, 400, {"error": "invalid_date_range", "message": "Usa fechas YYYY-MM-DD y un inicio no posterior al fin."}); return
            access_token = _refresh_token(connection)
            if source == "gsc":
                site = str(body.get("site_url", "")).strip()
                if not site or len(site) > 2048:
                    _json(self, 400, {"error": "site_url_required"}); return
                dimensions = body.get("dimensions", ["query", "page"])
                if not isinstance(dimensions, list) or not dimensions or any(d not in {"query", "page", "country", "device", "searchAppearance", "date"} for d in dimensions):
                    _json(self, 400, {"error": "invalid_dimensions"}); return
                request_payload = {"startDate": start_date, "endDate": end_date, "dimensions": dimensions,
                    "rowLimit": max(1, min(int(body.get("row_limit", 250)), 25000))}
                result = _google_api_json(GSC_ANALYTICS_URL.format(site=urllib.parse.quote(site, safe="")), access_token, request_payload)
            else:
                property_id = str(body.get("property_id", "")).strip()
                if not property_id.isdigit():
                    _json(self, 400, {"error": "invalid_property_id", "message": "property_id debe ser numérico."}); return
                dimensions = body.get("dimensions", [{"name": "landingPagePlusQueryString"}])
                metrics = body.get("metrics", [{"name": "sessions"}, {"name": "keyEvents"}, {"name": "totalRevenue"}])
                allowed_dimensions = {"date", "landingPagePlusQueryString", "sessionDefaultChannelGroup", "deviceCategory", "country"}
                allowed_metrics = {"sessions", "keyEvents", "totalRevenue", "engagedSessions", "screenPageViews"}
                if not isinstance(dimensions, list) or not dimensions or any(not isinstance(x, dict) or x.get("name") not in allowed_dimensions for x in dimensions):
                    _json(self, 400, {"error": "invalid_dimensions"}); return
                if not isinstance(metrics, list) or not metrics or any(not isinstance(x, dict) or x.get("name") not in allowed_metrics for x in metrics):
                    _json(self, 400, {"error": "invalid_metrics"}); return
                request_payload = {"dateRanges": [{"startDate": start_date, "endDate": end_date}], "dimensions": dimensions, "metrics": metrics,
                    "limit": str(max(1, min(int(body.get("limit", 1000)), 100000)))}
                result = _google_api_json(GA4_RUN_REPORT_URL.format(property_id=property_id), access_token, request_payload)
            _json(self, 200, {"ok": True, "source": source, "date_range": {"start_date": start_date, "end_date": end_date}, "data": result})
        except urllib.error.HTTPError as exc:
            # Do not echo upstream response bodies: they may contain sensitive diagnostics.
            status = 401 if exc.code in (401, 403) else 502
            _json(self, status, {"error": "provider_request_failed", "provider_status": exc.code, "message": "Google rechazó la consulta. Revisa permisos, propiedad y fechas."})
        except (ValueError, TypeError, json.JSONDecodeError):
            _json(self, 400, {"error": "invalid_request", "message": "El cuerpo de la solicitud no es válido."})
        except Exception:
            _json(self, 502, {"error": "gateway_error", "message": "No se pudo completar la consulta de Google."})

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == "/api/health":
            _json(self, 200, {"ok": True, "service": "gssc-gateway", "phase": 17, "google_configured": _google_ready(), "token_persistence": "memory_only_dev"})
            return

        if path == "/api/integrations/status":
            connected = [{"source": value["source"], "connection_id": key} for key, value in _tokens.items()]
            _json(self, 200, {"google": {"configured": _google_ready(), "sources": sorted(GOOGLE_SCOPES), "connections": connected}, "sync": {"gsc_query": True, "ga4_report": True}, "cohere": {"server_configured": bool(os.getenv("GSSC_COHERE_API_KEY"))}, "production_ready": False, "token_persistence": "memory_only_dev"})
            return

        if path.startswith("/api/oauth/google/start/"):
            source = path.rsplit("/", 1)[-1]
            request_origin = self.headers.get("Origin")
            if request_origin and request_origin not in ALLOWED_ORIGINS:
                _json(self, 403, {"error": "origin_not_allowed"}); return
            status, payload = _oauth_start(source, request_origin)
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
                token["expires_at"] = time.time() + int(token.get("expires_in", 3600))
                _tokens[connection_id] = {"source": state_data["source"], "token": token, "created_at": time.time()}
                # Only the opaque connection handle is shared with the opener, never OAuth tokens.
                origin = urllib.parse.urlparse(PUBLIC_BASE_URL)
                opener_origin = state_data.get("origin") or f"{origin.scheme}://{origin.netloc}"
                _html(self, 200, "<!doctype html><meta charset='utf-8'><title>Google conectado</title><h1>Google conectado</h1><p>La autorización terminó. Puedes cerrar esta ventana.</p><script>if(window.opener){window.opener.postMessage({type:'gssc:google-connected',source:""" + json.dumps(state_data["source"]) + ",connectionId:""" + json.dumps(connection_id) + "}," + json.dumps(opener_origin) + ");}setTimeout(()=>window.close(),800);</script>")
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

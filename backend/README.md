# GSSC Secure Integration Gateway — Phase 14

This gateway establishes the security boundary between the browser and external providers.

## What it does in Phase 14
- health/status endpoints;
- Google OAuth start for GSC, GA4, Merchant and Ads;
- OAuth state + PKCE;
- server-side client secret;
- authorization-code exchange on the server;
- no access/refresh token is returned to browser JavaScript;
- explicit CORS allowlist.

## What it deliberately does not do yet
- provider data synchronization;
- production token persistence;
- scheduled jobs;
- account/property selection;
- Google API reporting calls;
- real Cohere requests.

The temporary token store is memory-only and is therefore **development-only**. Production must use an encrypted/managed secret store or token vault with rotation, revocation and deletion controls.

Run locally:

```bash
GSSC_GOOGLE_CLIENT_ID='...' \
GSSC_GOOGLE_CLIENT_SECRET='...' \
python backend/gateway.py
```

The next phase can then add provider-specific API calls without exposing credentials to the browser.

## Phase 17 — Read-only reporting queries

The gateway now exposes `POST /api/sync/gsc/query` and `POST /api/sync/ga4/report`. Requests require the opaque `connection_id` returned by the OAuth callback message, valid ISO date ranges, and provider-specific site/property identifiers. Tokens are refreshed server-side. See `docs/phases/fase-17.md` for request examples and limitations.

**Development only:** connections are still memory-only. Do not expose this gateway publicly or use it for production until an encrypted token vault, authenticated user/tenant authorization, CSRF protection, rate limiting, audit logging, and revoke/delete flows are implemented.


## Phase 22 — Search Console UI
The Integrations page now invokes the existing read-only Search Console query endpoint. Configure OAuth credentials and the exact callback URL as documented in `../docs/phases/fase-22-search-console.md`. Tokens remain in-memory development state; do not treat this as production-ready.

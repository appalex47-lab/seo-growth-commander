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

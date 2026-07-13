# AgroLingo API Deployment (Railway)

## Purpose

The Go API is the security boundary between the public React/Vite client and AI providers. Provider credentials must never be exposed through `VITE_*` variables.

## Current endpoints

- `GET /health` — public health check
- `POST /api/v1/chat` — authenticated text and image-assisted agricultural information

The chat endpoint validates the caller against Supabase Auth, applies a per-user in-memory MVP rate limit, validates text/image payloads, and calls Gemini with a server-side credential.

## Railway deployment

1. Create a new Railway project.
2. Choose **Deploy from GitHub repo**.
3. Select `Rhibrahim15/agrolingo-ai`.
4. Railway will read the root `railway.toml` and build `server/cmd/api`.
5. Configure the required variables:

```text
GEMINI_API_KEY=<server-side secret>
GEMINI_MODEL=gemini-2.5-flash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<Supabase public anon key>
ALLOWED_ORIGINS=https://agrolingo.vercel.app
APP_ENV=production
```

Railway supplies `PORT`; do not hard-code a production port.

6. Generate a Railway public domain.
7. Confirm:

```bash
curl https://<railway-domain>/health
```

Expected response:

```json
{"service":"agrolingo-api","status":"healthy"}
```

8. In the Vercel platform project, set:

```text
VITE_API_BASE_URL=https://<railway-domain>
```

9. Create a preview deployment from `fix/security-and-stability` and test before merging.

## Security controls

- Supabase access tokens are verified against `/auth/v1/user`.
- User identity comes from the verified token, not request JSON.
- The API accepts JPEG, PNG, and WebP inline images up to 4 MB.
- Remote image URLs are not fetched, preventing server-side request forgery.
- Request bodies are limited to 6 MB.
- Chat requests are limited to 15 per authenticated user per 10-minute window per API instance.
- Raw prompts, chat history, images, tokens, and email addresses are not written to application logs.
- Provider errors are replaced with generic user-facing errors and a request ID.
- CORS uses explicit origins.

## Known MVP limitations

- Rate limiting is in memory and is not shared across multiple Railway instances. Replace it with a persistent/distributed limiter before horizontal scaling.
- The API does not yet provide RAG or citations.
- Image responses are assistive observations, not validated diagnoses.
- The current Supabase token check adds one Auth request per API call. Consider verified JWKS-based local validation after confirming the project signing configuration.
- No administrator API is exposed.
- No service-role key is currently required.

## Rollback

Do not remove the last known-good Railway deployment. If the new API fails, roll back the Railway deployment and keep the Vercel production project on its current frontend build until a corrected preview passes validation. Never restore direct browser-side provider keys as a rollback.

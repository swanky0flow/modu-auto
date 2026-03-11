# Environment Variables

Set as Wrangler secrets:
- GEMINI_API_KEY: Google Generative Language API key for fallback long-form.
- CF_API_TOKEN: Token with access to D1, R2, KV, Queues, Workers, Pages.
- UNSPLASH_KEY (optional): for fallback image sourcing.
- PEXELS_KEY (optional): fallback image.

Pages env vars:
- VITE_API_BASE: URL of API worker (e.g., https://api.yourdomain.com)

Workers plain text vars (wrangler vars):
- CLOUDFLARE_ACCOUNT_ID (for API calls if extended)
- SITE_DOMAIN (optional default)

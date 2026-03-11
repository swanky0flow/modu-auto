# Deployment Guide

Prereqs: Node 20, Wrangler v3, Cloudflare account with domain on CF DNS.

1. Install deps
   ```bash
   npm install
   ```
2. Create D1 DB
   ```bash
   npx wrangler d1 create modu-auto-db
   npx wrangler d1 execute modu-auto-db --file=db/schema.sql
   ```
3. Create R2 bucket & KV & Queue
   ```bash
   npx wrangler r2 bucket create modu-auto-media
   npx wrangler kv:namespace create modu-auto-cache
   npx wrangler queues create modu-auto-jobs
   npx wrangler analytics create modu_auto_events
   ```
   Replace IDs into `wrangler.jsonc`.
4. Secrets
   ```bash
   npx wrangler secret put GEMINI_API_KEY
   npx wrangler secret put CF_API_TOKEN
   ```
5. Deploy API Worker + cron + email + queue consumer
   ```bash
   npx wrangler deploy
   ```
6. Build + deploy Pages
   ```bash
   cd apps/web
   npm run build
   npx wrangler pages deploy dist --project-name=modu-auto
   ```
7. Configure routes
   - Map `api.yourdomain.com/*` to Worker `modu-auto-api`.
   - Set Pages custom domain to `yourdomain.com`.
8. Set Cron trigger (already in wrangler.jsonc at `0 */3 * * *`).
9. Verify
   - Open installer at domain root, walk through steps, trigger deploy.
   - Check D1 data: `npx wrangler d1 execute modu-auto-db --command "SELECT COUNT(*) FROM calendar"`

Upgrade path: switch R2 paid at >10GB, enable queues throughput by upgrading Workers Paid, move AI generation to paid tier when >100k tokens/day.

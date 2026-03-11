import { Router } from 'itty-router';

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  MEDIA: R2Bucket;
  QUEUE: Queue;
  ANALYTICS: AnalyticsEngineDataset;
  CF_API_TOKEN: string;
  GEMINI_API_KEY?: string;
  UNSPLASH_KEY?: string;
  PEXELS_KEY?: string;
}

const router = Router();

router.post('/install', async (request, env: Env) => {
  const { domain, niche, audience, cadence, monetisation, keys } = await request.json<any>();
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const log = async (line: string) => {
    await writer.write(encoder.encode(line + '\n'));
  };

  try {
    await log('Validating input...');
    if (!domain) throw new Error('domain required');
    await env.DB.prepare('INSERT OR IGNORE INTO sites (domain, niche) VALUES (?1, ?2)').bind(domain, niche?.name || 'general').run();
    const siteRow = await env.DB.prepare('SELECT id FROM sites WHERE domain = ?1').bind(domain).first();
    const siteId = siteRow?.id as number;

    await log('Seeding 90-day calendar...');
    const now = Date.now();
    for (let i = 0; i < 90; i++) {
      const day = new Date(now + i * 86400000).toISOString();
      await env.DB.prepare(
        'INSERT INTO calendar (site_id, target_keyword, secondary_keywords, search_intent, word_count, affiliate_slots, internal_links, publish_date, status, meta_description) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)'
      )
        .bind(
          siteId,
          `${niche?.name || 'topic'} idea ${i + 1}`,
          'secondary a, secondary b',
          'informational',
          1400,
          monetisation.join(', '),
          'auto',
          day,
          'scheduled',
          'Auto-generated meta description'
        )
        .run();
    }

    await log('Creating R2 bucket binding check...');
    // R2 bucket assumed pre-created via wrangler; here we just test list
    await env.MEDIA.list({ prefix: `${domain}/` });

    await log('KV warmup...');
    await env.CACHE.put(`site:${domain}:cadence`, JSON.stringify(cadence));

    await log('Queueing initial generation job...');
    await env.QUEUE.send({ type: 'generate-batch', siteId, count: 3 });

    await log('Recording analytics beacon...');
    await env.ANALYTICS.writeDataPoint({ blobs: [domain, 'install'], doubles: [Date.now()] });

    await log('Success! Autoblog deployed.');
  } catch (err: any) {
    await log(`Error: ${err.message}`);
  } finally {
    await writer.close();
  }

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
});

router.post('/generate', async (request, env: Env) => {
  const body = await request.json<any>();
  await env.QUEUE.send({ type: 'generate-article', ...body });
  return new Response(JSON.stringify({ status: 'queued' }), { headers: { 'Content-Type': 'application/json' } });
});

router.post('/email/subscribe', async (request, env: Env) => {
  const { email, domain } = await request.json<any>();
  const token = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO subscribers (site_id, email, token, status) VALUES ((SELECT id FROM sites WHERE domain=?1), ?2, ?3, ?4) ON CONFLICT(email) DO UPDATE SET token=?3, status=?4')
    .bind(domain, email, token, 'pending')
    .run();
  // Hand off to email worker via queue
  await env.QUEUE.send({ type: 'send-email', subtype: 'double-opt', email, token, domain });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
});

router.get('/posts/:slug', async (_req, env: Env, ctx, { slug }) => {
  const row = await env.DB.prepare('SELECT * FROM posts WHERE slug=?1').bind(slug).first();
  if (!row) return new Response('Not found', { status: 404 });
  return Response.json(row);
});

router.get('/feed/rss', async (_req, env: Env) => {
  const rows = await env.DB.prepare('SELECT title, slug, published_at, meta_description FROM posts ORDER BY published_at DESC LIMIT 50').all();
  const items = (rows.results || []).map((r: any) => `
    <item>
      <title>${escapeXml(r.title)}</title>
      <link>https://${r.domain || 'example.com'}/blog/${r.slug}</link>
      <pubDate>${r.published_at}</pubDate>
      <description>${escapeXml(r.meta_description || '')}</description>
    </item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0"><channel><title>Autoblog</title>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
});

function escapeXml(str: string) {
  return str.replace(/[<>&'\"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]!));
}

router.get('/health', () => new Response('ok'));

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => router.handle(request, env, ctx),
};

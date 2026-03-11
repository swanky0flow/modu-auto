interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  GEMINI_API_KEY: string;
  CF_AI: Fetcher;
}

export default {
  async queue(batch: MessageBatch<unknown>, env: Env, ctx: ExecutionContext): Promise<void> {
    for (const msg of batch.messages) {
      const data: any = msg.body;
      if (data.type === 'generate-article') {
        ctx.waitUntil(handleGenerate(data, env));
      }
      if (data.type === 'generate-batch') {
        for (let i = 0; i < data.count; i++) ctx.waitUntil(handleGenerate({ ...data, idx: i }, env));
      }
      if (data.type === 'send-email') {
        ctx.waitUntil(handleEmail(data, env));
      }
    }
  }
};

async function handleGenerate(data: any, env: Env) {
  const { siteId } = data;
  // Fetch next scheduled calendar row
  const next = await env.DB.prepare('SELECT * FROM calendar WHERE site_id=?1 AND status="scheduled" ORDER BY publish_date LIMIT 1').bind(siteId).first();
  if (!next) return;
  const prompt = `Write a ${next.word_count || 1400} word article targeting ${next.target_keyword}. Include E-E-A-T signals, cite 2 sources, add internal links placeholders.`;
  const content = await callGemini(prompt, env.GEMINI_API_KEY);
  const slug = slugify(next.target_keyword);
  await env.DB.prepare('INSERT INTO posts (site_id, title, slug, content, meta_description, status, published_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime("now"))')
    .bind(siteId, next.target_keyword, slug, content, next.meta_description, 'published')
    .run();
  await env.DB.prepare('UPDATE calendar SET status="done" WHERE id=?1').bind(next.id).run();
}

async function handleEmail(data: any, env: Env) {
  // Email sending delegated to Email Worker via fetch
  await fetch('https://email.autoblog.internal/send', { method: 'POST', body: JSON.stringify(data) });
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.35 } })
  });
  const json: any = await res.json();
  return json?.candidates?.[0]?.content?.parts?.[0]?.text || 'Content generation failed.';
}

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
}

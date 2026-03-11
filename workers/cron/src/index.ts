interface Env {
  DB: D1Database;
  QUEUE: Queue;
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const due = await env.DB.prepare('SELECT site_id, COUNT(*) as cnt FROM calendar WHERE status="scheduled" AND publish_date <= datetime("now", "+1 day") GROUP BY site_id').all();
    for (const row of due.results || []) {
      ctx.waitUntil(env.QUEUE.send({ type: 'generate-batch', siteId: row.site_id, count: row.cnt || 1 }));
    }
  }
};

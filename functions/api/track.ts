interface Env {
  DB: D1Database;
  ANALYTICS_ENGINE: AnalyticsEngineDataset;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const body = await request.json() as { path?: string; event?: string };
  const path = body.path || '/';
  const event = body.event || 'pageview';

  const cf = request.cf as { country?: string; timezone?: string } | undefined;
  const country = cf?.country || 'XX';
  const timezone = cf?.timezone || 'UTC';

  if (env.ANALYTICS_ENGINE) {
    env.ANALYTICS_ENGINE.writeDataPoint({
      blobs: [path, event, country, request.headers.get('Referer') || ''],
      doubles: [1],
      indexes: [timezone],
    });
  }

  if (env.DB && event === 'pageview') {
    await env.DB.prepare(`
      INSERT INTO page_views (path, count, last_viewed)
      VALUES (?, 1, datetime('now'))
      ON CONFLICT(path) DO UPDATE SET
        count = count + 1,
        last_viewed = datetime('now')
    `).bind(path).run();
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const url = new URL(context.request.url);
  const path = url.searchParams.get('path');

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (path) {
    const result = await env.DB.prepare(
      'SELECT path, count, last_viewed FROM page_views WHERE path = ?'
    ).bind(path).first();
    
    return new Response(JSON.stringify(result || { path, count: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const results = await env.DB.prepare(
    'SELECT path, count, last_viewed FROM page_views ORDER BY count DESC LIMIT 50'
  ).all();

  return new Response(JSON.stringify(results.results), {
    headers: { 'Content-Type': 'application/json' },
  });
};

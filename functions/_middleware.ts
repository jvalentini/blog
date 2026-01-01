interface Env {
  BLOG_KV: KVNamespace;
  ANALYTICS: AnalyticsEngineDataset;
}

interface CFProperties {
  timezone?: string;
  country?: string;
  city?: string;
  continent?: string;
}

function getABBucket(request: Request): 'A' | 'B' {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/ab_bucket=([AB])/);
  if (match) return match[1] as 'A' | 'B';
  return Math.random() < 0.5 ? 'A' : 'B';
}

function formatLocalTime(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date());
  } catch {
    return '';
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next, env } = context;
  const cf = (request.cf || {}) as CFProperties;

  const abBucket = getABBucket(request);
  const timezone = cf.timezone || 'UTC';
  const country = cf.country || 'XX';
  const localTime = formatLocalTime(timezone);

  const response = await next();
  const newResponse = new Response(response.body, response);

  if (!request.headers.get('Cookie')?.includes('ab_bucket=')) {
    newResponse.headers.append('Set-Cookie', `ab_bucket=${abBucket}; Path=/; Max-Age=2592000; SameSite=Lax`);
  }

  newResponse.headers.set('X-Visitor-Timezone', timezone);
  newResponse.headers.set('X-Visitor-Country', country);
  newResponse.headers.set('X-Visitor-LocalTime', localTime);
  newResponse.headers.set('X-AB-Bucket', abBucket);

  if (env.ANALYTICS) {
    const url = new URL(request.url);
    env.ANALYTICS.writeDataPoint({
      blobs: [url.pathname, country, abBucket, request.headers.get('Referer') || ''],
      doubles: [1],
      indexes: [timezone],
    });
  }

  return newResponse;
};

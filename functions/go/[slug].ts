interface Env {
	BLOG_KV: KVNamespace;
	ANALYTICS_ENGINE: AnalyticsEngineDataset;
}

interface LinkData {
	url: string;
	clicks: number;
	createdAt: string;
}

const DEFAULT_LINKS: Record<string, string> = {
	twitter: 'https://twitter.com/jvalentini',
	x: 'https://twitter.com/jvalentini',
	github: 'https://github.com/jvalentini',
	linkedin: 'https://linkedin.com/in/jvalentini',
	rss: '/rss.xml',
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const { params, env, request } = context;
	const slug = params.slug as string;

	if (!slug) {
		return new Response('Not found', { status: 404 });
	}

	let targetUrl = DEFAULT_LINKS[slug.toLowerCase()];

	if (!targetUrl) {
		const stored = await env.BLOG_KV.get<LinkData>(`link:${slug}`, 'json');
		if (stored) {
			targetUrl = stored.url;
			await env.BLOG_KV.put(
				`link:${slug}`,
				JSON.stringify({
					...stored,
					clicks: stored.clicks + 1,
				}),
			);
		}
	}

	if (!targetUrl) {
		return new Response('Link not found', { status: 404 });
	}

	if (env.ANALYTICS_ENGINE) {
		const cf = request.cf as { country?: string } | undefined;
		env.ANALYTICS_ENGINE.writeDataPoint({
			blobs: [`/go/${slug}`, targetUrl, cf?.country || 'XX'],
			doubles: [1],
			indexes: ['shortlink'],
		});
	}

	const isAbsolute = targetUrl.startsWith('http');
	const redirectUrl = isAbsolute ? targetUrl : new URL(targetUrl, request.url).toString();

	return Response.redirect(redirectUrl, 302);
};

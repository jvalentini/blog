interface Env {
	BLOG_KV: KVNamespace;
	ADMIN_KEY?: string;
}

interface LinkData {
	url: string;
	clicks: number;
	createdAt: string;
}

function isAuthorized(request: Request, env: Env): boolean {
	if (!env.ADMIN_KEY) return false;
	const authHeader = request.headers.get('Authorization');
	return authHeader === `Bearer ${env.ADMIN_KEY}`;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const { env, request } = context;

	if (!isAuthorized(request, env)) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const list = await env.BLOG_KV.list({ prefix: 'link:' });
	const links: Array<{ slug: string } & LinkData> = [];

	for (const key of list.keys) {
		const data = await env.BLOG_KV.get<LinkData>(key.name, 'json');
		if (data) {
			links.push({ slug: key.name.replace('link:', ''), ...data });
		}
	}

	return new Response(JSON.stringify(links), {
		headers: { 'Content-Type': 'application/json' },
	});
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
	const { env, request } = context;

	if (!isAuthorized(request, env)) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const body = (await request.json()) as { slug?: string; url?: string };

	if (!body.slug || !body.url) {
		return new Response(JSON.stringify({ error: 'slug and url required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const slug = body.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
	const linkData: LinkData = {
		url: body.url,
		clicks: 0,
		createdAt: new Date().toISOString(),
	};

	await env.BLOG_KV.put(`link:${slug}`, JSON.stringify(linkData));

	return new Response(JSON.stringify({ success: true, slug, ...linkData }), {
		status: 201,
		headers: { 'Content-Type': 'application/json' },
	});
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
	const { env, request } = context;

	if (!isAuthorized(request, env)) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const url = new URL(request.url);
	const slug = url.searchParams.get('slug');

	if (!slug) {
		return new Response(JSON.stringify({ error: 'slug required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	await env.BLOG_KV.delete(`link:${slug}`);

	return new Response(JSON.stringify({ success: true, deleted: slug }), {
		headers: { 'Content-Type': 'application/json' },
	});
};

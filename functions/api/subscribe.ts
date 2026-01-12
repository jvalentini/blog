interface Env {
	BUTTONDOWN_API_KEY: string;
	TURNSTILE_SECRET_KEY?: string;
}

interface ButtondownResponse {
	id?: string;
	email?: string;
	error?: string[];
	code?: string;
	detail?: string;
	metadata?: unknown;
}

async function verifyTurnstile(token: string, secret: string, ip: string): Promise<boolean> {
	const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ secret, response: token, remoteip: ip }),
	});
	const result = (await response.json()) as { success: boolean };
	return result.success;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
	const { request, env } = context;

	// Debug logging
	console.log('Subscribe API called');
	console.log('BUTTONDOWN_API_KEY present:', !!env.BUTTONDOWN_API_KEY);

	const contentType = request.headers.get('Content-Type') || '';
	let email: string | null = null;
	let turnstileToken: string | null = null;

	const clientIPHeader = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '';
	const clientIP = clientIPHeader.split(',')[0]?.trim() || '';
	const referrerUrl = request.headers.get('Referer') || '';

	if (contentType.includes('application/json')) {
		const body = (await request.json()) as { email?: string; turnstileToken?: string };
		email = body.email || null;
		turnstileToken = body.turnstileToken || null;
		console.log('JSON request - email:', email, 'turnstile:', !!turnstileToken);
	} else {
		const formData = await request.formData();
		email = formData.get('email') as string | null;
		turnstileToken = formData.get('cf-turnstile-response') as string | null;
		console.log('Form request - email:', email, 'turnstile:', !!turnstileToken);
	}

	if (!email || !email.includes('@')) {
		console.log('Invalid email:', email);
		return new Response(JSON.stringify({ error: 'Valid email required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	// Optional spam protection via Turnstile (Cloudflare CAPTCHA)
	// This is SEPARATE from Buttondown - it only prevents bots before sending to Buttondown
	if (env.TURNSTILE_SECRET_KEY && turnstileToken) {
		const valid = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, clientIP);
		if (!valid) {
			return new Response(JSON.stringify({ error: 'Bot verification failed' }), {
				status: 403,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	}

	// Check if Buttondown API key is configured
	if (!env.BUTTONDOWN_API_KEY) {
		console.log('BUTTONDOWN_API_KEY not configured');
		return new Response(
			JSON.stringify({
				error: 'Newsletter service not configured. Please contact the site administrator.',
			}),
			{
				status: 503, // Service Unavailable
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}

	console.log('Making Buttondown API call for email:', email);

	const buttondownResponse = await fetch('https://api.buttondown.com/v1/subscribers', {
		method: 'POST',
		headers: {
			Authorization: `Token ${env.BUTTONDOWN_API_KEY}`,
			'Content-Type': 'application/json',
			'X-API-Version': '2025-06-01',
			'X-Buttondown-Collision-Behavior': 'add',
		},
		body: JSON.stringify({
			email_address: email,
			tags: ['website'],
			type: 'regular', // Skip double opt-in for website signups
			ip_address: clientIP || undefined,
			referrer_url: referrerUrl || undefined,
		}),
	});

	console.log('Buttondown response status:', buttondownResponse.status);

	if (buttondownResponse.ok) {
		const isFormSubmit = contentType.includes('form');
		if (isFormSubmit) {
			return Response.redirect(new URL('/thanks', request.url).toString(), 303);
		}
		return new Response(JSON.stringify({ success: true, message: 'Subscribed!' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const errorResponseClone = buttondownResponse.clone();
	let errorCode: string | undefined;
	let errorMessage = 'Subscription failed';

	try {
		const errorData = (await errorResponseClone.json()) as ButtondownResponse;
		console.log('Buttondown error data:', JSON.stringify(errorData));

		if (typeof errorData.code === 'string') errorCode = errorData.code;
		if (typeof errorData.detail === 'string') errorMessage = errorData.detail;

		if (!errorCode && Array.isArray(errorData.error)) {
			errorMessage = errorData.error.join(', ');
		}
	} catch {
		const errorText = await buttondownResponse.text().catch(() => '');
		console.log('Buttondown error (non-JSON):', errorText || '(empty body)');
	}

	console.log('Buttondown error:', errorCode || '(no code)', errorMessage);

	if (errorCode === 'subscriber_already_exists' || errorCode === 'email_already_exists') {
		return new Response(JSON.stringify({ success: true, message: 'Already subscribed!' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	return new Response(JSON.stringify({ error: errorMessage, code: errorCode }), {
		status: buttondownResponse.status,
		headers: { 'Content-Type': 'application/json' },
	});
};

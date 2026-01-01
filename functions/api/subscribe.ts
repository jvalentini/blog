interface Env {
  BUTTONDOWN_API_KEY: string;
  TURNSTILE_SECRET_KEY?: string;
}

interface ButtondownResponse {
  id?: string;
  email?: string;
  error?: string[];
}

async function verifyTurnstile(token: string, secret: string, ip: string): Promise<boolean> {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  const result = await response.json() as { success: boolean };
  return result.success;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const contentType = request.headers.get('Content-Type') || '';
  let email: string | null = null;
  let turnstileToken: string | null = null;

  if (contentType.includes('application/json')) {
    const body = await request.json() as { email?: string; turnstileToken?: string };
    email = body.email || null;
    turnstileToken = body.turnstileToken || null;
  } else {
    const formData = await request.formData();
    email = formData.get('email') as string | null;
    turnstileToken = formData.get('cf-turnstile-response') as string | null;
  }

  if (!email || !email.includes('@')) {
    return new Response(JSON.stringify({ error: 'Valid email required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Optional Turnstile verification
  if (env.TURNSTILE_SECRET_KEY && turnstileToken) {
    const clientIP = request.headers.get('CF-Connecting-IP') || '';
    const valid = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, clientIP);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Bot verification failed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const buttondownResponse = await fetch('https://api.buttondown.email/v1/subscribers', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${env.BUTTONDOWN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, tags: ['website'] }),
  });

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

  const errorData = await buttondownResponse.json() as ButtondownResponse;
  const errorMessage = errorData.error?.join(', ') || 'Subscription failed';

  if (errorMessage.includes('already subscribed')) {
    return new Response(JSON.stringify({ success: true, message: 'Already subscribed!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: errorMessage }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
};

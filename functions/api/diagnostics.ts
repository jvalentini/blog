interface Env {
  BUTTONDOWN_API_KEY: string;
  TURNSTILE_SECRET_KEY?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  const diagnostics = {
    timestamp: new Date().toISOString(),
    buttondown_key_present: !!env.BUTTONDOWN_API_KEY,
    buttondown_key_length: env.BUTTONDOWN_API_KEY?.length || 0,
    turnstile_key_present: !!env.TURNSTILE_SECRET_KEY,
    environment: 'production'
  };

  return new Response(JSON.stringify(diagnostics, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
};
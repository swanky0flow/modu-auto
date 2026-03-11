interface Env {
  EMAIL: SendEmail;
  DB: D1Database;
}

type SendEmail = (options: {from: string; to: string; subject: string; content: {type: 'text' | 'html'; value: string}[];}) => Promise<void>;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    const data = await req.json<any>();
    if (data.subtype === 'double-opt') {
      await sendDoubleOpt(data, env);
    }
    if (data.subtype === 'welcome') {
      await sendWelcome(data, env);
    }
    return new Response('ok');
  }
};

async function sendDoubleOpt(data: any, env: Env) {
  const link = `https://${data.domain}/confirm?token=${data.token}`;
  await env.EMAIL({
    from: 'Autoblog <no-reply@autoblog.cloudflareemail.com>',
    to: data.email,
    subject: 'Confirm your subscription',
    content: [{ type: 'text', value: `Confirm your subscription: ${link}` }]
  });
}

async function sendWelcome(data: any, env: Env) {
  await env.EMAIL({
    from: 'Autoblog <no-reply@autoblog.cloudflareemail.com>',
    to: data.email,
    subject: 'Welcome to the newsletter',
    content: [{ type: 'text', value: 'Thanks for subscribing! Expect 1-2 emails per week.' }]
  });
}

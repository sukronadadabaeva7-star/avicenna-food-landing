// Cloudflare Worker: принимает заказ с сайта и пересылает в Telegram.
// Токен бота и chat_id хранятся в Variables and Secrets (env), НЕ в этом файле и НЕ на сайте.
export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const { text } = await request.json();
      const tgRes = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text })
      });
      if (!tgRes.ok) throw new Error('Telegram error');
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false }), { status: 500, headers: corsHeaders });
    }
  }
};

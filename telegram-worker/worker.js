// Cloudflare Worker — proxy seguro para notificaciones Telegram
// Variables de entorno requeridas (en el dashboard de Cloudflare → Workers → Settings → Variables):
//   TG_TOKEN   = token del bot (ej: 8831887218:AAGxxx...)
//   TG_CHAT_ID = tu chat ID (ej: 6969195655)

const ALLOWED_ORIGIN = '*'; // Podés restringir a 'https://herniberelejis-lgtm.github.io' si querés

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
    }

    const { text } = body;
    if (!text || typeof text !== 'string' || text.length > 4000) {
      return new Response('Invalid payload', { status: 400, headers: corsHeaders });
    }

    try {
      const tgRes = await fetch(
        `https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id:    env.TG_CHAT_ID,
            text,
            parse_mode: 'Markdown',
          }),
        }
      );

      const result = await tgRes.json();
      return new Response(JSON.stringify(result), {
        status: tgRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      return new Response('Worker error', { status: 500, headers: corsHeaders });
    }
  },
};

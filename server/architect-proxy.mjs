/**
 * ASLAN 2035 OMEGA — optional AI Architect proxy.
 *
 * A small HTTP server that receives { message, design, locks } from the web
 * app, asks Claude to map the request onto the supported design parameters
 * (structured JSON output), and returns the result. The Anthropic API key is
 * read from the server environment and is never sent to the browser.
 *
 *   ANTHROPIC_API_KEY=... node architect-proxy.mjs
 *   (then build the app with VITE_ARCHITECT_ENDPOINT=/api/architect)
 *
 * The web app re-validates every returned value before applying it.
 */
import http from 'node:http';
import Anthropic from '@anthropic-ai/sdk';
import { PARAMETERS, RESPONSE_SCHEMA } from './schema.mjs';

const PORT = Number(process.env.PORT ?? 8787);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? '';
const MAX_BODY = 24 * 1024;
const RATE = { windowMs: 60_000, max: Number(process.env.RATE_LIMIT_PER_MIN ?? 12) };

const client = new Anthropic();

const SYSTEM = `You are the AI Architect inside "ASLAN 2035 OMEGA", an independent concept platform (not an official club project) for the future of the RAMS Park stadium in Istanbul.
Your only job: map the user's natural-language request onto the supported visual design parameters listed below, and explain the result in Turkish.

Rules:
- Only use keys from the parameter list. Values must be one of the allowed values (as strings; numbers like "0.4", booleans "true"/"false", colours "#rrggbb").
- Change as few parameters as needed. Do not change locked keys.
- Never claim structural, cost, capacity, fire-safety or energy results. Requests about capacity, retractable roofs, demolition, new tiers or costs are out of scope: explain why in "outOfScope" and change nothing for them.
- "explanation": short Turkish sentences describing what changed and why.
- "unknowns": what cannot be known from a visual concept. "constraints": technical constraints to review (engineering, permits, light pollution, maintenance).
- If the request is a question (e.g. about risks), answer in "explanation"/"constraints" and return no changes.
- The existing stadium already has a rooftop solar plant (~4.2–4.3 MW, 10,000+ panels); describe extensions as concepts that need engineering review.

Supported parameters:
${Object.entries(PARAMETERS)
  .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(' | ') : v}`)
  .join('\n')}`;

/* ---------------- helpers ---------------- */

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < RATE.windowMs);
  list.push(now);
  hits.set(ip, list);
  return list.length > RATE.max;
}

function send(res, status, body) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  if (ALLOWED_ORIGIN) {
    headers['Access-Control-Allow-Origin'] = ALLOWED_ORIGIN;
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers.Vary = 'Origin';
  }
  res.writeHead(status, headers);
  res.end(status === 204 ? undefined : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('Body too large'), { status: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function validateInput(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw Object.assign(new Error('Invalid JSON'), { status: 400 });
  }
  const message = typeof data?.message === 'string' ? data.message.trim().slice(0, 600) : '';
  if (!message) throw Object.assign(new Error('message is required'), { status: 400 });
  const design = data?.design && typeof data.design === 'object' ? data.design : {};
  const locks = Array.isArray(data?.locks) ? data.locks.filter((k) => typeof k === 'string' && k in PARAMETERS).slice(0, 40) : [];
  return { message, design: JSON.stringify(design).slice(0, 8000), locks };
}

/* ---------------- Claude call ---------------- */

async function architect({ message, design, locks }) {
  const response = await client.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: RESPONSE_SCHEMA } },
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Current design (JSON): ${design}\nLocked keys: ${locks.length ? locks.join(', ') : 'none'}\n\nUser request: ${message}`,
      },
    ],
  });
  if (response.stop_reason === 'refusal') {
    throw Object.assign(new Error('İstek model tarafından reddedildi.'), { status: 422 });
  }
  const text = response.content.find((b) => b.type === 'text')?.text ?? '';
  try {
    return JSON.parse(text);
  } catch {
    throw Object.assign(new Error('Model çıktısı okunamadı.'), { status: 502 });
  }
}

/* ---------------- server ---------------- */

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204);
  if (req.url !== '/api/architect' || req.method !== 'POST') return send(res, 404, { error: 'Not found' });
  if (!(req.headers['content-type'] ?? '').includes('application/json')) return send(res, 415, { error: 'Expected application/json' });
  const ip = req.socket.remoteAddress ?? 'unknown';
  if (rateLimited(ip)) return send(res, 429, { error: 'Too many requests' });
  try {
    const input = validateInput(await readBody(req));
    const result = await architect(input);
    send(res, 200, result);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return send(res, 429, { error: 'Upstream rate limit' });
    if (err instanceof Anthropic.AuthenticationError) return send(res, 500, { error: 'Server is not configured with a valid API key' });
    if (err instanceof Anthropic.APIError) return send(res, 502, { error: `Upstream error ${err.status ?? ''}`.trim() });
    if (err instanceof Anthropic.AnthropicError) {
      console.error('[architect] client error:', err.message);
      return send(res, 500, { error: 'Server is not configured with Anthropic credentials' });
    }
    // the SDK raises a plain Error when no credential source is configured
    if (err instanceof Error && /authentication method/i.test(err.message)) return send(res, 500, { error: 'Server is not configured with Anthropic credentials' });
    const status = typeof err?.status === 'number' ? err.status : 500;
    if (status === 500) console.error('[architect] unexpected error:', err);
    send(res, status, { error: status === 500 ? 'Internal error' : err.message });
  }
});

server.listen(PORT, () => {
  console.log(`AI Architect proxy listening on http://localhost:${PORT}/api/architect`);
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_PROFILE) {
    console.warn('No ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN set; requests will fail unless an `ant auth login` profile is active.');
  }
});

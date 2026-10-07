// Cloudflare Pages işlevi: /arsiv/<anahtar> — kalenin Sonsuz Arşivi (Cloudflare R2). Fotoğraf ve sesler buraya kasanın
// anahtarıyla şifrelenmiş metin olarak yazılır; bu işlev şifreyi bilmez, yalnız saklar ve geri verir. İstek
// x-kale başlığında ARSIV_KEY gizli değişkeniyle aynı erişim anahtarını taşımalıdır. Silme yoktur: arşiv yalnız büyür.
// Kurulum: Pages → Settings → Functions → R2 bucket bindings: ARSIV · Environment variables (Secret): ARSIV_KEY.
const AD = /^[a-z0-9][a-z0-9-]{6,90}$/;
const MAX = 25 * 1024 * 1024;
const yanit = (body, status = 200, h = {}) => new Response(body, { status, headers: Object.assign({ 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }, h) });
// Sabit süreli karşılaştırma (anahtarı tahmin etmeye yarayan zamanlama farkı olmasın)
function esit(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
export async function onRequest({ request, env, params }) {
  if (!env.ARSIV || !env.ARSIV_KEY) return yanit('arsiv kurulmamis', 501);
  if (!esit(request.headers.get('x-kale') || '', env.ARSIV_KEY)) return yanit('yetkisiz', 401);
  const key = [].concat(params.path || []).join('/');
  if (key === '_ping') return yanit('ok');
  if (!AD.test(key)) return yanit('gecersiz', 400);
  if (request.method === 'PUT') {
    if (+(request.headers.get('content-length') || 0) > MAX) return yanit('cok buyuk', 413);
    const text = await request.text();
    if (text.length > MAX) return yanit('cok buyuk', 413);
    if (await env.ARSIV.head(key)) return yanit('var', 409);
    await env.ARSIV.put(key, text, { httpMetadata: { contentType: 'text/plain; charset=utf-8' } });
    return yanit('ok', 201);
  }
  if (request.method === 'GET') {
    const o = await env.ARSIV.get(key);
    if (!o) return yanit('yok', 404);
    return new Response(o.body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'private, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' } });
  }
  return yanit('izin yok', 405, { allow: 'GET, PUT' });
}

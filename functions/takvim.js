// Cloudflare Pages işlevi: /takvim?t=<anahtar> → kalenin takvimi (iCalendar, .ics). iPhone Takvim'e abone olunur.
// Kale takvim paketini (21'leri, sözler, sınavlar, dolunaylar...) kendi rastgele anahtarıyla şifreleyip buluta koyar;
// bu işlev en son paketi okur, anahtarla çözer ve takvime çevirir. Anahtar yalnız abonelik adresinde durur; bulutta
// ve bu dosyada hiçbir şifre ya da kişisel bilgi yoktur.
const b64 = (s) => Uint8Array.from(atob(String(s).replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
const fold = (line) => {
  const out = [];
  let rest = line;
  while (new TextEncoder().encode(rest).length > 74) {
    let n = 74;
    while (new TextEncoder().encode(rest.slice(0, n)).length > 74) n--;
    out.push(rest.slice(0, n));
    rest = ' ' + rest.slice(n);
  }
  out.push(rest);
  return out.join('\r\n');
};
const ymd = (s) => String(s).replace(/-/g, '');
const stamp = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const nextDay = (s) => {
  const d = new Date(s + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

export function ics(pack, host) {
  const now = stamp(Date.now());
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kale//Takvim//TR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${esc(pack.name || 'Kalemiz')}`, 'X-WR-CALDESC:Kalenin takvimi', 'REFRESH-INTERVAL;VALUE=DURATION:PT6H', 'X-PUBLISHED-TTL:PT6H'];
  (pack.events || []).forEach((e) => {
    lines.push('BEGIN:VEVENT', `UID:${esc(e.uid)}@${host}`, `DTSTAMP:${now}`);
    if (e.allDay) lines.push(`DTSTART;VALUE=DATE:${ymd(e.start)}`, `DTEND;VALUE=DATE:${ymd(e.end || nextDay(e.start))}`);
    else lines.push(`DTSTART:${stamp(e.start)}`, `DTEND:${stamp(e.end || e.start + 30 * 60e3)}`);
    if (e.rrule) lines.push(`RRULE:${e.rrule}`);
    lines.push(`SUMMARY:${esc(e.title)}`);
    e.desc && lines.push(`DESCRIPTION:${esc(e.desc)}`);
    e.url && lines.push(`URL:${e.url}`);
    if (e.alarm) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(e.title)}`, `TRIGGER:${e.alarm}`, 'END:VALARM');
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const bad = (msg, code = 400) => new Response(msg, { status: code, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  let tok;
  try {
    tok = JSON.parse(new TextDecoder().decode(b64(url.searchParams.get('t') || '')));
  } catch (e) {
    return bad('Takvim adresi eksik ya da bozuk.');
  }
  if (!tok || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(tok.u || '') || !tok.a || !tok.k || !tok.s) return bad('Takvim adresi eksik ya da bozuk.');
  const res = await fetch(`${tok.u}/rest/v1/kale?select=data,created_at&space=eq.${encodeURIComponent(tok.s)}&kind=eq.takvimpub&order=created_at.desc&limit=1`, { headers: { apikey: tok.a, Authorization: `Bearer ${tok.a}` } });
  if (!res.ok) return bad('Takvim şu an okunamadı.', 502);
  const rows = await res.json();
  if (!rows.length) return bad('Takvim henüz hazır değil: kaleyi bir kez aç.', 404);
  let pack;
  try {
    const bytes = b64(rows[0].data);
    const key = await crypto.subtle.importKey('raw', b64(tok.k), 'AES-GCM', false, ['decrypt']);
    pack = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, key, bytes.slice(12))));
  } catch (e) {
    return bad('Takvim anahtarı uymuyor: kaleden yeni adresi al.', 403);
  }
  return new Response(ics(pack, url.host), { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'public, max-age=900', 'Content-Disposition': 'inline; filename="kalemiz.ics"' } });
}

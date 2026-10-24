import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Sınırlı ve güvenli Markdown: başlık (##, ###), paragraf, liste (-), kalın (**), bağlantı.
 * Ham HTML hiçbir zaman işlenmez (dangerouslySetInnerHTML yok) → XSS'e kapalı.
 * Bağlantılar yalnızca site içi yol veya https olabilir.
 */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={`${key}-b${i++}`}>{m[1]}</strong>);
    else {
      const href = m[3];
      const safe = href.startsWith("/") && !href.startsWith("//") ? href : /^https:\/\//.test(href) ? href : null;
      out.push(
        safe ? (
          safe.startsWith("/") ? (
            <Link key={`${key}-l${i++}`} href={safe}>
              {m[2]}
            </Link>
          ) : (
            <a key={`${key}-l${i++}`} href={safe} rel="nofollow noopener" target="_blank">
              {m[2]}
            </a>
          )
        ) : (
          m[2]
        ),
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r/g, "").split(/\n{2,}/);
  return (
    <div className="prose-lite">
      {blocks.map((b, i) => {
        const t = b.trim();
        if (!t) return null;
        if (t.startsWith("### ")) return <h3 key={i}>{inline(t.slice(4), `h${i}`)}</h3>;
        if (t.startsWith("## ")) return <h2 key={i}>{inline(t.slice(3), `h${i}`)}</h2>;
        const lines = t.split("\n");
        if (lines.every((l) => l.trim().startsWith("- "))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.trim().slice(2), `l${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{inline(lines.join(" "), `p${i}`)}</p>;
      })}
    </div>
  );
}

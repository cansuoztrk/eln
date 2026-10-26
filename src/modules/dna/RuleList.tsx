import { useDesign } from '@/core/store/designStore';
import type { RuleFinding } from '@/core/model/rules';
import { Badge } from '@/ui/primitives';

export function RuleList({ findings, compact }: { findings: RuleFinding[]; compact?: boolean }) {
  const patch = useDesign((s) => s.patch);
  if (findings.length === 0) return <p className="text-[12.5px] muted">Seçimler birbiriyle tutarlı; çakışma bulunmadı.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {findings.map((f) => (
        <li key={f.id} className={`rounded-xl border p-3 ${f.severity === 'conflict' ? 'border-aslan/50 bg-aslan/5' : f.severity === 'engineering' ? 'border-eng/50 bg-eng/5' : 'border-line bg-surface-2'}`}>
          <div className="flex items-start gap-2 justify-between">
            <span className="text-[13px] font-semibold leading-snug">{f.title}</span>
            {f.severity === 'conflict' ? <Badge kind="concept">Çakışma</Badge> : f.severity === 'engineering' ? <Badge kind="eng">Mühendislik</Badge> : <Badge kind="sim">Bilgi</Badge>}
          </div>
          {!compact && <p className="text-[12px] muted leading-snug mt-1">{f.detail}</p>}
          {f.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {f.suggestions.map((s) => (
                <button key={s.label} type="button" className="chip !min-h-[28px]" onClick={() => patch(s.patch, `Öneri: ${s.label}`, { respectLocks: false })}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

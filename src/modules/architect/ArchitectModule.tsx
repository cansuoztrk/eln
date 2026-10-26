import { useEffect, useRef, useState } from 'react';
import { useDesign } from '@/core/store/designStore';
import { useView } from '@/core/store/viewStore';
import { useArchive } from '@/core/store/archiveStore';
import { applyPatch, diffDesigns, type DesignConfig, type DesignDiff } from '@/core/model/design';
import { KEY_LABEL, prettyValue } from '@/core/model/labels';
import { DNA_BY_ID } from '@/core/model/dna';
import { worldApi } from '@/world/worldApi';
import { Badge, Icon, Note, Section, Segmented } from '@/ui/primitives';
import { EXAMPLES, SUPPORTED, interpret, type ArchitectResponse } from './engine';
import { REMOTE_ENDPOINT, interpretRemote } from './remote';

interface Turn {
  id: number;
  user: string;
  response?: ArchitectResponse;
  diffs: DesignDiff[];
  before?: DesignConfig;
  undone?: boolean;
  error?: string;
}

let turnSeq = 1;

export default function ArchitectModule() {
  const locks = useDesign((s) => s.locks);
  const setDesign = useDesign((s) => s.setDesign);
  const undo = useDesign((s) => s.undo);
  const past = useDesign((s) => s.past);
  const archive = useArchive((s) => s.entries);
  const set = useView((s) => s.set);
  const setLayer = useView((s) => s.setLayer);
  const [engine, setEngine] = useState<'rules' | 'remote'>('rules');
  const [text, setText] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    logRef.current?.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: useView.getState().reducedMotion ? 'auto' : 'smooth' });
  }, [turns]);

  const run = async (message: string) => {
    const msg = message.trim();
    if (!msg || busy) return;
    setText('');
    const before = useDesign.getState().design;
    let response: ArchitectResponse;
    try {
      setBusy(true);
      response =
        engine === 'remote'
          ? await interpretRemote(msg, before, locks)
          : interpret(msg, {
              design: before,
              locks,
              previous: past.length ? past[past.length - 1].design : null,
              archive: archive.map((e) => ({ name: e.name, config: e.versions[0].config })),
            });
    } catch (e) {
      setTurns((t) => [...t, { id: turnSeq++, user: msg, diffs: [], error: (e as Error).message }]);
      setBusy(false);
      return;
    }
    setBusy(false);

    // apply
    let next = before;
    if (response.dna) next = applyPatch(next, DNA_BY_ID[response.dna].patch, new Set(locks));
    if (response.patch) next = applyPatch(next, response.patch, new Set(locks));
    const diffs = diffDesigns(before, next);
    if (diffs.length) setDesign(next, `AI Architect: ${response.understood[0] ?? msg.slice(0, 40)}`);

    const v = response.view;
    if (v.undo) undo();
    if (v.layers) Object.entries(v.layers).forEach(([k, on]) => setLayer(k as never, !!on));
    if (v.section !== undefined) set({ section: v.section, exploded: false });
    if (v.exploded !== undefined) set({ exploded: v.exploded, section: 'off' });
    if (v.atmosphere) set({ atmosphere: v.atmosphere, occupancy: v.atmosphere === 'silent' ? 0 : 0.9 });
    if (v.highlight) {
      set({ highlight: v.highlight });
      setTimeout(() => useView.getState().set({ highlight: [] }), 6000);
    }
    if (v.camera) worldApi.flyTo(v.camera, { mode: 'explorer' });

    setTurns((t) => [...t, { id: turnSeq++, user: msg, response, diffs, before: diffs.length ? before : undefined }]);
  };

  const revert = (turn: Turn) => {
    if (!turn.before) return;
    setDesign(turn.before, 'AI Architect değişikliği geri alındı');
    setTurns((t) => t.map((x) => (x.id === turn.id ? { ...x, undone: true } : x)));
  };

  return (
    <div className="flex flex-col">
      <Section title="Dijital tasarım danışmanı" kicker="AI Architect" badges={engine === 'rules' ? <Badge kind="demo">Kural tabanlı demo — yapay zekâ modeli değildir</Badge> : <Badge kind="sim">Uzak AI motoru (sunucu)</Badge>}>
        <Segmented
          label="Motor"
          value={engine}
          onChange={(v) => setEngine(v)}
          options={[
            { value: 'rules', label: 'Kural tabanlı demo' },
            ...(REMOTE_ENDPOINT ? [{ value: 'remote' as const, label: 'Uzak AI (yapılandırıldı)' }] : []),
          ]}
        />
        <p className="text-[11.5px] muted mt-2 leading-snug">
          {engine === 'rules'
            ? 'Bu sürüm, önceden tanımlı ifadeleri tanıyan ve desteklenen tasarım parametrelerine eşleyen deterministik bir yorumlayıcıdır. İsteğe bağlı bir sunucu tarafı AI motoru README’de açıklanmıştır; API anahtarı tarayıcıya hiç gönderilmez.'
            : 'İstekler yapılandırılmış sunucuya gönderilir. Dönen her değer tarayıcıda yeniden doğrulanır ve kilitli seçimler korunur.'}
        </p>
      </Section>

      <ol ref={logRef} className="flex flex-col gap-3 mb-3" aria-live="polite">
        {turns.map((t) => (
          <li key={t.id} className="flex flex-col gap-1.5">
            <div className="self-end max-w-[90%] rounded-2xl rounded-br-md bg-aslan/20 border border-aslan/40 px-3 py-2 text-[13px]">{t.user}</div>
            <div className="card !p-3 text-[12.5px]">
              {t.error ? (
                <p className="text-eng">{t.error}</p>
              ) : t.response?.help ? (
                <>
                  <p className="mb-1.5">Bu isteği desteklenen bir tasarım parametresiyle eşleştiremedim. Desteklenen ifadeler:</p>
                  <ul className="list-dots">
                    {SUPPORTED.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </>
              ) : (
                t.response && <ResponseView turn={t} onRevert={() => revert(t)} />
              )}
            </div>
          </li>
        ))}
      </ol>

      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run(text);
        }}
      >
        <label htmlFor="architect-input" className="field-label">
          İsteğinizi yazın
        </label>
        <textarea
          id="architect-input"
          className="textarea"
          maxLength={600}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Örn. “Çatı ışıklarını daha minimal yap.”"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void run(text);
            }
          }}
        />
        <button type="submit" className="btn btn-primary" disabled={busy || !text.trim()}>
          <Icon name="Send" size={15} /> {busy ? 'Yorumlanıyor…' : 'Gönder'}
        </button>
      </form>

      <Section title="Örnek istekler">
        <div className="flex flex-col gap-1.5">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="text-left text-[12.5px] rounded-xl border border-line bg-surface-2 hover:border-white/20 px-3 py-2" onClick={() => void run(ex)}>
              {ex}
            </button>
          ))}
        </div>
      </Section>

      <Note kind="warn">Her doğal dil isteği fiziksel olarak uygulanabilir bir tasarıma dönüştürülemez. AI Architect yalnızca desteklenen görsel konsept parametrelerini değiştirir ve teknik mühendislik onayının yerine geçmez.</Note>
    </div>
  );
}

function ResponseView({ turn, onRevert }: { turn: Turn; onRevert: () => void }) {
  const r = turn.response!;
  return (
    <div className="flex flex-col gap-2">
      {r.understood.length > 0 && (
        <div>
          <div className="field-label mb-0.5">Anlaşılan amaç</div>
          <ul className="list-dots">
            {r.understood.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </div>
      )}
      {turn.diffs.length > 0 && (
        <div>
          <div className="field-label mb-0.5">Değişen özellikler ({turn.diffs.length})</div>
          <ul className="list-dots">
            {turn.diffs
              .filter((d) => !d.key.startsWith('show.sequence'))
              .slice(0, 14)
              .map((d) => (
                <li key={d.key}>
                  {KEY_LABEL[d.key] ?? d.key}: {prettyValue(d.key, d.from)} → <strong>{prettyValue(d.key, d.to)}</strong>
                </li>
              ))}
          </ul>
        </div>
      )}
      {r.explanation.length > 0 && (
        <div>
          <div className="field-label mb-0.5">Açıklama</div>
          {r.explanation.map((x) => (
            <p key={x} className="m-0 mb-1 leading-snug text-[#dcd9d2]">
              {x}
            </p>
          ))}
        </div>
      )}
      {r.analysis && (
        <div>
          <div className="field-label mb-0.5">Değerlendirme</div>
          <ul className="list-dots">
            {r.analysis.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      )}
      {r.outOfScope && r.outOfScope.length > 0 && (
        <div className="rounded-lg border border-eng/40 bg-eng/5 p-2">
          <div className="field-label mb-0.5 !text-eng">Kapsam dışı</div>
          {r.outOfScope.map((x) => (
            <p key={x} className="m-0 mb-1 leading-snug">
              {x}
            </p>
          ))}
        </div>
      )}
      {(r.unknowns.length > 0 || r.constraints.length > 0) && (
        <div>
          <div className="field-label mb-0.5">Bilinmeyenler ve teknik kısıtlar</div>
          <ul className="list-dots">
            {[...r.unknowns, ...r.constraints].map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      )}
      {turn.before && (
        <button type="button" className="btn btn-sm self-start" onClick={onRevert} disabled={turn.undone}>
          <Icon name="Undo2" size={14} /> {turn.undone ? 'Geri alındı' : 'Bu değişikliği geri al'}
        </button>
      )}
    </div>
  );
}

import { useView } from '@/core/store/viewStore';

/**
 * Shown under a feature that needs the 3D view while the 2D plan is active:
 * offers the switch, or says why this device cannot show 3D at all.
 */
export function Needs3D({ what }: { what: string }) {
  const view2D = useView((s) => s.view2D);
  const webgl = useView((s) => s.webgl);
  if (!view2D) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] muted leading-snug">
      {webgl ? (
        <>
          <span>{what} 3D görünüm gerektirir.</span>
          <button type="button" className="chip !min-h-[26px] !px-2.5 text-[11.5px]" onClick={() => useView.getState().set({ view2D: false })}>
            3D görünüme geç
          </button>
        </>
      ) : (
        <span>{what} WebGL gerektirir. Bu cihazda WebGL kullanılamadığı için 2D plan ve metin içerikleri sunulur.</span>
      )}
    </div>
  );
}

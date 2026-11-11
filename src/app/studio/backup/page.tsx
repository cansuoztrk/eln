import type { Metadata } from "next";
import { ExportButtons } from "@/features/account/components/account-forms";
import { requireOwner } from "@/lib/auth/session";
import { StudioCard, StudioPage } from "../studio-page";

export const metadata: Metadata = { title: "Yedek" };

function Command({ children }: { children: string }) {
  return <pre className="overflow-x-auto rounded-xl bg-ink px-4 py-3 font-mono text-[13px] leading-relaxed text-pearl">{children}</pre>;
}

/** Where Arda is reminded that a copy of everything should always be in his own hands. */
export default async function StudioBackupPage() {
  await requireOwner();

  return (
    <StudioPage title="Yedek" description="Burada yıllarca anı birikecek. Kural basit: verinin bir kopyası her zaman senin elinde olsun.">
      <div className="space-y-6">
        <StudioCard title="Hemen indir">
          <p className="mb-5 max-w-2xl text-sm leading-relaxed text-muted">
            Senin yazdığın ve yüklediğin her şey: yazılar tek bir JSON dosyası, fotoğraf ve ses kayıtlarının dokunulmamış orijinalleri ZIP olarak. Bu
            hızlı bir kopyadır; tam yedek için aşağıdaki komutu kullan.
          </p>
          <ExportButtons />
        </StudioCard>

        <StudioCard title="Tam yedek">
          <p className="mb-4 max-w-2xl text-sm leading-relaxed text-muted">
            Bilgisayarında, proje klasöründe çalıştırılır. Veritabanını ve bütün dosyaları (iki tarafın yayımladıkları dahil) ayrı klasörlere yazar;
            biri bozulsa diğeri etkilenmez.
          </p>
          <div className="space-y-3">
            <Command>npm run backup</Command>
            <Command>node scripts/verify-backup.mjs backups/&lt;zaman&gt;</Command>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Yedeği en az iki ayrı yerde sakla (örneğin harici disk ve şifreli bir bulut klasörü). İçinde özel fotoğraflar ve mektuplar var; herkese açık
            bir yere koyma.
          </p>
        </StudioCard>

        <StudioCard title="Geri yükleme">
          <p className="mb-4 max-w-2xl text-sm leading-relaxed text-muted">
            Boş bir projeye, önce prova ederek. Ayrıntılar ve yıllık bakım listesi depodaki <span className="font-mono text-[13px]">docs/BACKUP_GUIDE.md</span>{" "}
            dosyasında.
          </p>
          <div className="space-y-3">
            <Command>node scripts/restore.mjs backups/&lt;zaman&gt; --dry-run</Command>
            <Command>node scripts/restore.mjs backups/&lt;zaman&gt; --yes-overwrite</Command>
          </div>
        </StudioCard>
      </div>
    </StudioPage>
  );
}

import { createFeedSource } from "@/app/admin/actions";
import { AdminPage, Field, Panel } from "@/components/admin/ui";
import { ActionForm } from "@/components/forms/action-form";
import { requireStaff } from "@/server/auth/guards";

export const metadata = { title: "Ürün feed'i ekle" };

export default async function NewFeedSource() {
  await requireStaff("ADMIN");
  return (
    <AdminPage
      title="Yetkili ürün feed'i ekle"
      description="Mağazanın veya satış ortaklığı ağının size verdiği ürün veri akışını bağlayın (Google Merchant XML, YML, CSV, JSON). Feed adresi genellikle erişim anahtarı içerdiğinden adresi ortam değişkenine koyun; burada yalnızca değişkenin adını girin."
    >
      <Panel>
        <ActionForm action={createFeedSource} submitLabel="Kaynağı oluştur">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Kaynak adı">
              <input name="name" required placeholder="Örnek Mağaza · ürün feed'i" className="field" />
            </Field>
            <Field label="Mağaza adı">
              <input name="retailerName" required placeholder="Örnek Mağaza" className="field" />
            </Field>
            <Field label="Mağaza web adresi">
              <input name="websiteUrl" type="url" required placeholder="https://www.ornekmagaza.com" className="field" />
            </Field>
            <Field label="Feed adresini tutan ortam değişkeni" hint="FEED_ ile başlamalı. Değeri sunucuda .env veya barındırma panelinde tanımlayın.">
              <input name="feedUrlEnv" required pattern="FEED_[A-Z0-9_]+" placeholder="FEED_ORNEK_MAGAZA_URL" className="field font-mono" />
            </Field>
            <Field label="Biçim">
              <select name="format" defaultValue="auto" className="field">
                <option value="auto">Otomatik algıla</option>
                <option value="google-merchant">Google Merchant XML</option>
                <option value="yml">YML (Admitad vb.)</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </Field>
            <Field label="Para birimi">
              <input name="currency" defaultValue="TRY" maxLength={3} className="field font-mono" />
            </Field>
            <Field label="Varsayılan kargo (TL, isteğe bağlı)" hint="Feed kargo vermiyorsa ve mağaza politikası biliniyorsa. Boş = bilinmiyor.">
              <input name="defaultShipping" inputMode="decimal" className="field" />
            </Field>
            <Field label="Ücretsiz kargo eşiği (TL, isteğe bağlı)">
              <input name="freeShippingThreshold" inputMode="decimal" className="field" />
            </Field>
          </div>
        </ActionForm>
      </Panel>
    </AdminPage>
  );
}

export const metadata = { title: "Satış ortaklığı açıklaması", alternates: { canonical: "/satis-ortakligi" } };

export default function AffiliatePage() {
  return (
    <>
      <h1 className="font-display text-[30px] font-[680] tracking-tight">Satış ortaklığı ve sponsorluk açıklaması</h1>
      <p>Platformu ücretsiz sunabilmek için bazı mağaza bağlantıları resmî satış ortaklığı programları üzerinden yönlendirilebilir. Bu bağlantılardan alışveriş yaptığınızda mağaza bize komisyon ödeyebilir; ödediğiniz fiyat değişmez.</p>
      <ul>
        <li>Satış ortaklığı yalnızca ilgili mağazanın resmî programına kabul edildikten sonra etkinleştirilir. Onay olmadan komisyon parametresi eklenmez.</li>
        <li>Komisyon, fırsat puanını veya sıralamayı etkilemez. En ucuz teklif, komisyon olsun olmasın en ucuz olarak gösterilir.</li>
        <li>Para karşılığı öne çıkarılan ürünler her zaman “Sponsorlu” olarak işaretlenir ve doğal sıralamadan ayrı tutulur.</li>
        <li>Ürün sayfalarında her teklifin yanında bağlantının satış ortaklığı bağlantısı olup olmadığı belirtilir.</li>
      </ul>
    </>
  );
}

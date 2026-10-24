export const metadata = { title: "Gizlilik politikası", alternates: { canonical: "/gizlilik" } };

export default function PrivacyPage() {
  return (
    <>
      <h1 className="font-display text-[30px] font-[680] tracking-tight">Gizlilik politikası (taslak)</h1>
      <p>Gereksiz kişisel veri istemiyoruz. Siteyi hesap açmadan kullanabilirsiniz; favoriler hesap olmadan yalnızca tarayıcınızda saklanır.</p>
      <h2>Ne topluyoruz?</h2>
      <ul>
        <li>Hesap açarsanız: e-posta adresiniz, isteğe bağlı adınız ve parolanızın tek yönlü özeti (parolanın kendisi saklanmaz).</li>
        <li>Kullandığınız özellikler: favori, alarm, kayıtlı arama, ilgi alanı.</li>
        <li>Anonim istatistik: bir mağaza bağlantısına tıklandığında ürün, mağaza ve kategori; IP adresi saklanmaz.</li>
        <li>Arama kutusuna yazılan sorgular yalnızca anonim popüler arama sayımı için normalize edilerek tutulur; kişiyle ilişkilendirilmez.</li>
      </ul>
      <h2>Ne yapmıyoruz?</h2>
      <ul>
        <li>Verilerinizi satmıyoruz.</li>
        <li>Üçüncü taraf reklam/izleme çerezleri kullanmıyoruz.</li>
        <li>Açık rızanız olmadan pazarlama e-postası göndermiyoruz.</li>
      </ul>
      <h2>Haklarınız</h2>
      <p>Verilerinizi hesap ayarlarından indirebilir veya hesabınızı silebilirsiniz. Ayrıntılar için KVKK aydınlatma metnine bakın.</p>
    </>
  );
}

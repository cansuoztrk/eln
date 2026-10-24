export const metadata = { title: "Çerez politikası", alternates: { canonical: "/cerezler" } };

export default function CookiesPage() {
  return (
    <>
      <h1 className="font-display text-[30px] font-[680] tracking-tight">Çerez politikası ve tercihleri (taslak)</h1>
      <p>Yalnızca sitenin çalışması için zorunlu olan çerezi kullanırız. Analitik, reklam veya üçüncü taraf izleme çerezi yoktur; bu nedenle ayrıca onay istemiyoruz.</p>
      <table className="my-4 w-full text-[14px]">
        <thead>
          <tr className="border-b border-line text-left text-ink-3">
            <th className="py-2 font-medium">Ad</th>
            <th className="py-2 font-medium">Amaç</th>
            <th className="py-2 font-medium">Süre</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-line">
            <td className="py-2 font-mono">fr_session</td>
            <td className="py-2">Giriş yaptığınızda oturumu sürdürmek (zorunlu, HttpOnly)</td>
            <td className="py-2">30 gün</td>
          </tr>
        </tbody>
      </table>
      <h2>Tarayıcı depolaması</h2>
      <p>Tema tercihiniz, son aramalarınız ve hesapsız favorileriniz yalnızca tarayıcınızın yerel depolamasında tutulur ve sunucumuza gönderilmez. Tarayıcı ayarlarından silebilirsiniz.</p>
      <p>İleride isteğe bağlı bir çerez eklenirse, bu sayfa güncellenecek ve önceden onayınız istenecektir.</p>
    </>
  );
}

import { brand } from "@/config/brand";

export const metadata = { title: "KVKK aydınlatma metni", alternates: { canonical: "/kvkk" } };

export default function KvkkPage() {
  return (
    <>
      <h1 className="font-display text-[30px] font-[680] tracking-tight">KVKK aydınlatma metni (taslak)</h1>
      <p>6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, {brand.name} (“Platform”) olarak kişisel verilerinizi hangi amaçlarla işlediğimizi açıklarız.</p>
      <h2>Veri sorumlusu</h2>
      <p>[Şirket unvanı, adres ve iletişim bilgileri yayın öncesinde eklenmelidir.] İletişim: {brand.contactEmail}</p>
      <h2>İşlenen veriler ve amaçlar</h2>
      <ul>
        <li><strong>Hesap verileri</strong> (e-posta, isteğe bağlı ad, parola özeti): hesabın oluşturulması ve güvenli oturum yönetimi.</li>
        <li><strong>Tercih verileri</strong> (favoriler, fiyat/uçuş alarmları, kayıtlı aramalar, ilgi alanları, son görüntülenenler): istediğiniz hizmetin sunulması ve kişiselleştirilmiş fırsat akışı.</li>
        <li><strong>Bildirim verileri</strong>: fiyat alarmı ve (açık rızanızla) haftalık özet e-postalarının gönderilmesi.</li>
        <li><strong>Anonim kullanım verileri</strong>: mağaza bağlantısı tıklamaları, IP adresi saklanmadan, günlük değişen tek yönlü özetle ölçülür; kişiye bağlanamaz.</li>
        <li><strong>Güvenlik kayıtları</strong>: oturum zaman damgaları ve tarayıcı bilgisi (oturum yönetimi ve kötüye kullanımın önlenmesi).</li>
      </ul>
      <h2>Hukuki sebepler</h2>
      <p>Sözleşmenin kurulması ve ifası (KVKK m.5/2-c), meşru menfaat (m.5/2-f) ve pazarlama niteliğindeki haftalık özet için açık rıza (m.5/1).</p>
      <h2>Aktarım</h2>
      <p>Veriler; barındırma, veritabanı ve e-posta gönderim hizmet sağlayıcılarıyla, yalnızca hizmetin sunulması için gerekli ölçüde paylaşılır. [Sağlayıcıların listesi ve yurt dışı aktarım durumu yayın öncesinde netleştirilmelidir.]</p>
      <h2>Saklama süresi</h2>
      <p>Hesap verileri hesap silinene kadar; oturum kayıtları en fazla 30 gün; gönderilen e-postaların kuyruk kayıtları 60 gün; anonim tıklama kayıtları (IP adresi içermez, günlük değişen özetle) 13 ay saklanır ve ardından otomatik silinir. Hesabınızı sildiğinizde e-posta kuyruğundaki kayıtlarınız da hemen silinir.</p>
      <h2>Haklarınız (KVKK m.11)</h2>
      <p>Verilerinize erişme, düzeltme, silme ve itiraz haklarına sahipsiniz. Hesap ayarlarından verilerinizin bir kopyasını indirebilir ve hesabınızı tamamen silebilirsiniz.</p>
    </>
  );
}

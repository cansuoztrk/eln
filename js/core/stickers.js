/* Eln'in Krallığı — çıkartma albümü (başarımlar) */
(function () {
  'use strict';
  const K = window.K;

  const DEFS = [
    { id: 'ilk-adim', name: 'İlk Adım', hint: 'Kalenin kapısını aç', icon: 'bow', color: '#FFD6E5' },
    { id: 'masal', name: 'Masal Okuru', hint: 'İki Kule Masalı\'nı sonuna kadar oku', icon: 'book', color: '#FFE9B8' },
    { id: 'gartic', name: 'Gartic Efsanesi', hint: 'Gartic Odası\'nda 5 kelime bil', icon: 'pencil', color: '#D8F5E8' },
    { id: 'ressam', name: 'Ressam Prenses', hint: 'Bir çizimini kaydet', icon: 'palette', color: '#E6DCFF' },
    { id: 'angela', name: 'Angela\'nın Arkadaşı', hint: 'Angela ile 10 kez oyna', icon: 'angela', color: '#D6F1FF' },
    { id: 'mektup', name: 'Mektup Kurdu', hint: '5 mektup aç', icon: 'letter', color: '#FFD6E5' },
    { id: 'sebep', name: 'Sebep Avcısı', hint: '30 sebep oku', icon: 'cards', color: '#E6DCFF' },
    { id: 'ogretmen', name: 'Öğretmen Eln', hint: 'Ödevdeki bütün hataları bul', icon: 'apple', color: '#FFE0E0' },
    { id: 'karne', name: 'Takdir Belgesi', hint: 'Aşk Sınavı\'ndan takdir al', icon: 'cap', color: '#FFE9B8' },
    { id: 'pilot', name: 'Pilot Kitty', hint: 'Bakü\'ye kadar uç', icon: 'plane', color: '#D6F1FF' },
    { id: 'dilek', name: 'Dilek Tutan', hint: 'Kayan bir yıldıza dilek tut', icon: 'star', color: '#FFF3C4' },
    { id: 'takimyildiz', name: 'Yıldız Haritacısı', hint: 'Aşk takımyıldızını tamamla', icon: 'moon', color: '#E0DBFF' },
    { id: 'muzisyen', name: 'Minik Müzisyen', hint: 'Piyanoda şarkıyı baştan sona çal', icon: 'music', color: '#FFD6E5' },
    { id: 'kupon', name: 'Kupon Avcısı', hint: 'Bir aşk kuponu kullan', icon: 'ticket', color: '#FFF3C4' },
    { id: 'hayal', name: 'Hayalperest', hint: 'Hayal listesine kendi hayalini ekle', icon: 'list', color: '#D8F5E8' },
    { id: 'sarilma', name: 'Sarılma Ustası', hint: '3 saniye boyunca sarıl', icon: 'hug', color: '#FFD6E5' },
    { id: 'mum', name: 'Dileğin Kabul Olsun', hint: 'Pastanın mumlarını üfle', icon: 'cake', color: '#FFE9B8' },
    { id: 'gece', name: 'Gece Kuşu', hint: 'Gece yarısından sonra uğra', icon: 'owl', color: '#E0DBFF' },
    { id: 'sabah', name: 'Erken Kalkan Prenses', hint: 'Sabah 8\'den önce uğra', icon: 'sun', color: '#FFF3C4' },
    { id: 'sadik', name: 'Sadık Prenses', hint: 'Kaleye 7 farklı gün uğra', icon: 'crown', color: '#FFE9B8' },
    { id: 'yirmibir', name: 'Ayın 21\'i', hint: 'Herhangi bir ayın 21\'inde uğra', icon: 'calendar', color: '#FFD6E5' },
    { id: 'gizli', name: 'Gizli Kapı', hint: 'Kalede saklı bir sırrı bul', icon: 'key', color: '#D6F1FF' },
    { id: 'son', name: 'Sonsuza Kadar', hint: 'Son Sayfa\'daki soruya cevap ver', icon: 'heart', color: '#FFE0E0' },
    { id: 'arsiv', name: 'Sohbet Arşivcisi', hint: 'Sohbetimizden\'in bütün bölümlerini izle', icon: 'chat', color: '#E6DCFF' },
    { id: 'duvar', name: 'Duvar Yazarı', hint: 'Bakü\'deki İzlerin odasında duvara not as', icon: 'note', color: '#FFF3C4' },
    { id: 'portre', name: 'Galeri Gezgini', hint: 'Bütün portrelere yakından bak', icon: 'frame', color: '#FFE9B8' },
    { id: 'anilar', name: 'Anılar', hint: 'Bizim şarkımızı çal', icon: 'vinyl', color: '#FFD6E5' },
    { id: 'kopus', name: 'Gizli Kulübe', hint: 'Kalede saklı bir kulübe var...', icon: 'paw', color: '#FFE0E0' },
    { id: 'soru', name: 'Soru Kutusu', hint: '7 günün sorusunu cevapla', icon: 'question', color: '#FFF3C4' },
    { id: 'gazete', name: 'Gazete Okuru', hint: 'Kitty Gazetesi\'ni oku', icon: 'news', color: '#E6DCFF' },
    { id: 'yildiz', name: 'Gökyüzü Arşivcisi', hint: 'Tanıştığımız gecenin gökyüzüne bak', icon: 'sky', color: '#E0DBFF' },
    { id: 'kapsul', name: 'Geleceğe Mektup', hint: 'Zaman kapsülüne bir mektup bırak', icon: 'jar', color: '#D6F1FF' },
    { id: 'telsiz', name: 'Telsizci', hint: 'Telsizden bir kalp gönder', icon: 'radio', color: '#FFD6E5' },
    { id: 'ozet', name: 'Bizim Özetimiz', hint: 'Özetimizi sonuna kadar izle', icon: 'story', color: '#E6DCFF' },
    { id: 'takvim', name: 'İki Takvim', hint: 'Kendi dersini takvime ekle', icon: 'week', color: '#DDEBFF' },
    { id: 'kiler', name: 'Zaman Turisti', hint: 'Kilerdeki kapıdan 7 farklı güne in', icon: 'door', color: '#F3E3CF' },
    { id: 'zaman', name: 'Zaman Yolcusu', hint: 'Zaman Yolcusu\'nun yedi anının hepsine in', icon: 'hourglass', color: '#EFE0C8' },
    { id: 'zambak', name: 'Zambak Bahçıvanı', hint: 'İlk zambağını açtır', icon: 'lily', color: '#FFE6F0' },
    { id: 'guvercin', name: 'Güvercin Postacısı', hint: 'Bir güvercin uçur', icon: 'pigeon', color: '#E6F2FF' },
    { id: 'labirent', name: 'Sende Kaybolan', hint: 'Kalp labirentinin ortasına var', icon: 'maze', color: '#FFE0EC' },
    { id: 'dans', name: 'Pistin Yıldızı', hint: 'Dans pistinde %60\'ı geç', icon: 'dance', color: '#EDE3FF' },
    { id: 'kulup', name: 'Kulüp Üyesi', hint: 'İzleme Kulübü\'nde sekiz bölümün hepsini birlikte bitir', icon: 'film', color: '#E4E0F7' },
    { id: 'gece', name: 'Uykucu Prenses', hint: 'Gece Lambası\'nda "uyuyorum" de', icon: 'moon', color: '#DCD6F7' },
    { id: 'hazine', name: 'Hazine Avcısı', hint: 'Dokuz altın anahtarı bul, sandığı aç', icon: 'key', color: '#FFF1C9' },
    { id: 'kartpostal', name: 'Kartpostalcı', hint: 'Bir kartpostal gönder', icon: 'frame', color: '#FFE9D6' },
    { id: 'kumbara', name: 'Bilet Hazır', hint: 'Bilet Kumbarası\'nı birlikte doldurun', icon: 'plane', color: '#E6F4FF', bonus: true },
    { id: 'dakika', name: '21:21', hint: 'Aynı dakikada kalbe basıp ilk yıldızı yakın', icon: 'star', color: '#E0DBFF' },
    { id: 'kurdele', name: 'Kurdele', hint: 'Kalenin kapısındaki kurdeleyi kes', icon: 'bow', color: '#FFD6E5', bonus: true },
    { id: 'bilet', name: 'Biniş Kartı', hint: 'Zarftaki biniş kartını aç', icon: 'plane', color: '#DDF1FF', bonus: true },
    { id: 'devam', name: 'Masalcı', hint: 'Masalın Devamı\'na ilk cümleni yaz', icon: 'book', color: '#FFE3EE' },
    { id: 'nezaman', name: 'Tarih Belli', hint: 'Ne Zaman? takviminde ikinizin de kabul ettiği bir hedef seçin', icon: 'week', color: '#FFF0C9', bonus: true },
    { id: 'duvar', name: 'Kilit Ekranı', hint: 'Kendi kilit ekranını kaydet', icon: 'frame', color: '#E8E0FF', bonus: true },
    { id: 'gunses', name: 'Günün Sesi', hint: 'Günün Sesi\'ne ilk sesini bırak', icon: 'mic', color: '#FFE0EC' },
    { id: 'novruz', name: 'Novruz', hint: 'Bayram sabahı səməniye kırmızı kurdeleyi bağla', icon: 'lily', color: '#DDF5E6', bonus: true },
    { id: 'kacis', name: 'Kuleden Kaçış', hint: 'Kilitli Kule\'yi birlikte aç', icon: 'key', color: '#E6E0FF' },
    { id: 'gunluk', name: 'Bakü Günlüğü', hint: 'Bakü Günlüğü\'ne ilk fotoğrafı ekle', icon: 'camera', color: '#FFE9D6', bonus: true },
    { id: 'kalkan', name: 'Şans Tılsımı', hint: 'Sınav Kalkanı\'ndan bir şans tılsımı gönder', icon: 'cap', color: '#E3F0FF', bonus: true },
    { id: 'tur', name: 'Kale Rehberi', hint: 'Kitty\'nin kale turunu sonuna kadar gez', icon: 'crown', color: '#FFF3C4', bonus: true },
    { id: 'okul', name: 'Nərd Okulu', hint: 'Nərd Okulu\'nun bütün derslerini bitir', icon: 'cap', color: '#FFE3E3', bonus: true },
    { id: 'sinema', name: 'İlk Gösterim', hint: 'Bizim Filmimiz\'i jenerik sonrasına kadar izle', icon: 'clapper', color: '#E9D9FF', bonus: true },
    { id: 'kabin', name: 'Dört Kare', hint: 'Fotoğraf Kabini\'nde dört kare çek', icon: 'camera', color: '#FFE0EC' },
    { id: 'nerd', name: 'Şeş Beş', hint: 'Nərdde bir oyun kazan', icon: 'dice', color: '#FFE3E3' },
    { id: 'sofra', name: 'Aynı Sofra', hint: 'Aynı Sofra\'da tabağını göster', icon: 'pot', color: '#FFEBD9', bonus: true },
    { id: 'ilkler', name: 'İlk Mühür', hint: 'İlklerimiz\'de bir mührü birlikte aç', icon: 'first', color: '#FFF1C9', bonus: true },
    { id: 'hava', name: 'Şemsiye', hint: 'Kalbin Hava Durumu\'ndan bir paket gönder', icon: 'cloud', color: '#DDF0FF', bonus: true },
    { id: 'randevu', name: 'Dört Dakika', hint: 'Randevu Gecesi\'nde dört dakika göz göze bakın', icon: 'candle', color: '#FFE0D1', bonus: true },
    { id: 'ev', name: 'Ev Sahibi', hint: 'Hayalimizdeki Ev\'e beş eşya koy', icon: 'house', color: '#FFE6EF', bonus: true },
    { id: 'hikaye', name: 'İlk Hikâye', hint: 'Ana salondan bir hikâye paylaş', icon: 'camera', color: '#FFE0EC', bonus: true },
    { id: 'durt', name: 'Tık Tık', hint: 'Kalede onu dürt', icon: 'heart', color: '#FFD6E5', bonus: true },
    { id: 'ara', name: 'Kitty\'nin Dedektifi', hint: 'Kitty\'ye Sor\'u beş kez aç', icon: 'question', color: '#E6DCFF', bonus: true },
    { id: 'gungun', name: 'Gün Gün', hint: 'Gün Gün Biz\'de bir güne dokun', icon: 'calendar', color: '#FFD9E6', bonus: true },
    { id: 'kalpmenu', name: 'Kalbin Sesi', hint: 'Alt menüdeki kalpten ona bir şey gönder', icon: 'heart', color: '#FFD6E5', bonus: true },
    { id: 'alev', name: 'Alevimiz', hint: 'Yedi gün aralıksız ikiniz de kaleye uğrayın', icon: 'sun', color: '#FFE3C2', bonus: true },
    { id: 'radyo', name: 'Aynı Saniye', hint: 'Kale Radyosu\'nda bir şarkı aç', icon: 'vinyl', color: '#E9E0FF', bonus: true },
    { id: 'pinpon', name: 'İki Kıyı', hint: 'Onunla bir pinpon maçı bitir', icon: 'heart', color: '#DDF0FF', bonus: true },
    { id: 'kelime', name: 'Kelime Avcısı', hint: 'Günün Kelimesi\'ni bul', icon: 'cards', color: '#E3F6EC', bonus: true },
    { id: 'surpriz', name: 'Zaman Postacısı', hint: 'Ona zamanlı bir sürpriz not bırak', icon: 'hourglass', color: '#FFF1C9', bonus: true },
    { id: 'baris', name: 'Altın Damar', hint: 'Küsünce barışın: Barış Töreni', icon: 'kintsugi', color: '#FFF1C9', bonus: true },
    { id: 'kmektup', name: 'Kalpten', hint: 'Barış Köprüsü\'nde kalpten bir mektup yaz', icon: 'letter', color: '#FFE0EC', bonus: true },
    { id: 'antlasma', name: 'Antlaşma', hint: 'Barış Antlaşması\'nda bir maddeyi imzala', icon: 'note', color: '#F1E6D2', bonus: true },
    { id: 'kedi', name: 'Kedi Ailesi', hint: 'Kalenin kapısındaki yavruyu sahiplen', icon: 'paw', color: '#FFEFD9', bonus: true },
    { id: 'kavanoz', name: 'İlk Kalp', hint: 'Kalp Kavanozu\'na bir kalp at', icon: 'jar', color: '#FFE3EE', bonus: true },
    { id: 'cicek', name: 'Tam Gün', hint: 'İkinizin de Günün Çiçeği açsın', icon: 'lily', color: '#E3F6EC', bonus: true },
    { id: 'telesekreter', name: 'Sesim Sende', hint: 'Telesekretere bir sesli mesaj bırak', icon: 'radio', color: '#FFE0EA', bonus: true },
    { id: 'tahmin', name: 'Seni Tanıyorum', hint: 'Tahmin Et Beni\'de bir soru cevapla', icon: 'question', color: '#E6F0FF', bonus: true },
    { id: 'telefon', name: 'Cebimde Kale', hint: 'Telefonuna kale bildirimlerini kur', icon: 'bow', color: '#E3F0FF', bonus: true },
    { id: 'kare', name: 'İki Şehir Bir Kare', hint: 'Günün Karesi\'ne fotoğrafını koy', icon: 'camera', color: '#FFE9D6', bonus: true },
    { id: 'ses', name: 'İlk Ses', hint: 'Kalede bir sesli not bul ve dinle', icon: 'mic', color: '#FFE0E0', bonus: true },
    { id: 'aykardesi', name: 'Aynı Ay', hint: 'Bir dolunay gecesi aya bak', icon: 'moon', color: '#FFF3C4', bonus: true },
    { id: 'film', name: 'Film Gecesi', hint: 'Bir film gecesi başlat', icon: 'film', color: '#E0DBFF', bonus: true },
    { id: 'kis', name: 'Kış Masalı', hint: 'Kış takviminden 10 kapı aç (Aralık)', icon: 'snow', color: '#D6F1FF', bonus: true },
    { id: 'hediyeler', name: '23 Kutu', hint: 'Doğum gününde 23 kutunun hepsini aç', icon: 'gift', color: '#FFD6E5', bonus: true },
    { id: 'ters', name: 'Ters Kale', hint: 'Onun doğum gününe bir kart hazırla (Kasım)', icon: 'party', color: '#FFE9B8', bonus: true },
    { id: 'kapi', name: 'Gerçek Kapı', hint: 'Bu kapı gerçek dünyadan açılır', icon: 'key', color: '#FFE9B8', bonus: true },
    { id: 'kralice', name: 'Kraliçe', hint: 'Gizli kulübedeki dostunu en üst seviyeye çıkar', icon: 'crown', color: '#FFE9B8', bonus: true },
    { id: 'bside', name: 'B Yüzü', hint: 'Plağı çevir, onun şarkısını çal', icon: 'vinyl', color: '#FFE0EC', bonus: true },
    { id: 'pembe', name: 'Pembenin Tonları', hint: 'Kalenin rengini değiştir', icon: 'palette', color: '#FFD0E1', bonus: true },
    { id: 'minnet', name: 'Minnettarım', hint: 'Minnet Defteri\'ne bir cümle yaz', icon: 'note', color: '#FFF4D9', bonus: true },
    { id: 'endise', name: 'Güvenli Liman', hint: 'İçi sıkışan birine güven ver', icon: 'heart', color: '#E0EEFF', bonus: true },
    { id: 'gunbatimi', name: 'Aynı Güneş', hint: 'Güneşi birlikte uğurlayın', icon: 'sun', color: '#FFE0C7', bonus: true },
    { id: 'gorev', name: 'Görev Tamam', hint: 'Haftanın görevini ikiniz de bitirin', icon: 'star', color: '#FFF1C9', bonus: true },
    { id: 'onyil', name: '2036', hint: 'On Yıl Sonra kutusuna bir not bırak', icon: 'hourglass', color: '#E6E0FF', bonus: true },
    { id: 'hayalyap', name: 'Hayal Gerçek', hint: 'Hayallerimizden birine "Yaptık!" deyin', icon: 'list', color: '#E3F6EC', bonus: true },
    { id: 'uyku', name: 'Masal Dinleyicisi', hint: 'Uyku Masalları\'ndan birini sonuna kadar dinle', icon: 'moon', color: '#DCD6F7', bonus: true },
    { id: 'uykubiz', name: 'Aynı Gece', hint: 'İkiniz de aynı gece "uyuyorum" deyin', icon: 'moon', color: '#E0DBFF', bonus: true },
    { id: 'harita', name: 'Kâşif', hint: 'Haritamıza bir iğne tak', icon: 'map', color: '#DDF0FF', bonus: true },
    { id: 'yarisma', name: 'Yarışma Kraliçesi', hint: 'Bilgi Yarışması\'nı kazan', icon: 'crown', color: '#FFE9B8', bonus: true },
    { id: 'amiral', name: 'Amiral', hint: 'Amiral Battı\'yı kazan', icon: 'flag', color: '#D6ECFF', bonus: true },
    { id: 'opucuk', name: 'Ruj İzi', hint: 'Kalp menüsünden uzaktan bir öpücük gönder', icon: 'heart', color: '#FFD0DC', bonus: true },
    { id: 'nabiz', name: 'Aynı Ritim', hint: 'Kalp atışını ona gönder', icon: 'heart', color: '#FFDCE0', bonus: true },
    { id: 'alarm', name: 'Günaydın Sesi', hint: 'Sesimle Uyan\'da bir günaydın kaydet ya da dinle', icon: 'sun', color: '#FFF0C8', bonus: true },
    { id: 'soz', name: 'Sözünün Eri', hint: 'Söz Defteri\'nde bir sözünü tut', icon: 'key', color: '#FFE3E8', bonus: true },
    { id: 'iyilik', name: 'Küçük İyilik', hint: 'Bugün Senin İçin\'deki iyiliği yap', icon: 'star', color: '#FFF3C4', bonus: true },
    { id: 'iyilik7', name: 'İyilik Haftası', hint: 'Yedi gün üst üste bir iyilik yap', icon: 'star', color: '#FFE9A8', bonus: true },
    { id: 'aynigok', name: 'Aynı Gökyüzü', hint: 'İki şehrin havası aynı olsun', icon: 'sky', color: '#DDEBFF', bonus: true },
    { id: 'yedek', name: 'Arşivci', hint: 'Kale Yedeği\'nden bir dosya indir', icon: 'house', color: '#E3F0FF', bonus: true },
    { id: 'widget', name: 'Ana Ekranda', hint: 'Kale Widget\'ının kodunu kopyala', icon: 'house', color: '#FFE3EE', bonus: true },
    { id: 'bulmaca', name: 'Şifre Kırıcı', hint: 'Haftanın şifreli mektubunu birlikte çözün', icon: 'letter', color: '#EADCFF', bonus: true },
    { id: 'emojisarki', name: 'Kulak Dolgunu', hint: 'Emoji Şarkı\'da bir şarkıyı bil', icon: 'music', color: '#FFEACC', bonus: true },
    { id: 'bizfm', name: 'Sadık Dinleyici', hint: 'Biz FM\'in bir yayınını sonuna kadar dinle', icon: 'radio', color: '#FFDCE6', bonus: true },
    { id: 'prenses', name: 'Hikâyeci', hint: 'Prenses ve User155\'te bir bölümü birlikte bitirin', icon: 'story', color: '#FFE0EE', bonus: true },
    { id: 'atolye', name: 'Ressam', hint: 'Tema Atölyesi\'nde kaleni boya', icon: 'palette', color: '#F1E6FF', bonus: true },
    { id: 'dock', name: 'Benim Dock\'um', hint: 'Alttaki çubuğu kendine göre düzenle', icon: 'heart', color: '#FFE3EC', bonus: true },
    { id: 'kesit', name: 'Kule Gezgini', hint: 'Kale haritasında bir kulenin içine gir', icon: 'house', color: '#FFF0D6', bonus: true },
    { id: 'birliktegez', name: 'El Ele Gezinti', hint: 'Aynı odada onun parmağını gör', icon: 'hugs', color: '#FFE0EA', bonus: true },
    { id: 'aynisaniye', name: 'Kayan Yıldız', hint: 'İkiniz aynı saniyede kalbe dokunun', icon: 'star', color: '#E8E2FF', bonus: true },
    { id: 'kelimebulutu', name: 'Kelime Avcısı', hint: 'Kelime Bulutumuz\'a bak', icon: 'cloud', color: '#FDE6F0', bonus: true },
    { id: 'yirmibirsahne', name: 'Işık Köprüsü', hint: 'Bir 21\'inde sahneyi aç', icon: 'bridge', color: '#FFE6EF', bonus: true },
    { id: 'nfc', name: 'Sihirli Etiket', hint: 'NFC Anahtarlık kurulum bilgilerini kopyala', icon: 'key', color: '#E6F4FF', bonus: true },
    { id: 'calmalistesi', name: 'DJ', hint: 'Şarkı Defteri\'ni çalma listesi olarak kopyala', icon: 'music', color: '#EDE3FF', bonus: true },
    { id: 'kedikart', name: 'Kartpostal Albümü', hint: 'Kedimizin ilk kartpostalını al', icon: 'paw', color: '#FFEBD2', bonus: true },
    { id: 'muhur', name: 'Kırılan Mühür', hint: 'Bu çıkartma ilk buluşmada açılır', icon: 'hugs', color: '#FFD6E5', bonus: true },
  ];
  const REQUIRED = DEFS.filter((d) => !d.bonus);

  const got = () => K.store.get('stickers', {});

  function art(def, cls = '') {
    return `<span class="sticker ${cls}" style="--st:${def.color}">${K.art.icon(def.icon)}</span>`;
  }

  function award(id) {
    const all = got();
    if (all[id]) return false;
    const def = DEFS.find((d) => d.id === id);
    if (!def) return false;
    all[id] = K.time.todayKey();
    K.store.set('stickers', all);
    K.audio.sfx.chime();
    K.fx.toast(`<b>Yeni çıkartma!</b> ${K.esc(def.name)}`, { icon: art(def, 'mini'), cls: 'toast-sticker', duration: 4200 });
    K.emit('sticker', id);
    if (!def.bonus && REQUIRED.every((d) => all[d.id])) {
      setTimeout(() => {
        K.fx.confetti({ count: 160 });
        K.fx.toast('<b>Bütün çıkartmaları topladın!</b> Albümde gizli bir mektup açıldı.', { icon: K.art.icon('key'), duration: 6000 });
      }, 1600);
    }
    return true;
  }

  // Sayaç tabanlı başarımlar için: bump('angela', 10) → 10'a ulaşınca verir
  function bump(key, goal, stickerId) {
    const counts = K.store.get('counts', {});
    counts[key] = (counts[key] || 0) + 1;
    K.store.set('counts', counts);
    if (counts[key] >= goal) award(stickerId || key);
    return counts[key];
  }
  const count = (key) => K.store.get('counts', {})[key] || 0;

  const done = () => REQUIRED.filter((d) => got()[d.id]).length;
  K.stickers = { DEFS, got, has: (id) => Boolean(got()[id]), award, bump, count, art, total: REQUIRED.length, done, complete: () => done() === REQUIRED.length };
})();

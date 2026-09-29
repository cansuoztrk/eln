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

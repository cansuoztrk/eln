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
  ];

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
    if (Object.keys(all).length === DEFS.length) {
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

  K.stickers = { DEFS, got, has: (id) => Boolean(got()[id]), award, bump, count, art, total: DEFS.length };
})();

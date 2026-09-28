/*
  ============================================================
   ELN'İN KRALLIĞI — HERKESE AÇIK AYARLAR
  ============================================================
  Bu depo herkese açık olduğu için burada kişisel hiçbir şey yok.
  Sitenin bütün yazıları, fotoğrafları ve mesaj alıntıları
  assets/vault/ içinde ŞİFRELİ duruyor ve kapıdaki soru doğru
  cevaplanınca tarayıcıda çözülüyor. (Bkz. tools/vault.mjs, README.)
  ============================================================
*/
window.ELN = {
  config: {
    herName: 'Eln',
    herNick: 'eln',
    myNick: 'User155',
    herCity: 'Bakü',
    myCity: 'İstanbul',
    tzBaku: 4,
    tzIstanbul: 3,
    distanceKm: 1758,
    coords: { baku: [40.4093, 49.8671], istanbul: [41.0082, 28.9784] },
    gateQuestion: 'Bakü\'deki not duvarına ikimizin adını nasıl yazmıştın?',
    gateHints: [
      'Hmm, Kitty emin olamadı. Bir daha dene.',
      'İpucu: Rengârenk notlarla kaplı o duvarı hatırla. Pembe bir not vardı...',
      'Son ipucu: İkimizin şirin adları, arada bir kalp.',
    ],
    ntfyTopic: '',
    liveTopic: '',
    voiceFiles: {},
  },
  // Aşağıdakiler kasadan dolar
  story: [],
  notes: ['Bugün de dünyanın en güzel prensesi sensin.'],
  fortunes: ['Bugün güzel bir gün olacak.'],
  moods: [],
  letters: [],
  reasons: [],
  angela: { greet: ['Merhaba!'], chips: [], rules: [], fallback: ['Miyav.'], doing: { night: [''], morning: [''], day: [''], evening: [''] } },
  dictionary: [],
  azNotebook: [],
  essay: { title: '', student: '', text: '' },
  quiz: [],
  bucket: [],
  coupons: [],
  portraits: [],
  traces: [],
  wallNotes: [],
  chats: [],
  kopus: { note: {}, treats: [], certificate: [], commands: {} },
  firstHug: { intro: [], plan: [], sealedTeaser: '' },
  songLetter: [],
  memories: [],
  photos: [],
  playlist: [],
  prologue: [],
  finalLetter: [],
  finalSign: '',
  finalQuestion: '',
  noButtonTexts: ['Hayır'],
  secretLetter: [],
  voices: [],
  questions: [],
  gazette: { headlines: [], stars: [], tips: [] },
  advent: [],
  birthdayGifts: [],
  skies: [],
  films: [],
  giftDoor: { title: '', body: [], sign: '' },
  wrapClosers: [],
  capsules: [],
};

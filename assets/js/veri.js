/* Kızıl Kapsül — oyun verisi: roller, kelime bankası, istasyon olayları, bot isimleri ve replikler. */
(function (kok) {
  'use strict';
  const KK = (kok.KK = kok.KK || {});

  KK.ROLLER = {
    murettebat: {
      ad: 'Mürettebat', takim: 'masum', etiket: 'MASUM',
      kisa: 'Yalancıları yakala, kapsüle sadece temizleri bindir.',
      guc: 'Özel gücün yok. Silahın hafızan ve mantığın.',
      ipuclari: [
        'Kabinde duyduğun kelimeyi aynen söyle; senin kelimen doğru kelimedir.',
        'Şalter odasında şalterini aç. Kırmızı bırakan her şalter oksijeni hızlandırır.',
        'Seyir Defteri\'ni oku: kim ne dedi, panel kaç yeşil gösterdi?'
      ]
    },
    suikastci: {
      ad: 'Suikastçı', takim: 'hain', etiket: 'ANA HAİN',
      kisa: 'Yalan söyle, görevleri boz, kapsüle sız.',
      guc: 'O tur oylama yapıldıysa gece 1 masumu öldürürsün.',
      ipuclari: [
        'Kabinde hain kelimesini duyarsın. Masumların kelimesini tahmin edip onu söyleyebilirsin.',
        'Şalteri hep kırmızı bırakırsan sayılar seni ele verir. Bazen yeşil yap.',
        'Gece, sana en çok yaklaşan dedektifi ya da halkın en güvendiği kişiyi hedefle.'
      ]
    },
    yanci: {
      ad: 'Yancı', takim: 'hain', etiket: 'HAİN YAMAĞI',
      kisa: 'Suikastçı\'yı koru, kafaları karıştır.',
      guc: 'Suikastçı\'yı tanırsın. Öldüremezsin ama görev bozabilirsin.',
      ipuclari: [
        'Suikastçı şüphe çekerse onu savun ya da dikkati bir masuma çevir.',
        'Telefonu sen açarsan bilgiyi çarpıtabilirsin.',
        'Finalde kapsüle tek bir hain binmesi yeter. O hain sen de olabilirsin.'
      ]
    },
    halusinatif: {
      ad: 'Halüsinatif', takim: 'masum', etiket: 'MASUM · BOZUK ALGI',
      kisa: 'Masumsun ama algıların seni yanıltıyor.',
      guc: 'Kabin Laneti: şifreyi alakasız duyarsın. Şalter Laneti: renkleri ters görürsün.',
      ipuclari: [
        'Kelimen bambaşka çıktıysa sorun sende olabilir. Bunu açıkça söylemek seni kurtarabilir.',
        'Şalterin "zaten yeşil" görünüyorsa, gerçekte kırmızı olabilir.',
        'Masum olduğunu kanıtlamanın en iyi yolu telefondan gelecek bilgi.'
      ]
    },
    kaptan: {
      ad: 'Gizli Kaptan', takim: 'masum', etiket: 'OTORİTE',
      kisa: 'Her turun sonunda oylama açılıp açılmayacağına sen karar verirsin.',
      guc: 'En az 1 kez oylama başlatırsan finalde 1. koltuğu tek başına seçersin.',
      ipuclari: [
        'Oylama gece Suikastçı\'yı serbest bırakır. Riski bilgiyle dengele.',
        'Hiç oylama açmazsan finalde söz hakkın olmaz; 3 koltuğu da halk seçer.',
        'Kimliğini belli etme. Suikastçı seni bulursa ilk hedef sen olursun.'
      ]
    },
    medik: {
      ad: 'Medik', takim: 'masum', etiket: 'GENİŞLEME ROLÜ',
      kisa: 'Gece bir kişiyi koruyarak Suikastçı\'yı boşa çıkarırsın.',
      guc: 'Oylama yapılan gecelerde 1 kişiyi korursun; aynı kişiyi üst üste iki gece koruyamazsın.',
      ipuclari: [
        'Kurtardığın gece "saldırı püskürtüldü" duyurusu yapılır: Suikastçı hâlâ hayatta demektir.',
        'Halkın en güvendiği kişi Suikastçı\'nın da hedefidir.'
      ]
    }
  };

  KK.HAIN_ROLLER = ['suikastci', 'yanci'];

  // Kategori kelimeleri: masum ve hain aynı kategoriden farklı iki kelime duyar.
  KK.KATEGORILER = [
    { ad: 'Meyve', kelimeler: ['ELMA', 'ARMUT', 'AYVA', 'KİRAZ', 'ŞEFTALİ', 'ERİK', 'KAYISI'] },
    { ad: 'Gezegen', kelimeler: ['MARS', 'VENÜS', 'JÜPİTER', 'SATÜRN', 'MERKÜR', 'NEPTÜN', 'URANÜS'] },
    { ad: 'Hayvan', kelimeler: ['KEDİ', 'KÖPEK', 'TAVŞAN', 'SİNCAP', 'KİRPİ', 'TİLKİ', 'GELİNCİK'] },
    { ad: 'Alet', kelimeler: ['ÇEKİÇ', 'PENSE', 'TORNAVİDA', 'MATKAP', 'KERPETEN', 'TESTERE'] },
    { ad: 'İçecek', kelimeler: ['ÇAY', 'KAHVE', 'AYRAN', 'BOZA', 'SALEP', 'LİMONATA', 'ŞALGAM'] },
    { ad: 'Şehir', kelimeler: ['ANKARA', 'İZMİR', 'BURSA', 'KONYA', 'TRABZON', 'ESKİŞEHİR', 'MARDİN'] },
    { ad: 'Mobi', kelimeler: ['KANEPE', 'ABAJUR', 'ŞÖMİNE', 'AKVARYUM', 'HALI', 'PUF', 'TAHT'] },
    { ad: 'Çalgı', kelimeler: ['BAĞLAMA', 'KEMAN', 'DAVUL', 'NEY', 'KANUN', 'UD', 'DARBUKA'] },
    { ad: 'Yemek', kelimeler: ['MANTI', 'LAHMACUN', 'PİDE', 'KÖFTE', 'DOLMA', 'MENEMEN', 'BÖREK'] },
    { ad: 'Spor', kelimeler: ['FUTBOL', 'VOLEYBOL', 'TENİS', 'HENTBOL', 'BASKETBOL', 'GÜREŞ', 'OKÇULUK'] },
    { ad: 'Sayı', sayisal: true }
  ];

  // Halüsinatif'in duyduğu sanrı kelimeleri: hiçbir kategoriye ait değil.
  KK.SANRILAR = ['PENGUEN', 'TELESKOP', 'DENİZALTI', 'ŞEMSİYE', 'KAKTÜS', 'DİNOZOR', 'PİYANO',
    'BALON', 'DENİZYILDIZI', 'ROBOT', 'ÇAMAŞIR', 'FENER', 'KUMSAL', 'PAPATYA', 'ZEPLİN', 'KAPLUMBAĞA'];

  KK.OLAYLAR = [
    { id: 'sakin', ad: 'Sakin Vardiya', metin: 'İstasyon bu tur sessiz. Ek etki yok.', tip: 'notr', agirlik: 4 },
    { id: 'sizinti', ad: 'Oksijen Sızıntısı', metin: 'Tur sonunda O₂ ayrıca %8 düşer.', tip: 'kotu', agirlik: 2 },
    { id: 'yedek_tup', ad: 'Yedek Tüp', metin: 'Depoda yedek tüp bulundu. Tur sonunda O₂ %8 artar.', tip: 'iyi', agirlik: 1.6 },
    { id: 'parazit', ad: 'Radyo Paraziti', metin: 'Telefon hattı kesik. Bu tur istihbarat gelmez.', tip: 'kotu', agirlik: 1.4 },
    { id: 'cift_hat', ad: 'Çift Hat', metin: 'Telefon bu tur iki ayrı bilgi verir.', tip: 'iyi', agirlik: 1.4 },
    { id: 'guc_dalgasi', ad: 'Güç Dalgalanması', metin: 'Şalter odasına 3 yerine 4 kişi girer.', tip: 'notr', agirlik: 1.4 },
    { id: 'kamera', ad: 'Güvenlik Kamerası', metin: 'Şalter odasındaki bir kişinin şalter rengi herkese gösterilir.', tip: 'iyi', agirlik: 1.4 },
    { id: 'karantina', ad: 'Karantina Protokolü', metin: 'Kapılar kilitli. Bu gece oylama yapılsa da kimse ölmez.', tip: 'iyi', agirlik: 1.1 },
    { id: 'kizil_alarm', ad: 'Kızıl Alarm', metin: 'Bu tur oylama zorunlu. Zorunlu oylama Kaptan\'a yetki kazandırmaz.', tip: 'kotu', agirlik: 1 },
    { id: 'ek_kabin', ad: 'Çift Kabin', metin: 'Teyit kabinine iki ayrı çift girer.', tip: 'iyi', agirlik: 1.1 }
  ];

  KK.BOT_ISIMLERI = ['Pırıl.Kaptan', '-Lale-', 'xX.Deniz.Xx', 'MertBey', ':Ceren:', 'Efe.Habbo',
    'Ayaz.TR', 'PixelSu', 'Barış.', 'Nehir~', 'Kuzey.007', 'Elif.Ay', 'Tunç', 'MaviHız',
    'Doruk.', 'Ece.Sim', 'Yağmur*', 'KralKerem', 'Sude.Pix', 'Arda_X'];

  KK.KISILIKLER = {
    lider: { ad: 'Lider', on: ['Ekip, dinleyin:', 'Toparlayalım:', 'Arkadaşlar,', ''] },
    analitik: { ad: 'Analitik', on: ['Mantıken,', 'Verilere bakarsak,', 'Şöyle düşünelim:', ''] },
    agresif: { ad: 'Agresif', on: ['Net söylüyorum:', 'Bakın,', 'Ya arkadaşlar,', ''] },
    sakin: { ad: 'Sakin', on: ['Hmm,', 'Bence,', 'Emin değilim ama', ''] },
    saskin: { ad: 'Şaşkın', on: ['Ayy', 'Off ya', 'Yaa', 'Dur dur,'] }
  };

  // Replik bankası. {x} {y} {a} {b} {c}: oyuncu etiketi, {k1} {k2}: kelime, {g} {n} {s}: sayı.
  KK.REPLIK = {
    kabinEslesme: [
      'Kelimeler tuttu. {a} ve {b} şimdilik temiz.',
      'Aynı kelime! Bu ikisi aynı takımda gibi.',
      'Eşleşme var, biraz rahatladım.',
      'Tamam, {a} ile {b} birbirini doğruladı.'
    ],
    kabinEslesmeIcerden: [
      'Gördünüz mü? {x} ile aynı şeyi duyduk.',
      '{x} temiz, ben kefilim.',
      'Kelimemiz aynı çıktı, {x} ile içim rahat.'
    ],
    kabinYakin: [
      '**{k1}** ile **{k2}** yakın ama aynı değil. Biri hain kelimesi duymuş!',
      'Biri yalan söylüyor. Bence {x}.',
      'Yakın kelimeler... klasik hain işi. {x}\'e bakın.',
      'İkisinden biri hain. Benim oyum {x} yönünde.'
    ],
    kabinYakinIcerden: [
      'Ben **{k1}** duydum, kesin! {x} hain, başka açıklaması yok.',
      '{x} yalan söylüyor arkadaşlar. Bana **{k1}** fısıldandı.',
      'Benim kelimem **{k1}**. {x} farklı duymuşsa hain kelimesini duymuştur.'
    ],
    kabinAlakasiz: [
      '**{k2}** mi?! Bu kelime nereden çıktı?',
      'Biri halüsinasyon görüyor olabilir. {x} biraz tuhaf.',
      'Bu kadar alakasız bir kelime ya deliden çıkar ya da çok cesur bir hainden.',
      'Alakasız kelime. Bence {x} halüsinatif.'
    ],
    kabinAlakasizIcerden: [
      'Ben **{k1}** duydum. {x} bambaşka bir dünyada sanki.',
      '{x} benimle hiç alakası olmayan bir kelime söyledi. Halüsinatif olabilir.'
    ],
    kabinKendimAlakasiz: [
      'Dur... bana gerçekten **{k1}** dendi. Sorun bende olabilir mi?',
      'Valla ben **{k1}** duydum. Kafam mı karıştı?'
    ],
    salterTam: [
      'Bütün şalterler yeşil! Güzel iş.',
      'Panel tertemiz. Bu odada sabotaj yok gibi.',
      'Hepsi yeşil, oksijen biraz nefes aldı.'
    ],
    salterTutarli: [
      'Sayılar tutuyor: panel {g}/{n}. Kırmızıyı açıklayan kişi zaten belli.',
      'Söylenenler panelle uyumlu. Ama "basmadım" diyene bakmak lazım.'
    ],
    salterTutarsiz: [
      '{s} kişi "bastım" dedi ama panelde {g} yeşil var. Biri yalan söylüyor!',
      'Hesap tutmuyor! O odadan biri yalancı.',
      '{g}/{n} yeşil mi? O zaman biri bize masal anlatıyor.'
    ],
    salterIcerden: [
      'Ben bastım, yeşil olduğunu kendi gözümle gördüm. Demek ki {x} ya da {y}.',
      'Benim şalterim yeşil, eminim. Yalancı {x} ile {y} arasında.'
    ],
    salterIcerdenTek: [
      'Ben bastım, eminim. Geriye tek kişi kalıyor: {x}.',
      'Kendi şalterimi yeşil yaptım. Kırmızıyı bırakan {x}.'
    ],
    salterZaten: [
      '{x} "zaten yeşildi" diyor... Şalterler hep kırmızı başlar. Halüsinatif mi, yalancı mı?',
      'Şalterler kırmızı başlar. {x} yeşil gördüyse ya gözleri bozuk ya da yalan söylüyor.'
    ],
    salterTuhaf: [
      '{x} bastığında kırmızıya döndüğünü söylüyor. Bu tam halüsinatif belirtisi.',
      'Bastım ama kırmızı oldu mu? {x} renkleri ters görüyor olabilir.'
    ],
    telefonYalanTepki: [
      'YALAN! Ben masumum! {c} hain olmalı!',
      '{c} şu an açık açık yalan söylüyor. Telefon bunu dememiş olamaz.',
      'Arkadaşlar {c}\'nin dediği yalan. Ben temizim, hain o!'
    ],
    telefonInkar: [
      'Saçmalık! {c} yalan söylüyor.',
      'Ben mi? Telefonu açan kişiye bakın asıl.',
      'Bu bilgi uydurma. {c} hain.'
    ],
    telefonTesekkur: [
      'Teşekkürler, temiz olduğumu biliyordum.',
      'Sonunda biri doğruyu söyledi.',
      'Gördünüz, ben temizim.'
    ],
    telefonInanc: [
      'Telefon yalan söylemez. {x} gitmeli.',
      'Bilgi net: {x}. Daha ne bekliyoruz?'
    ],
    telefonSuphe: [
      'Telefonu açan {c}. Ona ne kadar güveniyoruz ki?',
      'Bu bilgiyi {c} söylüyor. {c} hainse her şey tersine döner.'
    ],
    kaptanOyla: [
      'Bence kesin {x}. Kaptan oylamayı açmalı.',
      '{x} için oylama istiyorum.',
      'Kanıtlar {x}\'i gösteriyor. Oylayalım.'
    ],
    kaptanSuphe: [
      '{x} bana şüpheli geliyor ama emin değilim.',
      'Bir tek {x} kafama takılıyor.',
      'Gözüm {x}\'de ama acele etmeyelim.'
    ],
    kaptanPas: [
      'Net bir şey yok. Pas geçelim, gece kimse ölmesin.',
      'Riskli. Yanlış kişiyi atarsak hem bir masum gider hem gece biri ölür.',
      'Bu tur bilgi topladık, oylamaya gerek yok bence.'
    ],
    kaptanSavun: [
      '{x} bence temiz, acele etmeyelim.',
      '{x}\'e yüklenmeyin, kanıt zayıf.',
      '{x}\'i atarsak büyük hata yaparız bence.'
    ],
    sabahOlum: [
      '{x} gitti... Suikastçı hâlâ aramızda.',
      'Hayır... {x}. Bunun hesabını soracağız.',
      '{x} her şeyi çözmüştü belki. Suikastçı bu yüzden onu seçti.'
    ],
    sabahSessiz: [
      'Kimse ölmedi! Yoksa Suikastçı\'yı mı attık?',
      'Sessiz bir gece... Suikastçı oylamayla gitmiş olabilir.'
    ],
    sabahKurtarma: [
      'Saldırı püskürtüldü! Suikastçı hâlâ içeride ama.',
      'Medik iş başında! Bu gece kimseyi alamadılar.'
    ],
    savunma: [
      'Ben mi? Saçmalama, ben masumum!',
      'Bana değil, {x}\'e bakın.',
      'Kanıtın ne? Boş suçlama bu.',
      'Kaydı okuyun, benim söylediklerim tutarlı.'
    ],
    katil: [
      'Katılıyorum, {x} şüpheli.',
      'Aynen, ben de {x} diyorum.',
      'Doğru söylüyor, {x} çok sessiz.'
    ],
    reddet: [
      'Bence {x} temiz, kanıtlar öyle diyor.',
      '{x} mi? Kayda bakınca pek sanmıyorum.',
      'Yanlış ağaca havlıyorsun, {x} değil.'
    ],
    tesekkurSavunma: [
      'Sağ ol, en azından biri mantıklı.',
      'Teşekkürler. Ben temizim, gerçekten.'
    ],
    insanaGuven: [
      'Sana güveniyorum, bu turu birlikte çözelim.',
      'Mantıklı konuşuyorsun.'
    ],
    saskinAra: [
      'Oksijen bitiyor, ben hâlâ kahve arıyorum :D',
      'Kapsülde cam kenarı benim, şimdiden söyleyeyim.',
      'Şalter neydi ya, ışık mı açıyoruz?',
      'Kimse beni öldürmesin lütfen, yeni kıyafet aldım.'
    ]
  };

  // Habbo sohbet kutusu için kısa duyurular (Kurucu Paneli).
  KK.DUYURU = {
    baslangic: [
      'KIZIL KAPSÜL başlıyor! Oksijen bitiyor, kapsülde 3 koltuk var. Rolünüz fısıltıyla geliyor.',
      'İstasyon alarmda! Aramızda sabotajcılar var. Rollerinizi fısıltı kutunuzda kontrol edin.'
    ],
    kabin: 'KABİN TURU: {a} ve {b} teyit kabinine! Size bir şifre fısıldayacağım. Aynı anda söyleyin.',
    salter: 'ŞALTER ODASI: {kisiler} sırayla odaya girsin. Şalterinizi açın. Panel sonucu sonra.',
    salterSonuc: 'ANA PANEL: {n} şalterden {g} tanesi YEŞİL. Kim basmadı?',
    telefon: 'TELEFON ÇALIYOR! Halk kimin açacağını seçsin. Bilgi bir kişiye fısıldanacak.',
    kaptan: 'KAPTAN\'IN KARARI: Gizli Kaptan, bana fısıltıyla PAS ya da OYLAMA yazsın.',
    pas: 'Kaptan PAS geçti. Bu tur oylama yok, gece kimse ölmeyecek.',
    oylama: 'Kaptan OYLAMA başlattı! Sandık kuruldu. En çok oyu alan istasyondan atılır.',
    gece: 'Işıklar sönüyor... Suikastçı, hedefini bana fısıldasın.',
    sabahOlum: 'Sabah oldu. {x} ölü bulundu. Suikastçı hâlâ aramızda!',
    sabahSessiz: 'Sabah oldu. Bu gece kimse ölmedi.',
    final: 'FIRLATMA ANI! Herkes masaya. Kaptan kimliğini açıklasın.',
    kazanMasum: 'KAPSÜL TEMİZ KALKTI! Mürettebat kazandı!',
    kazanHain: 'KAPSÜL PATLADI! İçeride hain vardı. Hainler kazandı!'
  };
})(typeof window !== 'undefined' ? window : globalThis);

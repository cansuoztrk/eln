/*
  ============================================================
   ELN'İN KRALLIĞI — İÇERİK DOSYASI
  ============================================================
  Sitedeki bütün yazılar burada. Kod bilmeden düzenleyebilirsin:
  sadece tırnak ('...') içindeki metinleri değiştir.

  Metinlerin içinde şu kısayolları kullanabilirsin, site kendisi doldurur:
    {herName}  → Eln          {myName}   → User155
    {together} → birlikte geçen gün sayısı
    {met}      → tanışalı geçen gün sayısı
    {km}       → İstanbul–Bakü mesafesi
    {anniversary} → ilk yıldönümüne kalan gün
    {bakuTime} / {istTime} → iki şehrin şu anki saati

  Fotoğraf eklemek için: fotoğrafları assets/photos/ klasörüne koy ve
  aşağıdaki "photos" listesine ekle (örnekler orada).
  ============================================================
*/
window.ELN = {
  config: {
    herName: 'Eln',
    myName: 'User155',
    herNick: 'eln', // gartic.io'daki nicki
    myNick: 'User155',
    friendName: 'Nehir',
    herCity: 'Bakü',
    myCity: 'İstanbul',
    metDate: '2025-12-06', // Nehir'in bizi Instagram grubuna eklediği gün
    togetherDate: '2026-05-21', // sevgili olduğumuz gün
    firstAnniversary: '2027-05-21',
    herBirthday: '04-23',
    myBirthday: '11-07',
    tzBaku: 4,
    tzIstanbul: 3,
    distanceKm: 1758,
    coords: { baku: [40.4093, 49.8671], istanbul: [41.0082, 28.9784] },
    // Kapıdaki soru ve kabul edilen cevaplar (küçük/büyük harf ve Türkçe karakter fark etmez)
    gateQuestion: 'Seni bu masala kim getirdi?',
    gateAnswers: ['nehir'],
    /*
      İSTEĞE BAĞLI — "Seni düşünüyorum", sarılma ve kupon butonlarına Eln bastığında
      telefonuna bildirim gelsin istersen: telefonuna "ntfy" uygulamasını kur,
      kimsenin tahmin edemeyeceği bir konu adı uydur (örn. 'eln-user155-k4le-9x2')
      ve uygulamada o konuya abone ol. Sonra aynı adı buraya yaz.
    */
    ntfyTopic: '',
  },

  /* ---------------- İKİ KULE MASALI (hikâye kitabı) ---------------- */
  story: [
    {
      scene: 'cover',
      title: 'İki Kule Masalı',
      text: [
        'Boğaz\'dan Hazar\'a uzanan bir aşk hikâyesi.',
        'Yazan: {myName} · Başrolde: Prenses {herName}',
      ],
    },
    {
      scene: 'baku',
      title: 'Hazar\'ın kıyısında bir prenses',
      text: [
        'Bir varmış, bir yokmuş... Hazar Denizi\'nin kıyısında, rüzgârın hiç eksik olmadığı Bakü\'de, Qız Qalası\'nın gölgesinde bir prenses yaşarmış. Adı {herName}\'miş.',
        'Hello Kitty\'lere bayılır, Konuşan Angela\'yla saatlerce oynar, bir gün çocuklara İngilizce öğretmek için gece gündüz ders çalışırmış. Gülüşü, Bakü\'nün rüzgârından bile hızlı yayılırmış.',
      ],
    },
    {
      scene: 'istanbul',
      title: 'Boğaz\'ın kıyısında bir çizer',
      text: [
        'Oradan bin yedi yüz küsur kilometre uzakta, İstanbul\'da, Kız Kulesi\'nin karşısında biri yaşarmış. Herkes ona {myName} dermiş.',
        'Gündüzleri Yıldız Teknik\'te Siyaset Bilimi ve Uluslararası İlişkiler okur, akşamları gartic.io\'da çizim yapıp kelime tahmin edermiş. Uluslararası ilişkiler okuyormuş ama hayatının en güzel uluslararası ilişkisini yaşayacağından habersizmiş.',
      ],
    },
    {
      scene: 'nehir',
      title: 'Peri Nehir',
      text: [
        'Bir gün gartic.io\'nun rengârenk odalarından birinde {myName}, Nehir adında bir periyle tanışmış. Nehir\'in bir sırrı varmış: Bakü\'deki prensesi zaten tanıyormuş.',
        'Derler ki Boğaz ile Hazar\'ı hiçbir nehir birleştirmez. Yanılıyorlar. Bizi birleştiren nehrin adı Nehir\'di.',
      ],
    },
    {
      scene: 'winter',
      title: '6 Aralık 2025',
      text: [
        'Peri Nehir asasını sallamış ve ikisini aynı Instagram grubuna eklemiş. Ekranda küçücük bir bildirim belirmiş.',
        'O gün kimse bilmiyormuş ama masal tam o an başlamış. Kış gelmiş, kar yağmış; mesajlar ise hiç soğumamış.',
      ],
    },
    {
      scene: 'question',
      title: 'Adı konmamış günler',
      text: [
        'Sonra adı konmamış günler gelmiş. Ne olduğumuzu soran olsa cevap veremezdik ama her gece konuşmadan uyuyamıyorduk.',
        'Situationship dedikleri buymuş galiba: Kalbin çoktan karar verdiği, dilin henüz yetişemediği o tatlı ara.',
      ],
    },
    {
      scene: 'birthday',
      title: '23 Nisan 2026',
      text: [
        'Türkiye\'de çocuklar bayram ediyormuş. Bense bayramın asıl sebebinin sen olduğuna emindim: O gün prensesin doğum günüymüş.',
        'Henüz sevgili bile değilmişiz ama o gün dünyanın en şanslı insanı benmişim. Çünkü sen doğmuşsun.',
      ],
    },
    {
      scene: 'together',
      title: '21 Mayıs 2026',
      text: [
        'Ve bir gün, adı konmamış o güzel şeyin nihayet bir adı olmuş: Sevgili.',
        'O günden sonra takvimdeki her 21, bizim küçük bayramımız olmuş.',
      ],
    },
    {
      scene: 'distance',
      title: '{km} kilometre',
      text: [
        'Aramızda {km} kilometre, bir saat fark ve koca bir Kafkasya var. Ama her akşam aynı gartic odasında buluşuyor, aynı aya bakıyor, aynı saniyede "iyi geceler" yazıyoruz.',
        'Sen benden bir saat ileridesin. Yani sen benim geleceğimsin.',
      ],
    },
    {
      scene: 'future',
      title: 'Devamı var...',
      text: [
        'Masalın sonu mu? Yok öyle bir şey. 21 Mayıs 2027\'de ilk yılımızı kutlayacağız, sonra ikincisini, sonra üçüncüsünü...',
        'Bu masal "mutlu son" ile bitmeyecek, prensesim. Çünkü hiç bitmeyecek.',
      ],
    },
  ],

  /* ---------------- GÜNÜN NOTU (her gün sıradaki) ---------------- */
  notes: [
    'Bugün de dünyanın en güzel prensesi sensin. Bu bilgi Kitty tarafından onaylanmıştır.',
    'Bakü rüzgârı bugün saçlarını dağıtırsa kızma; ona senin güzelliğini İstanbul\'a taşımasını rica ettim.',
    'Bugün bir saniyeliğine gözlerini kapat. O saniye seni düşünüyorum. (Aslında her saniye.)',
    'Günün İngilizce kelimesi: "smitten" — birine sırılsıklam âşık olmak. Örnek cümle: I am smitten with {herName}.',
    'Bugün kendine iyi davran. Çünkü benim sevdiğim birine kötü davranmana izin yok.',
    'Bir bardak su iç. Evet, şimdi. Prenseslerin de suya ihtiyacı var.',
    'Hatırlatma: 21 Mayıs\'tan beri dünyanın en şanslı insanıyım.',
    'Bugün biri sana gülümserse, o gülümsemenin yarısı benden.',
    'Günün sorusu: Bugün seni en çok ne güldürdü? Akşam bana anlat.',
    'Bugün sınavın, ödevin ya da yorgunluğun varsa: Sen düşündüğünden çok daha güçlüsün.',
    'Ekranın öbür ucunda seni seven biri var. İstanbul\'da, {km} km ötede.',
    'Bugün Hazar\'a bakarsan dalgalara benden selam söyle.',
    'Hello Kitty\'nin ağzı yokmuş, çünkü kalbiyle konuşurmuş. Benim kalbim de şu an tek bir şey söylüyor: Seni seviyorum.',
    'Gün ne kadar uzun olursa olsun, sonunda bizim "iyi geceler"imiz var.',
    'Mən səni sevirəm. Bugün bunu Azerbaycanca söylemek istedim.',
    'Günün görevi: Bana bir çizim gönder. Kötü olsun, fark etmez; gartic\'ten alışkınım.',
    'Bugün aynaya bakınca gördüğün kişiye benden bir öpücük ver.',
    'Aramızda bir saat var. Bu yüzden her gece "yarın" sana benden önce geliyor. Benim yarınımı da sen karşıla.',
    'Bugün yorulursan buraya gel. Kitty seni bekliyor.',
    'Seni tanımadan önceki hâlimi hatırlamıyorum bile.',
    'Bugün en sevdiğin Hello Kitty eşyana sarıl ve benim yerime say.',
    'Birbirimizden ne kadar uzak olursak olalım, aynı ayın altındayız.',
    'Günün İngilizce kelimesi: "serendipity" — güzel bir tesadüf. Tıpkı Nehir\'in bizi aynı gruba eklemesi gibi.',
    'Bugün de benim için bir şey yap: Gülümse.',
    'Seni düşünmekten ders çalışamıyorum. Bu senin suçun ve bundan hiç şikâyetçi değilim.',
    'Günün kelimesi (Azerbaycanca): "darıxmışam" — özledim. Çok.',
    'Bir gün bu siteyi yan yana, aynı ekrandan açacağız. Ben o günü bekliyorum.',
    'Prenses tacını bugün de tak. Görünmese de ben orada olduğunu biliyorum.',
    'Günün İngilizce kelimesi: "cherish" — birini özenle sevmek, kıymetini bilmek. I cherish you.',
    'Bugünün tarihi ne olursa olsun, benim için hep "seninle bir gün daha".',
  ],

  /* ---------------- KITTY ŞANS KURABİYESİ ---------------- */
  fortunes: [
    'Yakında İstanbul\'dan beklenmedik bir mesaj alacaksın. (İpucu: Gönderen {myName}.)',
    'Bugün bir saatlik farkla birinin aklındasın.',
    'Kitty diyor ki: Bugün pembe giy, şans getirir.',
    'Şans numaran: 155. Neden acaba?',
    'Bir çizim bin kelimeye bedel. Bu akşam gartic\'e uğra.',
    'Gelecekte seni bekleyen bir sarılma var. Uzun bir sarılma.',
    'Bugün yapacağın küçük bir iyilik, büyük bir gülümseme olarak sana geri dönecek.',
    'Bir kitap aç, rastgele bir sayfa oku. Oradaki ilk kelimeyi bana yaz.',
    'Hazar\'dan esen rüzgâr bugün sana güzel haberler getirecek.',
    'Bugün senin öğrencin olsaydım sana en güzel elmayı getirirdim.',
    'Kurabiye bir sır veriyor: Biri şu an fotoğraflarına bakarak seni özlüyor.',
    'Bugün "evet" demen gereken bir şey çıkacak. Mesela bu akşamki gartic davetine.',
    'Angela bugün sana göz kırpıyor. Bu çok nadir olur.',
    'Uzak mesafe bir sınavdır. Sen bu sınavı çoktan geçtin.',
    'Bu kurabiye {km} km yol geldi. İçindeki mesaj: Seni seviyorum.',
    'Bu gece ay biraz daha parlak olacak. Sebebi sensin.',
    'Kurabiyen kırıldı ama kalbin kırılmayacak. Bunun sözünü veriyorum.',
    'Bugün bir şarkı dinle ve beni düşün. Hangi şarkı olduğunu bana söyle.',
    'Beklediğin şey yolda. Belki bir mesaj, belki bir uçak bileti. (Kurabiye emin değil.)',
    'Bugün kendini güzel hissedeceksin. Çünkü öylesin.',
    'Yıldızlar diyor ki: 21\'ler senin şanslı günün.',
    'Bir sonraki görüntülü aramada ilk gülen sen olacaksın.',
    'Bugün bir Hello Kitty görürsen bu bir işarettir: Seni düşünüyorum.',
    'Şanslı rengin: fiyonk kırmızısı.',
    'Şanslı kelimen: "biz".',
    'Bugün Nehir\'e bir mesaj at. Ona çok şey borçluyuz.',
  ],

  /* ---------------- BUGÜN NASILSIN? ---------------- */
  moods: [
    { id: 'mutlu', label: 'Mutluyum', face: 'happy', text: 'Mutlu olmana bayılıyorum! Bu mutluluğu bana da bulaştır: Hemen bir sesli mesaj at, sesindeki gülümsemeyi duymak istiyorum.', letter: 'mutlu' },
    { id: 'ozledim', label: 'Özledim', face: 'heart', text: 'Ben de seni özledim. Hem de {km} kilometrelik bir özlemle. Boğaz\'dan Hazar\'a odasında "Seni düşünüyorum" butonuna bas, kalbin İstanbul\'a uçsun.', letter: 'ozledim', room: 'uzak' },
    { id: 'yorgun', label: 'Yorgunum', face: 'sleep', text: 'Bugün çok yoruldun, biliyorum. Biraz dinlen, su iç, gözlerini kapat. Müzik Kutusu senin için bir vals çalsın.', room: 'muzik' },
    { id: 'uzgun', label: 'Üzgünüm', face: 'normal', text: 'Gel buraya. Keşke şu an sarılabilsem. Onun yerine sana bir mektup bıraktım; oku, sonra bana yaz.', letter: 'uzgun' },
    { id: 'stresli', label: 'Stresliyim', face: 'normal', text: 'Derin bir nefes al: 4 saniye al, 4 saniye tut, 6 saniye ver. Bir gün harika bir öğretmen olacaksın; bu sadece küçük bir basamak.', letter: 'sinav', breathe: true },
    { id: 'sinirli', label: 'Sinirliyim', face: 'wink', text: 'Kime kızdıysan... Eğer banaysa özür dilerim. Eğer başkasınaysa adını ver, Kitty ile ilgileniriz.', letter: 'sinirli' },
    { id: 'uykusuz', label: 'Uykusuzum', face: 'sleep', text: 'Uyuyamıyor musun? Gel, Dilek Gökyüzü\'nde birlikte yıldız sayalım. Sonra da sana yazdığım ninni mektubunu oku.', letter: 'uykusuz', room: 'gokyuzu' },
    { id: 'heyecanli', label: 'Heyecanlıyım', face: 'heart', text: 'Heyecanın bana da geçti! Ne oldu, hemen anlat. Bu arada Aşk Kuponları\'na bir bak; belki bu heyecanı ikiye katlarız.', room: 'kuponlar' },
  ],

  /* ---------------- AÇILINCA OKU MEKTUPLARI ----------------
     lock: { date: 'YYYY-MM-DD' }  → o günden itibaren açılır
     lock: { night: true }         → sadece gece 00:00–05:00 (Bakü) açılır
     lock: { rain: true }          → Bakü'de yağmur yağarken açılır
  */
  letters: [
    {
      id: 'ozledim',
      title: 'Beni özlediğinde aç',
      color: '#FFD6E5',
      body: [
        'Prensesim,',
        'Şu an bunu okuyorsan beni özlemişsin demek. Sana bir sır vereyim mi? Ben de seni özlüyorum. Hem de şu an, bu satırları yazarken bile.',
        'Aramızda {km} kilometre var. Ama biliyor musun, özlem aslında mesafeyi değil, bağı ölçer. Ne kadar çok özlüyorsak o kadar sıkı bağlıyız demektir. O yüzden özlemekten korkma.',
        'Şimdi şunu yap: Gözlerini kapat ve Boğaz\'ın üstünden kalkan bir martı düşün. O martı Karadeniz kıyısından geçiyor, Kafkas Dağları\'nı aşıyor ve Hazar\'ın kıyısında, senin pencerenin önüne konuyor. Gagasında küçük bir not var: "Seni düşünüyorum."',
        'İşte o martı benim. Her gün uçuyor.',
        'Bir gün martıya gerek kalmayacak. Söz.',
      ],
    },
    {
      id: 'uzgun',
      title: 'Üzgün olduğunda aç',
      color: '#D6F1FF',
      body: [
        'Canım benim,',
        'Keşke şu an yanında olabilsem. Hiçbir şey söylemeden sarılırdım; bazen kelimeler fazla gelir, bilirim.',
        'Ne olduysa olsun, bu his geçici. Sen geçici değilsin. Sen benim en kalıcı, en güzel şeyimsin.',
        'Üzgün olduğunda kendine kızma. Ağlamak istiyorsan ağla; prensesler de ağlar. Sonra yüzünü yıka, bir bardak su iç ve bana yaz. Saat kaç olursa olsun.',
        'Sana küçük bir liste bırakıyorum: Bir, sen düşündüğünden çok daha güçlüsün. İki, seni seven insanlar var ve ben onların en çok seveniyim. Üç, bu gün bitecek ve yarın sana yepyeni bir sayfa açacak.',
        'Kitty\'nin ağzı yok ama kalbi var. Benim de sana söyleyecek çok şeyim var; en önemlisi şu: Seni seviyorum.',
      ],
    },
    {
      id: 'uykusuz',
      title: 'Uyuyamadığında aç',
      color: '#E0DBFF',
      body: [
        'Uykusuz prensesim,',
        'Saat kaç bilmiyorum ama muhtemelen geç. Bakü\'de gece, İstanbul\'da bir saat öncesi... Belki ben de uyanığım, belki de rüyamda seni görüyorum.',
        'Yatağına uzan ve benimle say: Bir Kitty... İki Kitty... Üç Kitty kanepede uyuyor... Dört Kitty fiyonkunu çıkarmış... Beş Kitty Angela\'nın omzuna yaslanmış... Altı Kitty Hazar\'ın dalgalarını dinliyor... Yedi Kitty İstanbul\'dan gelen bir "iyi geceler" mesajını okuyor...',
        'Gözlerini kapattığında yanında olduğumu hayal et. Saçlarını okşuyorum ve "Uyu artık, yarın konuşuruz" diyorum. Sen de "Beş dakika daha" diyorsun. Her zamanki gibi.',
        'Gecən xeyrə qalsın, gözəlim. İyi geceler.',
      ],
    },
    {
      id: 'sinirli',
      title: 'Bana kızdığında aç',
      color: '#FFE0E0',
      body: [
        'Tamam, tamam... Kızgınsın. Belki haklısın bile. (Muhtemelen haklısın.)',
        'Önce şunu bil: Seninle tartışmak bile başkalarıyla gülmekten daha anlamlı benim için. Çünkü tartıştığımızda bile "biz" olarak kalmayı seçiyoruz.',
        'Seni üzdüysem özür dilerim. Gerçekten. Bazen düşünmeden konuşuyorum, bazen geç cevap veriyorum, bazen seni anlamaya çalışırken yanlış anlıyorum. Ama seni kırmayı hiçbir zaman istemem.',
        'Bir anlaşma yapalım: Derin bir nefes al, bana ne hissettiğini söyle, ben de susup dinleyeyim. Sonra birlikte çözelim. Biz bir takımız; ben sana karşı değil, seninle birlikte sorunlara karşıyım.',
        'Not: Aşk Kuponları\'nda bir "Haklısın aşkım" kuponu var. Kullanmaktan çekinme.',
      ],
    },
    {
      id: 'sinav',
      title: 'Sınav stresindeyken aç',
      color: '#D8F5E8',
      body: [
        'Sevgili öğretmen adayım,',
        'Masanın üstünde kitaplar, notlar, belki soğumuş bir çay ve yorgun gözlerin. Biliyorum.',
        'Bir gün bir sınıfa gireceksin ve otuz çocuk sana bakacak. Onlara İngilizce öğreteceksin ama aslında çok daha fazlasını öğreteceksin: sabrı, sevgiyi, nezaketi. Çünkü sende bunların hepsi var.',
        'Bu sınav, o sınıfa giden yoldaki küçük bir taş sadece. Takılabilirsin ama düşmezsin. Düşersen de kalkarsın. Ben hep yanındayım.',
        'Şimdi: 25 dakika çalış, 5 dakika dinlen. O 5 dakikada bana "yaşıyorum" yaz, yeter.',
        'You\'ve got this, teacher. I believe in you. Always. (Sınavdan sonra kutlama yapacağız, şimdiden söyleyeyim.)',
      ],
    },
    {
      id: 'guzel',
      title: 'Kendini güzel hissetmediğinde aç',
      color: '#FFE9B8',
      body: [
        'Gözəlim,',
        'Bugün aynaya bakıp kendini beğenmediysen bu mektubu dikkatle oku. Çünkü ayna yanılabilir, ben yanılmıyorum.',
        'Sen, gülünce etrafını aydınlatan o kızsın. Sen, fotoğraflarını tekrar tekrar açtığım kişisin. Sen, pembe olan her şeyi daha da güzel yapan kişisin.',
        'Güzellik bir kalıp değil. Güzellik, birinin yüzüne baktığında kalbinin sakinleşmesi. Benim kalbim sana bakınca sakinleşiyor.',
        'Bugün kendine iyi davran. Sevdiğin bir şey giy, sevdiğin bir şarkıyı aç ve şunu tekrar et: "Ben harikayım." Çünkü öylesin.',
        'Bunu {km} km öteden, en içten söylüyorum.',
      ],
    },
    {
      id: 'mutlu',
      title: 'Mutlu olduğunda aç',
      color: '#FFF3C4',
      body: [
        'Mutlu musun? Yaşasın!',
        'Bu mektubu açtığına göre yüzünde bir gülümseme var. Şu an o gülümsemeyi görmeyi ne çok isterdim.',
        'Mutluluğunu bana da anlat. Ne oldu, kim güldürdü, neden bu kadar güzel bir gün? Her detayını dinlemek istiyorum.',
        'Senin mutluluğun benim en sevdiğim haber. Bu akşam gartic\'te kutlayalım; kazanan sen ol (zaten hep sen kazanıyorsun).',
        'Bu mektubun sonuna bir not düşüyorum: "Bugün {herName} mutluydu. Ve bu, dünyanın en güzel günüydü."',
      ],
    },
    {
      id: 'yalniz',
      title: 'Yalnız hissettiğinde aç',
      color: '#D6F1FF',
      body: [
        'Yalnız değilsin.',
        'Bunu en başa yazdım, çünkü en önemlisi bu.',
        'Bazen etrafında bir sürü insan olsa bile yalnız hissedersin. Bazen de odada tek başınasındır ve dünya çok büyük gelir. İki durumda da bil ki İstanbul\'da biri var ve o kalpte her zaman sana ayrılmış bir yer var.',
        'Telefonuna bak: Mesajlarımız orada. Fotoğraflarımız orada. Bu kale burada. Kitty burada, Angela burada. Ve ben bir mesaj uzaklığındayım.',
        'Şimdi bana "yalnız hissettim" yaz. Utanma. Birlikte olmak en çok bu anlarda işe yarar.',
      ],
    },
    {
      id: 'gece',
      title: 'Gece yarısından sonra aç',
      color: '#E0DBFF',
      lock: { night: true },
      body: [
        'Gece yarısı prensesi,',
        'Bu mektup sadece gece yarısından sonra açılıyor, çünkü bazı sözler sadece geceleri söylenir.',
        'Gece her şeyin daha çok hissedildiği zamandır. Özlem daha derin, sessizlik daha büyük, kalp daha çok konuşur.',
        'Şu an etraf sessizse dinle: O sessizliğin içinde {km} km öteden gelen bir fısıltı var. "Seni seviyorum" diyor.',
        'Pencereden bak. Ayı görebiliyor musun? Ben de ona bakıyorum. Bu gece ay bizim buluşma noktamız.',
        'Ama artık uyu, tamam mı? Yarın beni o güzel sesinle uyandırman lazım. (Ben de uyumam gerektiğini biliyorum.)',
      ],
    },
    {
      id: 'yagmur',
      title: 'Bakü\'de yağmur yağarken aç',
      color: '#D6F1FF',
      lock: { rain: true },
      body: [
        'Bakü\'de yağmur yağıyor, değil mi?',
        'Rüzgârlar şehrinin yağmuru bile başkadır herhalde. Pencereye vuran her damla sana bir şey anlatmaya çalışıyor gibi.',
        'Bir battaniyeye sarın, bir çay koy ve dinle: Bir gün yağmurlu bir günde İçərişəhər\'in dar sokaklarında tek bir şemsiyenin altında yürüyeceğiz. Şemsiye küçük olacak, ikimiz de ıslanacağız ve hiç umursamayacağız.',
        'O gün gelene kadar her yağmur o günün provası olsun.',
        'Yağmur sesi eşliğinde: Seni seviyorum.',
      ],
    },
    {
      id: 'benim-dogumgunum',
      title: 'Benim doğum günümde aç',
      color: '#FFE9B8',
      lock: { date: '2026-11-07' },
      body: [
        'Bugün benim doğum günüm ama bu mektubu sana yazıyorum. Çünkü bu yıl aldığım en güzel hediye sensin.',
        'Bu yıl doğum günümü bir sevgiliyle geçiriyorum ve o sevgili Bakü\'deki bir prenses. Hiç böyle bir hediye almamıştım.',
        'Bana "iyi ki doğdun" dediğinde ben içimden "iyi ki tanıştık" diyeceğim. Nehir\'e de bir "iyi ki" göndermeliyiz bu arada.',
        'Bu gün için tek dileğim: Gelecek doğum günümde aynı şehirde, aynı masada, aynı pastanın mumlarını üflemek.',
        'Hayatımda olduğun için teşekkür ederim.',
      ],
    },
    {
      id: 'tanisma',
      title: 'Tanıştığımız günün yıldönümünde aç',
      color: '#FFD6E5',
      lock: { date: '2026-12-06' },
      body: [
        '6 Aralık.',
        'Bir yıl önce bugün Nehir bizi bir Instagram grubuna ekledi. O gün "merhaba" diyen iki yabancıydık. Bugün bu satırları okuyan sen benim en yakınım, sevgilim, prensesimsin.',
        'Bir yılda neler oldu bir düşün: Kış geldi, bahar geldi, 23 Nisan\'ın geldi, 21 Mayıs\'ımız geldi, yaz geldi, sonbahar geldi. Ben değiştim, sen değiştin. Ama bir şey hiç değişmedi: Seninle konuşmak için sabırsızlandığım o his.',
        'Bugün biraz geriye dön ve ilk mesajlarımızı oku. Sonra bana ne hissettiğini yaz.',
        'Mutlu tanışma yıldönümü, {herName}. İyi ki o grupta sen vardın.',
      ],
    },
    {
      id: 'dogumgunu',
      title: 'Doğum gününde aç',
      color: '#FFD6E5',
      lock: { date: '2027-04-23' },
      body: [
        'İyi ki doğdun, Prenses {herName}!',
        'Bugün 23 Nisan. Türkiye\'de bayram, Bakü\'de senin doğum günün. İtiraf edeyim, bence o bayram havasının tamamı aslında senin için.',
        'Geçen yıl bugün adı konmamış bir şeydik. Bu yıl sevgiliyiz. Seneye ne olacağımızı bilmiyorum ama bir şeyi biliyorum: Seninle birlikte her yaş daha güzel.',
        'Sana dileklerim: Hep böyle gül. Hayalindeki öğretmen ol. Hello Kitty koleksiyonun büyüsün. Angela seni hep kıskansın. Ve ben her doğum gününde seni ilk kutlayan olayım.',
        'Özel Günler odasındaki pastanın mumlarını üfle. Ben de İstanbul\'dan üflüyorum; rüzgârımız Bakü\'de buluşsun.',
        'Seni seviyorum. Bugün, yarın, her 23 Nisan\'da.',
      ],
    },
    {
      id: 'yildonumu',
      title: 'İlk yıldönümümüzde aç',
      color: '#FFE0E0',
      lock: { date: '2027-05-21' },
      body: [
        'Bir yıl.',
        '365 gün, 8.760 saat, 525.600 dakika... Ve ben her birinde seni biraz daha sevdim.',
        'Bir yıl önce bugün sevgili olduk. Uzak mesafe dediler, zor dediler, yürümez dediler. Biz yürüttük. Hem de {km} kilometreyi el ele.',
        'Bu bir yılda gartic odalarında buluştuk, telefon ekranlarında uyuyakaldık, aynı aya baktık, farklı saatlerde aynı anda "seni seviyorum" dedik.',
        'Sana bir söz veriyorum: İkinci yılımızda aradaki kilometreleri azaltmak için elimden gelen her şeyi yapacağım.',
        'Mutlu yıllar, sevgilim. Nice yıllara, nice 21\'lere. Mən səni sevirəm. I love you. Seni seviyorum. Her dilde, her şehirde, her zaman.',
      ],
    },
  ],

  /* ---------------- SENİ SEVMEMİN SEBEPLERİ ---------------- */
  reasons: [
    'Gülüşün. Ekranın öbür ucundan bile odayı aydınlatıyor.',
    'Hello Kitty\'yi bir çocuk heyecanıyla sevmen. İçindeki o küçük kızı hiç kaybetmemişsin.',
    'gartic.io\'da en kötü çizimlerimi bile tahmin edebilmen. Bu, beni gerçekten anladığının kanıtı.',
    'Sesin. Özellikle uykulu "iyi geceler"in.',
    'Konuşan Angela\'yla oynarken bile ne kadar tatlı olduğunu fark etmemen.',
    'Bir gün yüzlerce çocuğa İngilizce öğretecek olman. O çocuklar çok şanslı.',
    '{km} kilometreyi hiçbir zaman bahane yapmaman.',
    '"Yedin mi?" diye sorman. Basit ama bana dünyanın en önemli insanıymışım gibi hissettiriyor.',
    'Benden bir saat ileride yaşaman. Sabahları "günaydın"ı hep sen önce hak ediyorsun.',
    'Ciddi olmaya çalışıp gülmeye başladığın anlar.',
    'Nehir\'in arkadaşı olman. Onun sayesinde karşılaştık, ama senin sayende kaldım.',
    'Bana sabretmen. Özellikle geç cevap verdiğim günlerde.',
    '"Canım" deyişin. Aynı kelime ama senden duyunca bambaşka.',
    'Gözlerin. Fotoğrafta bile konuşuyorlar.',
    'Beni dinlemen. Siyasetten sıkıcı ders notlarıma kadar her şeyi.',
    'Küçük şeylerle mutlu olabilmen: bir çıkartma, bir şarkı, bir mesaj.',
    'İyi bir insan olman. Bunu en çok başkalarına nasıl davrandığında görüyorum.',
    'Bana kendimi yeterli hissettirmen.',
    'Uyumadan önce son düşündüğüm, uyanınca ilk aklıma gelen olman.',
    'Pembe olan her şeyin artık bana seni hatırlatması.',
    'Aramızdaki bir saatlik farkı bir ömürlük yakınlığa çevirmen.',
    'Beni güldürmen. Hem de en kötü günümde.',
    'Adı konmamış günlerimizde bile bana güven vermen.',
    '21 Mayıs\'ta "evet" demen. Takvimdeki en sevdiğim gün.',
    'Mesajlarının sonuna koyduğun o küçük kalpler.',
    'Güçlü olman. Uzak mesafe cesaret ister ve sen çok cesursun.',
    'Hayallerinin olması ve onlara inanman.',
    'Benim hayallerime de inanman.',
    'İngilizce konuşurken ortaya çıkan o öğretmen tonun.',
    'Sabırsızlandığın zamanlarda bile beklemeyi seçmen.',
    '"Bakü\'ye gel" deyişin. Her seferinde valizimi hazırlamak istiyorum.',
    'Sen olduğun için. Bu listenin tamamı aslında sadece bunun uzun hâli.',
    'Saçma şakalarıma gülmen. (Ya da gülüyormuş gibi yapman; ikisi de olur.)',
    'Fotoğraflarında hep aynı samimiyetle bakman.',
    'Beni daha iyi biri olmaya teşvik etmen.',
    'Aramızdaki mesafeyi bir hikâyeye çevirmemize izin vermen.',
    'Bana güvenmen. Bunun ne kadar değerli olduğunu biliyorum.',
    'Tek bir mesajınla bütün günümü değiştirebilmen.',
    'Kalbinin Hello Kitty kadar yumuşak olması.',
    'Uykulu hâlinle bile konuşmaya devam etmeye çalışman.',
    'Beni özlediğini söylemekten çekinmemen.',
    'Hayatına beni de katman.',
    'Farklı şehirlerde, farklı ülkelerde olsak da aynı şeylere gülmemiz.',
    'Üç dili aynı anda kalbinle konuşman.',
    'Bir gün aynı şehirde uyanacağımız fikrini benimle birlikte hayal etmen.',
    'Beni tanıdıkça daha çok sevmen.',
    'Yazım hatalarımı düzeltip yine de beni sevmen, öğretmenim.',
    'Beni, sensiz hayal edemeyeceğim bir hâle getirmen.',
    'Sevdiklerine olan bağlılığın.',
    'Seni sevdiğimi bildiğin hâlde her seferinde ilk kez duyuyormuş gibi sevinmen.',
    'Kendin gibi olman. Hiç rol yapmaman.',
    'Uzak olsak da her gün "biz" olmayı seçmen.',
    'Bazen hiç konuşmadan uzun uzun aramada kalabilmemiz.',
    'Bana sevginin kilometreyle ölçülmediğini öğretmen.',
    'Geleceğimi düşündüğümde orada senin olman.',
    'Doğum gününün 23 Nisan olması. Türkiye\'de o gün zaten bayram; tesadüf olamaz.',
    'Her gün içimden Nehir\'e teşekkür ettirmen.',
    'Kitty\'yi, Angela\'yı ve beni aynı kalpte taşıyabilmen.',
    'Bu siteyi yaparken her satırda aklımda olman.',
    'Çünkü sen {herName}\'sin. Başka bir sebebe gerek yok ama ben yine de yüzlercesini bulurum.',
  ],

  /* ---------------- ANGELA'YA SOR ---------------- */
  angela: {
    greet: [
      'Merhaba {herName}! Bugün çok güzel görünüyorsun, kıskandım bile.',
      'Selam prenses! {myName} bana seni anlatıp duruyor, sonunda tanıştık.',
      'Sonunda geldin! Kitty ile seni bekliyorduk.',
    ],
    chips: [
      '{myName} beni ne kadar seviyor?',
      'Şu an ne yapıyor sence?',
      'Beni özlüyor mu?',
      'Ne zaman görüşeceğiz?',
      'Bana bir sır söyle',
      'Bana iltifat et',
      'Fal bak',
      'Şarkı söyle',
      'Beni güldür',
      'Kim daha tatlı: ben mi Hello Kitty mi?',
    ],
    rules: [
      {
        keys: ['ne kadar sev', 'seviyor mu', 'sevgi', 'ask', 'seviyo'],
        answers: [
          'Ne kadar mı? Hazar Denizi\'ni düşün. Şimdi onu Karadeniz\'le topla. Hâlâ az.',
          'Bana sorarsan ölçemezsin; {km} kilometreyi her gün kalbiyle geçiyor.',
          'Geçen gün bana "Angela, sence {herName} bilir mi onu ne kadar sevdiğimi?" diye sordu. Ben de "Bilir" dedim. Bilirsin, değil mi?',
          'Bir kedi olarak söylüyorum: Bu kadar âşık birini ancak Tom\'da gördüm. O bile bu kadar değildi.',
        ],
      },
      {
        keys: ['ne yapiyor', 'simdi ne', 'su an ne', 'nerede'],
        answers: ['__doing__'],
      },
      {
        keys: ['ozluyor', 'ozledi', 'ozlem', 'darix'],
        answers: [
          'Özlüyor mu? Şu an İstanbul\'da saat {istTime} ve bence tam şu an bile seni düşünüyor.',
          'Bir sır: Fotoğraflarına bakıp bakıp iç çekiyor. Ben gördüm.',
          'Özlemek ne kelime. Kitty\'ye sorsan o da söyler; herkes biliyor artık.',
        ],
      },
      {
        keys: ['gorus', 'bulus', 'ne zaman', 'kavus', 'gelecek'],
        answers: [
          'Her geçen gün kavuşmaya bir gün daha yakınsınız. İlk yıldönümünüze {anniversary} gün kaldı; bence o güne kadar bir plan çıkar.',
          'Tarih veremem ama şunu biliyorum: Bu hikâyede bir havaalanı sahnesi var ve çok güzel.',
          'Yakında. Kediler zamanı iyi bilir; bu aşk beklemeye değer.',
        ],
      },
      {
        keys: ['sir', 'gizli'],
        answers: [
          'Sır: Bu sitenin içinde gizli bir kapı var. Klavyeden ya da logoya dokunarak bulabilirsin...',
          'Sır: {myName} bu siteyi yaparken en çok "{herName} bunu görünce gülümser mi?" diye düşündü.',
          'Sır: Mektuplar odasındaki bazı mektuplar ancak özel günlerde açılıyor. Takvimine not al!',
          'Sır: Gece yarısından sonra kaleye gelirsen bir çıkartma kazanırsın. Ama uykunu bölme, olur mu?',
          'Sır: Hello Kitty\'nin doğum günü 1 Kasım. {myName}\'in doğum günü ise 7 Kasım. Kasım tatlı insanlar ayı demek ki.',
        ],
      },
      {
        keys: ['iltifat', 'guzel miyim', 'guzel', 'tatli'],
        answers: [
          'Gözlerin o kadar güzel ki benim mavi gözlerim bile kıskanıyor.',
          'Bir kediden daha zarif olmak zordur. Sen başardın.',
          'Sen gülünce Bakü\'nün rüzgârı bile durup bakıyor.',
          'Bugün çok güzelsin. Dün de güzeldin. Yarın da güzel olacaksın. Kedi sözü.',
        ],
      },
      {
        keys: ['fal', 'gelecegim', 'kehanet'],
        answers: [
          'Kahve fincanında bir fiyonk görüyorum... ve bir uçak... ve iki kule. Çok güzel bir yolculuk var önünde.',
          'Falında bir "U" harfi çıktı. Ve bir "155". Hmm, kim olabilir?',
          'Yakında bir kutu açacaksın ve içinden pembe bir şey çıkacak. Kedi falı hiç yanılmaz.',
          'Önümüzdeki günlerde sesli bir mesaj seni çok güldürecek.',
        ],
      },
      {
        keys: ['sarki', 'soyle', 'sing', 'muzik'],
        answers: ['__sing__'],
      },
      {
        keys: ['guldur', 'saka', 'fikra', 'komik'],
        answers: [
          'Kediler neden bilgisayar kullanmaz? Çünkü fareyle araları iyi değil.',
          'Hello Kitty neden hiç konuşmuyor biliyor musun? Çünkü onun yerine ben konuşuyorum.',
          '{myName} dün gartic\'te "kedi" çizdi, herkes "patates" dedi. Sadece sen bilirdin.',
          'Bir kedi bir öğretmene ne der? "Miyav I go to the toilet, teacher?"',
          'Tom\'a sordum "Sence {herName} mi daha tatlı ben mi?" Hâlâ cevap vermedi. Anladın sen onu.',
        ],
      },
      {
        keys: ['kim daha tatli', 'hello kitty mi', 'ben mi'],
        answers: [
          'Zor soru... Kitty\'ye söyleme ama sen. Ama sadece biraz. Tamam, çok.',
          'Hello Kitty\'nin fiyonku var, senin ise {myName}\'i. Kazanan belli.',
        ],
      },
      {
        keys: ['angela', 'sen kimsin', 'nasilsin'],
        answers: [
          'Ben Angela! Bu kalenin moda danışmanı, sır saklayıcısı ve senin en büyük hayranınım.',
          'İyiyim! Kuyruğumu taradım, tacımı taktım. Sen nasılsın?',
        ],
      },
      {
        keys: ['nehir'],
        answers: ['Nehir mi? Bu masalın perisi! O olmasa bu kale hiç kurulmazdı.', 'Nehir\'e bir teşekkür borçlusun bence. {myName} de öyle düşünüyor.'],
      },
      {
        keys: ['gartic', 'ciz', 'cizim'],
        answers: ['Gartic Odası\'na git! {myName} senin için birkaç çizim hazırladı. Tahmin edebilir misin bakalım?', 'Sen çiz, ben tahmin edeyim... Aslında ben kediyim, kalemi tutamıyorum. Sen çiz, ona gönder!'],
      },
    ],
    fallback: [
      'Hmm, bunu düşünmem lazım. Bu arada saçların çok güzel olmuş.',
      'Bunu {myName}\'e sorsan daha iyi olur. Ama bil ki cevabı muhtemelen "seni seviyorum" olacak.',
      'Kedi dilinde bunun karşılığı "miyav". Yani evet. Galiba.',
      'Bilmiyorum ama şunu biliyorum: Bugün harika görünüyorsun.',
      'Sorunu Kitty\'ye ilettim. Kendisi ağzı olmadığı için yazılı cevap verecekmiş.',
    ],
    doing: {
      night: ['Muhtemelen uyuyor ve rüyasında seni görüyor. İstanbul\'da saat {istTime}.', 'Uyuyormuş gibi yapıp telefondan senin fotoğraflarına bakıyor olabilir. Saat {istTime}, kim bilir.'],
      morning: ['İstanbul\'da saat {istTime}. Muhtemelen Yıldız Teknik\'in yokuşunu çıkarken seni düşünüyor.', 'Kahvaltı mı ediyor, derse mi yetişiyor bilmiyorum ama aklında sen varsın, orası kesin.'],
      day: ['Muhtemelen derste. Hoca uluslararası ilişkiler anlatıyor, o ise Bakü–İstanbul ilişkisini düşünüyor.', 'İstanbul\'da saat {istTime}. Bence şu an telefonuna bakıp senden mesaj bekliyor.'],
      evening: ['Akşam oldu, İstanbul\'da saat {istTime}. Bence gartic.io\'yu açmış, seni bekliyor.', 'Akşam yemeği sonrası "{herName} ne yapıyor acaba?" modundadır.'],
    },
  },

  /* ---------------- AŞK SÖZLÜĞÜ (Türkçe · Azərbaycanca · English) ---------------- */
  dictionary: [
    ['Seni seviyorum', 'Mən səni sevirəm', 'I love you'],
    ['Seni özledim', 'Sənin üçün darıxmışam', 'I miss you'],
    ['Canım', 'Canım', 'My dear'],
    ['Güzelim', 'Gözəlim', 'My beautiful'],
    ['Kalbim', 'Ürəyim', 'My heart'],
    ['Hayatım', 'Həyatım', 'My life'],
    ['Prensesim', 'Şahzadəm', 'My princess'],
    ['Ayım', 'Ayım', 'My moon'],
    ['Tatlım', 'Şirinim', 'Sweetheart'],
    ['Günaydın', 'Sabahın xeyir', 'Good morning'],
    ['İyi geceler', 'Gecən xeyrə qalsın', 'Good night'],
    ['Seni düşünüyorum', 'Səni düşünürəm', 'I\'m thinking of you'],
    ['Sen benim her şeyimsin', 'Sən mənim hər şeyimsən', 'You are my everything'],
    ['Çok tatlısın', 'Çox şirinsən', 'You are so sweet'],
    ['Birlikte', 'Birlikdə', 'Together'],
    ['Mesafe', 'Məsafə', 'Distance'],
    ['Sonsuza kadar', 'Həmişəlik', 'Forever'],
  ],

  /* ---------------- ÖDEV: "My Girlfriend" ----------------
     [yanlış|doğru] şeklindeki yerler, Öğretmen Eln'in bulması gereken hatalar. */
  essay: {
    title: 'My Girlfriend',
    student: '{myName} · Class 1-A',
    text: 'My girlfriend\'s name is Eln. She [live|lives] in Baku and I live in Istanbul. We [meeted|met] on the sixth of December, thanks to our friend Nehir. Eln [have|has] the most beautiful smile in the world. She loves Hello Kitty and Talking Angela more [then|than] anything. She is [a|an] amazing future English teacher and I am her worst student, but I try my best. Every night we play gartic.io [togheter|together] and she always [guess|guesses] my drawings, even the bad ones. There are 1,758 kilometres between us, but my heart does not care about kilometres. I [am loving|love] her more every day.',
  },

  /* ---------------- AŞK SINAVI ---------------- */
  quiz: [
    { q: 'Bizi kim tanıştırdı?', options: ['Angela', 'Nehir', 'Hello Kitty', 'Kader'], answer: 1, note: 'Peri Nehir, tabii ki!' },
    { q: 'İlk nerede tanıştık?', options: ['Bakü\'de bir kafede', 'gartic.io odasında', 'Bir Instagram grubunda', 'Okulda'], answer: 2, note: 'Nehir bizi aynı Instagram grubuna ekledi.' },
    { q: 'Tanıştığımız tarih?', options: ['6 Aralık', '21 Mayıs', '23 Nisan', '14 Şubat'], answer: 0, note: '6 Aralık 2025. Masalın ilk sayfası.' },
    { q: 'Sevgili olduğumuz tarih?', options: ['1 Ocak', '6 Aralık', '21 Mayıs', '7 Kasım'], answer: 2, note: 'O yüzden her ayın 21\'i bizim bayramımız.' },
    { q: 'Benim gartic.io\'daki nickim ne?', options: ['User551', 'Prens155', 'User155', 'Kitty155'], answer: 2, note: 'User155, hizmetinizde.' },
    { q: 'Benim doğum günüm ne zaman?', options: ['1 Kasım', '7 Kasım', '23 Nisan', '6 Aralık'], answer: 1, note: '1 Kasım Hello Kitty\'nin doğum günü, sakın karıştırma!' },
    { q: 'Ben ne okuyorum?', options: ['İngilizce Öğretmenliği', 'Hukuk', 'Siyaset Bilimi ve Uluslararası İlişkiler', 'Grafik Tasarım'], answer: 2, note: 'Yıldız Teknik, 1. sınıf.' },
    { q: 'İstanbul ile Bakü arasındaki saat farkı?', options: ['Fark yok', '1 saat', '2 saat', '3 saat'], answer: 1, note: 'Sen hep bir saat öndesin. Geleceğim sensin.' },
    { q: 'Hello Kitty hangi şehirde yaşıyor?', options: ['Tokyo', 'Paris', 'Londra', 'Bakü'], answer: 2, note: 'Kitty White bir Londralı! Yani o da İngilizce konuşuyor, tıpkı öğretmenim gibi.' },
    { q: 'Seni ne kadar seviyorum?', options: ['Çok', 'Çok çok', 'Hazar Denizi kadar', 'Hepsinden fazla'], answer: -1, note: 'Bu sorunun yanlış cevabı yok. Doğru cevap: sonsuz.' },
  ],

  /* ---------------- HAYAL LİSTESİ ---------------- */
  bucket: [
    { cat: 'İstanbul\'da', items: ['Üsküdar\'da Kız Kulesi\'ne karşı çay içmek', 'Vapurda martılara simit atmak', 'Galata\'da gün batımını izlemek', 'Balat\'ın renkli sokaklarında fotoğraf çekmek', 'Yıldız Teknik kampüsünü gezdirmek', 'Kadıköy\'de dondurma yiyip sahilde yürümek'] },
    { cat: 'Bakü\'de', items: ['İçərişəhər\'de el ele yürümek', 'Qız Qalası\'nın tepesine birlikte çıkmak', 'Bulvarda akşam yürüyüşü', 'Alev Kuleleri\'nin ışık gösterisini izlemek', 'Baku Eye\'da tur atmak', 'Mürebbeli Azerbaycan çayı içmek'] },
    { cat: 'Dünyada', items: ['Japonya\'da Sanrio Puroland\'e gitmek', 'Londra\'da Hello Kitty\'nin şehrini gezmek', 'Kapadokya\'da balonla uçmak', 'Birlikte bir yere ilk kez gitmek'] },
    { cat: 'Her yerde', items: ['Aynı odada, yan yana gartic.io oynamak', 'Birlikte Hello Kitty pastası yapmak', 'Bir film maratonu (sen seçiyorsun)', 'İlk yıldönümünü aynı şehirde kutlamak', 'Nehir\'le üçümüz bir araya gelmek', 'Bu siteyi yan yana açıp birlikte gezmek'] },
  ],

  /* ---------------- AŞK KUPONLARI ---------------- */
  coupons: [
    { id: 'sarilma', title: 'Sınırsız Sarılma', text: 'Görüştüğümüz ilk gün geçerli. Son kullanma tarihi yok, sayı sınırı yok.', color: '#FFD6E5' },
    { id: 'arama', title: 'Bitmeyen Görüntülü Arama', text: 'Sen kapatana kadar kapatmıyorum. Uyuyakalırsan da kapatmıyorum.', color: '#E0DBFF' },
    { id: 'gartic', title: 'Gartic Siparişi', text: 'Ne istersen çizerim. Ne kadar zor olursa olsun. (Ne kadar kötü olacağını garanti edemem.)', color: '#D8F5E8' },
    { id: 'haklisin', title: '"Haklısın aşkım"', text: 'Bir tartışmayı anında kazanma hakkı. İtiraz yok, "ama" yok.', color: '#FFE0E0' },
    { id: 'masal', title: 'Sesli Uyku Masalı', text: 'Uyumadan önce sadece sana özel, sesli bir masal anlatırım.', color: '#D6F1FF' },
    { id: 'hediye', title: 'Hello Kitty Sürprizi', text: 'Sana bir Hello Kitty sürprizi. Ne olduğu sürpriz.', color: '#FFE9B8' },
    { id: 'evet', title: 'Bir Gün Boyu "Evet"', text: 'Bir gün boyunca ne istersen cevabım "evet". (Mantık çerçevesinde... belki.)', color: '#FFF3C4' },
    { id: 'sarki', title: 'Sana Şarkı', text: 'Sesim ne kadar kötü olursa olsun, senin seçtiğin bir şarkıyı söylerim.', color: '#FFD6E5' },
    { id: 'rehber', title: 'Özel Rehber', text: 'İstanbul\'a geldiğinde bütün gün rehberin benim. Valizini de ben taşırım.', color: '#D8F5E8' },
    { id: 'joker', title: 'Joker Kupon', text: 'Ne istediğini sen yaz. Ben yerine getiririm.', color: '#E0DBFF', joker: true },
  ],

  /* ---------------- ANI DUVARI (fotoğraflar) ----------------
     Fotoğrafları assets/photos/ klasörüne koyup buraya ekle. Örnek:
     { src: 'assets/photos/ilk-mesaj.jpg', caption: 'İlk mesajımız', date: '2025-12-06' },
  */
  photos: [],

  /* ---------------- BİZİM ŞARKILARIMIZ ----------------
     Örnek: { title: 'Şarkı adı', artist: 'Sanatçı', url: 'https://open.spotify.com/track/...' , note: 'Neden bizim şarkımız' }
  */
  playlist: [],

  /* ---------------- SON SAYFA ---------------- */
  finalLetter: [
    'Sevgili {herName},',
    'Bu siteyi yaparken çok düşündüm: Sana ne söylemek istiyorum? Sonra fark ettim ki söylemek istediğim her şey aslında tek bir cümle; sadece o cümlenin binlerce farklı hâli var.',
    '6 Aralık 2025\'te Nehir bizi aynı gruba eklediğinde hayatımın yönünün değişeceğinden haberim yoktu. Sadece bir "merhaba"ydı. Sonra bir mesaj daha, bir gece daha, bir gartic oyunu daha... Ve bir gün kendimi telefonu elimden bırakamazken buldum.',
    'Bir süre adını koyamadık. Belki korktuk, belki acele etmek istemedik. Ama 21 Mayıs geldiğinde ikimiz de biliyorduk. Kalbin bazı kararları dilden çok önce verdiğini o zaman anladım.',
    'Şimdi sen Bakü\'desin, ben İstanbul\'dayım. Aramızda {km} kilometre, bir saat ve koca bir Kafkasya var. İnsanlar "Zor değil mi?" diye soruyor. Zor. Ama sen, zor olan her şeye değersin.',
    'Sen benim hem en güzel tesadüfüm hem de en bilinçli seçimimsin.',
    'Bir gün İstanbul\'un Kız Kulesi\'ne birlikte bakacağız. Bir gün Bakü\'nün Qız Qalası\'na birlikte çıkacağız. Bir gün aynı odada gartic oynayacağız; ben yine kötü çizeceğim, sen yine bilip güleceksin. Bir gün "uzak mesafe" sadece anlatacağımız bir hikâyenin başlığı olacak.',
    'O güne kadar söz veriyorum: Her gün seni biraz daha seveceğim. Her gün seni seçeceğim. Her gün {km} kilometreyi kalbimle biraz daha kısaltacağım.',
    'İyi ki doğdun, iyi ki Nehir var, iyi ki o grup var, iyi ki sen varsın.',
    'Seni seviyorum. Mən səni sevirəm. I love you, teacher.',
  ],
  finalSign: 'Sonsuza kadar senin, {myName}',
  finalQuestion: 'Bu masalın sonsuza kadar sürmesini ister misin?',
  noButtonTexts: ['Hayır', 'Emin misin?', 'Bir daha düşün', 'Kitty üzülecek', 'Angela da üzülecek', 'Nehir\'e söylerim!', 'Bu buton bozuk', 'Evet\'e basman lazım', 'Hayır diye bir seçenek yok', 'Lütfen?'],

  /* ---------------- BÜTÜN ÇIKARTMALARI TOPLAYINCA AÇILAN GİZLİ MEKTUP ---------------- */
  secretLetter: [
    'Tebrikler, bütün çıkartmaları topladın!',
    'Burası kalenin en gizli odası. Buraya sadece her köşeyi keşfeden, her mektubu okuyan, her oyunu oynayan biri ulaşabilirdi. Yani sen.',
    'Bu siteyi yaparken aklımda hep bir şey vardı: Sen bu sayfalarda dolaşırken bir an bile olsa yanında olduğumu hissedebil. Her buton, her animasyon, her küçük detay "seni düşünüyorum" demenin başka bir yoluydu.',
    'Sana son bir görev veriyorum: Bu ekranın fotoğrafını çek ve bana gönder. Karşılığında, bir sonraki görüşmemizde istediğin her şeyi yapacağım. Kupon gibi düşün, ama süresiz.',
    'Senin {myName}\'in.',
  ],
};

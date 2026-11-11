import { daysBetween, formatDate, formatNumber, weekdayOf } from "@/lib/dates";
import { BAKU, distanceKm, ISTANBUL } from "@/lib/dates/sky";
import { FACTS } from "./facts";

/**
 * Ready words, in Arda's voice.
 *
 * Arda asked for the sentences and paragraphs of this world to be written for
 * him (2026-11-10). Everything here is offered to him in the Studio as a
 * draft: he reads it, changes what does not sound like him, and publishes what
 * he stands behind. Nothing in this file reaches Eln by itself.
 *
 * What these words may and may not do (see docs/CONTENT_GUIDE.md):
 *   - They speak only of Arda's own feelings: love, longing, gratitude, hope.
 *   - They lean only on confirmed facts: two cities, one hour between them,
 *     two dates, two birthdays, her studies, Hello Kitty, the song, the photos,
 *     how they met (Nehir's group, by way of gartic.io), what they call each
 *     other (Mosi, Posi), that they talk by voice and have never had a video
 *     call, and that they have not met yet.
 *   - The tone is Arda's: openly loving, now and then playful.
 *   - They invent no event, no conversation and no memory, and never say what
 *     Eln feels or thinks.
 *   - They ask for nothing: no reply, no return, no forgiveness.
 *   - Every number and date is computed from the facts, never typed by hand.
 */

const find = (key: string) => FACTS.dates.find((d) => d.key === key)!;
const met = find("met");
const together = find("together");
const metDate = { year: met.year!, month: met.month!, day: met.day! };
const togetherDate = { year: together.year!, month: together.month!, day: together.day! };
const lower = (text: string) => text.toLocaleLowerCase("tr-TR");

/** "6 Aralık 2025" · "6 Aralık" · "cumartesi" */
const MET = formatDate(metDate);
const MET_DAY = formatDate({ month: metDate.month, day: metDate.day });
const MET_WEEKDAY = lower(weekdayOf(metDate));
/** "21 Mayıs 2026" · "21 Mayıs" · "perşembe" */
const TOGETHER = formatDate(togetherDate);
const TOGETHER_DAY = formatDate({ month: togetherDate.month, day: togetherDate.day });
const TOGETHER_WEEKDAY = lower(weekdayOf(togetherDate));
/** The days between meeting and becoming a couple. */
const GAP = daysBetween(metDate, togetherDate);
/** "23 Nisan" · "7 Kasım" */
const HER_BIRTHDAY = formatDate(FACTS.partner.birthday);
const HIS_BIRTHDAY = formatDate(FACTS.owner.birthday);
/** "1.760" */
const KM = formatNumber(Math.round(distanceKm(ISTANBUL, BAKU) / 10) * 10);

const paragraphs = (...parts: string[]) => parts.join("\n\n");

// ---------------------------------------------------------------------------
// The site's own passages. These are the defaults of the editable sections,
// so they are what the pages say until Arda rewrites them in the Studio.
// ---------------------------------------------------------------------------

export const WRITTEN_SECTIONS = {
  giftLetter: paragraphs(
    "Eln, bazen insanın anlatmak istediği çok fazla şey oluyor. Hepsini bir mesaja sığdıramıyorum; sığdırsam da yetmiyor gibi geliyor.",
    "Ben de bazılarını kelimelere, bazılarını fotoğraflara, bazılarını da küçük bir dünyaya dönüştürmek istedim.",
    "Aramızda şehirler var, bir de bir saatlik fark. Burası ikisinin de dışında bir yer: ne İstanbul ne Bakü. Yalnızca seni düşünürken biriktirdiklerim.",
    "Burada sana ait bir köşe var. Acele eden kimse yok, beklenen bir cevap yok.",
    "İstediğin zaman, istediğin kadar keşfedebilirsin.",
  ),
  heroNote:
    "Aramızda kilometreler var, bir de bir saatlik fark. Bu sayfalar ikisine de aldırmıyor: ne zaman açarsan aç, içinde sana ait bir şey olsun diye hazırlandı.",
  storyIntro: "Bazı hikâyeler büyük olaylarla anlatılır. Bizimki iki tarihle ve aralarına sığan günlerle başlıyor. Gerisi yazılmaya devam ediyor.",
  storyInterlude: paragraphs(
    `Bu ${GAP} günü tek tek anlatmaya kalksam bitiremem; birkaçını anlatıp gerisini eksik bırakmak da istemiyorum. O yüzden burada şimdilik yalnızca sayısı duruyor.`,
    "Bildiğim şu: her biri beni sana biraz daha yaklaştırdı.",
  ),
  distanceIntro:
    "Haritada bakınca uzak görünüyor. Ama mesafe kilometreyle ölçülüyorsa, ben her gün birkaç kez Bakü'ye gidip geliyorum; aklım hep yolda.",
  meetingNote: paragraphs(
    "Bu günün henüz bir tarihi yok; uydurmak da istemedim.",
    "Ama bir yeri var: bu dünyanın en güzel köşesini ona ayırdım. Tarih belli olduğunda buraya ilk ben yazacağım.",
  ),
  songNote: "Bazı şarkılar dinlenir, bazıları saklanır. Bu ikisi de. Ne zaman çalsa aklım aynı yere gidiyor: sana.",
  cornerMessages: [
    "Miyav. Bu, “seni seviyorum Mosi” demek.",
    "Bugünün fiyongu sana çok yakıştı.",
    "İstanbul'da biri şu an seni düşünüyor.",
    "Suyunu içmeyi unutma.",
    "Yorulduysan dinlen; dünya biraz bekleyebilir.",
    "Sınavların kolay geçsin, öğretmen hanım.",
    "Bakü'ye buradan kocaman bir selam var.",
    "Bugün kendine iyi davran.",
    "Bir fiyonk da benden.",
    "Aynı gökyüzünün altındayız, unutma.",
    "Sende saat bir ileri; iyi geceler önce sana.",
    "Küçük bir kedi, büyük bir sevgi getirdi.",
    "Bugün de yeterince iyisin.",
    "Posi, burası tamamen senin köşen.",
    "Gülümsedin mi aşkım? Ben gördüm sayıyorum.",
    "Pembe sana yakışıyor. Diğer renkler de.",
    "Bir mola ver; bu kedi izin verdi.",
    "Uyumadan önce: iyi ki varsın.",
    "Bugün bir sticker daha hak ettin.",
    "Buradaki her şey sana özel dizildi.",
  ],
} as const;

// ---------------------------------------------------------------------------
// Letters. Added to the Studio as drafts, one envelope each.
// ---------------------------------------------------------------------------

export type WrittenLetter = {
  title: string;
  category: "say" | "thanks" | "missing" | "dreams" | "beside" | "unsaid" | "future" | "special";
  envelopeStyle: "blush" | "ivory" | "rose" | "champagne" | "nude";
  seal: "heart" | "bow" | "star" | "cat" | "moon";
  body: string;
  /** A line for Arda, shown next to the draft in the Studio. */
  hint?: string;
};

export const WRITTEN_LETTERS: WrittenLetter[] = [
  {
    title: "İlk mektup",
    category: "say",
    envelopeStyle: "blush",
    seal: "heart",
    body: paragraphs(
      "Aşkım,",
      "Sana bir şeyler yazmak istediğimde hep aynı yerde takılıyorum: nereden başlayacağımı bilemiyorum. Çünkü sana söylemek istediklerim tek bir mesaja, tek bir geceye sığmıyor.",
      "O yüzden böyle bir yer yaptım. Aklıma geldikçe yazabileyim, sen de canın istedikçe okuyabilesin diye.",
      "Bu ilk mektupta büyük cümleler kurmayacağım. Yalnızca şunu bil: seni çok seviyorum ve hayatımda olman bana iyi geliyor. Günümün içinde bir yerde hep sen varsın; bazen bir şarkıda, bazen saate bakıp “Bakü'de şimdi bir saat ileri” dediğim anda, bazen de telefonda sesini duyduğum o ilk saniyede.",
      "Aramızda yol var, biliyorum. Ama ben o yolu bir eksiklik gibi değil, sana doğru giden bir şey gibi görmeyi seçiyorum.",
      "Bu mektubun bir cevabı olması gerekmiyor. Okuman yeter.",
    ),
  },
  {
    title: "Teşekkür ederim",
    category: "thanks",
    envelopeStyle: "champagne",
    seal: "star",
    body: paragraphs(
      "Hayatım,",
      "Bazı teşekkürler geç kalır, çünkü insan neye teşekkür edeceğini o an fark etmez. Bu mektup onlardan.",
      "Hayatıma girdiğin için teşekkür ederim. Kendi şehrinin, kendi derslerinin, kendi günlerinin arasında bana da yer açtığın için. Bunun kolay olmadığını biliyorum; arada bu kadar yol varken birine vakit ayırmak, yan yanayken ayırmaktan daha çok emek istiyor.",
      "Bana yazdığın her şey için teşekkür ederim. Kısa olanlar için de, uzun olanlar için de. Hepsini okudum; bazılarını birden fazla kez. Sesini duyduğum her konuşma için de teşekkür ederim; kapattıktan sonra bile bir süre kulağımda kalıyor.",
      "Bir teşekkür de Nehir'e: beni o gruba almasaydı bu mektubu yazacak kimsem olmazdı.",
      "Ve en çok, olduğun gibi olduğun için teşekkür ederim. Bunun için bir şey yapman gerekmiyor.",
      "İyi ki varsın, Mosi'm.",
    ),
  },
  {
    title: "Seni özlediğimde",
    category: "missing",
    envelopeStyle: "rose",
    seal: "moon",
    body: paragraphs(
      "Sevgilim,",
      "Özlemek tuhaf bir şey. İnsan henüz yan yana hiç yürümediği sokakları, hiç oturmadığı masaları özleyebiliyormuş. Ben bunu seninle öğrendim.",
      "Seni özlediğimde çoğu zaman büyük bir şey yapmıyorum aslında. Fotoğrafına bakıyorum, sonra saate bakıp sende kaç olduğunu hesaplıyorum. Bir saat ilerideysen belki uyumuşsundur diyorum, belki ders çalışıyorsundur.",
      "Bazen de yalnızca sesini duymak istiyorum. Ne konuştuğumuzun önemi olmuyor; sen konuşunca gün yerine oturuyor.",
      "Bu özlemin içinde bir şikâyet yok, bilmeni isterim. Kimseden bir şey istemiyor. Yalnızca orada duruyor ve bana senin ne kadar değerli olduğunu hatırlatıyor.",
      "Bir gün bu mektubu sana yüz yüze okumak isterim. O güne kadar burada dursun.",
      "Seni çok seviyorum.",
    ),
  },
  {
    title: "Hayal ettiklerim",
    category: "dreams",
    envelopeStyle: "nude",
    seal: "bow",
    body: paragraphs(
      "Mosi'm,",
      "Gelecekle ilgili büyük planlar yapmayı pek beceremem. Ama seninle ilgili küçük hayallerim var; saymaya kalksam bitiremem.",
      "Mesela aynı masada oturup aynı demlikten çay içmek. Sen İngilizce bir şey anlatırken benim dinliyormuş gibi yapıp aslında sana bakmam. Yan yana oturup gartic.io açmak; çizimlerime gülmen serbest. Bir akşam hiçbir şey yapmadan, yalnızca aynı odada olmak.",
      "İstanbul'da sana göstermek istediğim yerler var. Bakü'de de senin bana göstermeni istediğim yerler. Hangisi önce olur bilmiyorum; ikisinin de olacağını düşünmek hoşuma gidiyor.",
      "Bunların hiçbiri bir söz ya da bir takvim değil. Yalnızca seni düşününce kendiliğinden aklıma gelen şeyler. Seninle paylaşmak istedim, o kadar.",
    ),
  },
  {
    title: "O gün geldiğinde",
    category: "beside",
    envelopeStyle: "ivory",
    seal: "heart",
    body: paragraphs(
      "Aşkım,",
      "Bu mektubu henüz gelmemiş bir gün için yazıyorum. Tarihini bilmiyorum; bilmediğim için de uydurmuyorum.",
      "Ama o günü düşününce aklıma gelen ilk şey şu: muhtemelen ne diyeceğimi bilemeyeceğim. Bunca zaman yazıştıktan, sesini bunca kez duyduktan sonra karşında durup tek kelime edememek tam benlik bir şey olurdu.",
      "O yüzden şimdiden yazıyorum: o gün sussam bile, içimden geçen her şey bu sayfalarda duruyor olacak.",
      "Yanımda olduğunda sana büyük bir program hazırlamak istemiyorum. Aynı kaldırımda yürümek, aynı şeye aynı anda gülmek, saate bakmadan oturmak. Sesini telefondan değil, yanı başımdan duymak. Uzaktayken en çok bunların eksikliğini duyuyorum.",
      "O gün ne zaman gelirse gelsin, bu mektup burada duruyor olacak.",
    ),
  },
  {
    title: "Anlatamadıklarım",
    category: "unsaid",
    envelopeStyle: "blush",
    seal: "cat",
    body: paragraphs(
      "Posi'm,",
      "Her şeyi güzel anlatabilen biri değilim. Bazen bir şey söylemek istiyorum, cümle kafamda tam oluyor, yazarken yarısı kayboluyor. Bazen de hiç yazamıyorum; söyleyecek bir şeyim olmadığından değil, doğru kelimeyi bulamadığımdan.",
      "Bu mektup onların yerine.",
      "Sana söyleyemediğim şeylerin çoğu aslında çok basit: seni seviyorum ve aklımdasın. Güzel bir şey görünce sana göstermek istiyorum. İyi bir şey olunca ilk sana anlatmak istiyorum. Günüm kötü geçince de en çok senin var olduğunu bilmek iyi geliyor.",
      "Bunları her seferinde söylemiyorum, çünkü tekrar edince azalacakmış gibi geliyor. Azalmıyor. Buraya yazdım ki bir yerde dursun.",
      "Bazen eksik anlatıyorsam, bil ki eksik olan his değil, kelime.",
    ),
  },
  {
    title: "Gelecekteki Eln'e",
    category: "future",
    envelopeStyle: "champagne",
    seal: "moon",
    hint: "İstersen bu zarfı ileri bir tarihe kilitleyebilirsin; o güne kadar yalnızca adı görünür.",
    body: paragraphs(
      "Eln,",
      "Bu mektubu bugünkü sana değil, ileride bir gün bunu yeniden okuyacak olan sana yazıyorum.",
      "Belki okulun bitmiş olacak; belki bir sınıfın, sana “teacher” diye seslenen öğrencilerin olacak. Bunu şimdiden hayal edebiliyorum ve seninle gurur duyuyorum.",
      "Bu satırları yazdığım sırada aramızda iki şehir var ve henüz yüz yüze buluşmadık. Sen bunu okurken ne değişmiş olur bilmiyorum. Ama bugünkü ben, o günkü sana şunu söylemek istiyor: bu günleri seve seve yaşıyorum. Uzaktan da olsa seni tanımak, başıma gelen en güzel şeylerden biri.",
      "Okuduğun gün nerede olursan ol, umarım yorgun değilsindir. Yorgunsan da bu mektup sana iyi gelsin.",
      "Bugünden, çok severek.",
    ),
  },
  {
    title: "Doğum günün için",
    category: "special",
    envelopeStyle: "rose",
    seal: "bow",
    hint: `Bu mektup ${HER_BIRTHDAY} için yazıldı. Yayımlarken açılma tarihini o güne ayarlarsan, zarf o sabaha kadar mühürlü kalır.`,
    body: paragraphs(
      "Aşkım,",
      `Bugün ${HER_BIRTHDAY}. Bizim burada bugün bayram; sokaklarda bayraklar, okullarda çocuklar olur. Yıllardır bu günü öyle bilirdim. Artık benim için başka bir anlamı var: bugün senin günün.`,
      "Yanında olamıyorum ama bugün aklım bütün gün Bakü'de.",
      "Yeni yaşında senin için büyük şeyler dilemeyeceğim; onları sen zaten kendin yapıyorsun. Küçük şeyler diliyorum: iyi uyuduğun geceler, kolay geçen sınavlar, seni güldüren insanlar, bir de bolca fiyonk.",
      "Bugün Bakü'de mum üfleyen biri var, İstanbul'da da onu çok seven biri.",
      "İyi ki doğdun, Mosi'm.",
    ),
  },
];

// ---------------------------------------------------------------------------
// The two milestones and the four special days.
// ---------------------------------------------------------------------------

export const WRITTEN_MEMORIES: Record<"met" | "together", { summary: string; description: string; specialNote: string }> = {
  met: {
    summary: "İkimiz de aynı oyunu oynuyorduk ama bizi oyun değil, Nehir tanıştırdı.",
    description: paragraphs(
      `${MET}. İkimiz de gartic.io oynayan insanlardık; yine de orada karşılaşmadık.`,
      "Oyundan tanıdığım Nehir beni kendi grubuna aldı. O grupta Dicle vardı, Yusa vardı, bir de sen.",
      "Bugünden dönüp bakınca, bu sayfalarda ne varsa hepsinin o güne çıktığını görüyorum. Nehir'e bir teşekkür borcum var.",
      "İyi ki o grup, iyi ki o gün, iyi ki sen.",
    ),
    specialNote: "Bu evrendeki ilk yıldız.",
  },
  together: {
    summary: `${GAP} günün sonunda, bir ${TOGETHER_WEEKDAY}. Artık “biz” diyebildiğim gün.`,
    description: paragraphs(
      `Tanıştığımız günle bu günün arasında ${GAP} gün var. O günlerin sonunda bir ${TOGETHER_WEEKDAY} geldi ve o günden beri senden bahsederken “biz” diyebiliyorum.`,
      "Bu kelimeyi hafife almıyorum. Arada bu kadar yol varken “biz” olmak, her gün yeniden verilen bir karar gibi. Ben o kararı her sabah yeniden veriyorum.",
      `${TOGETHER_DAY}, takvimde en sevdiğim satır.`,
    ),
    specialNote: "Takvimde en sevdiğim satır.",
  },
};

export const WRITTEN_DAYS: Record<string, { subtitle: string; intro: string }> = {
  "eln-dogum-gunu": {
    subtitle: "Senin günün.",
    intro: `${HER_BIRTHDAY} burada bayram; çocuklar için. Benim içinse artık tek bir anlamı var: sen o gün doğdun. Bu sayfa her yıl o güne özel bir şeyle yeniden açılacak.`,
  },
  "arda-dogum-gunu": {
    subtitle: "Bir yaş daha, seninle.",
    intro: `${HIS_BIRTHDAY}. Yaş almanın en güzel yanı, hayatında kimin olduğunu fark etmek. Benim fark ettiğim şey belli.`,
  },
  "tanistigimiz-gun": {
    subtitle: "Her şeyin ilk günü.",
    intro: `${MET}. Her yıl bu gün geldiğinde, başladığımız yere bir kez daha dönüp bakmak istiyorum.`,
  },
  "sevgili-oldugumuz-gun": {
    subtitle: "“Biz” olduğumuz gün.",
    intro: `${TOGETHER}. Bu günü bir yıldönümü gibi değil, her yıl yeniden söylenen bir “iyi ki” gibi kutlamak istiyorum.`,
  },
};

// ---------------------------------------------------------------------------
// 365 notes, one for every day of a year. Seven shelves of fifty-two, and one.
// ---------------------------------------------------------------------------

const VALUED = [
  "Değerlisin, çünkü hayatıma girdiğinden beri günlerimin bir adı var.",
  "Bir şey yapman gerekmiyor; olduğun gibi olman bana yetiyor.",
  "Arada bunca yol varken bana vakit ayırıyorsun. Bunun ne demek olduğunu biliyorum.",
  "Öğretmen olmayı seçtin. Bir şeyi sabırla anlatmayı seçen birine hayran olmamak zor.",
  "Adın üç harf ama içine koca bir insan sığıyor: Eln.",
  "Seni tanıdıktan sonra “uzak” kelimesi bana eskisi kadar uzak gelmiyor.",
  "Değerlisin, çünkü yanımda değilken bile bana iyi geliyorsun.",
  "Senin günün iyi geçince benimki de iyi geçmiş sayılıyor.",
  "Kendi dünyan var; derslerin, şehrin, sevdiğin şeyler. O dünyada bana da yer olması benim için çok şey.",
  "Seninle ilgili en sevdiğim şey, tek bir tane olmaması.",
  "İnsan birini neden sevdiğini tek cümleyle anlatamıyorsa doğru kişiyi sevmiştir. Ben anlatamıyorum.",
  "Değerlisin; bunun için kanıtlaman gereken hiçbir şey yok.",
  "Küçük şeylere sevinebiliyorsun. Bir fiyonk, bir kedi… Bunu hiç kaybetme.",
  "Sesinin bende bıraktığı sakinlik bile, tek başına, seni değerli kılmaya yeter.",
  "Bir gün birilerinin “en sevdiğim hocam” dediği kişi olacağından eminim.",
  "Hayatımdaki en güzel “iyi ki”lerden birisin.",
  "Bakü'yü hiç görmedim ama sırf sen oradasın diye seviyorum.",
  "Seninle bir şeyi paylaşmak, o şeyi iki kat güzel yapıyor.",
  "Değerlisin, çünkü seni tanıdıktan sonra kendime de daha iyi davranmaya başladım.",
  "Kimseye benzemeye çalışmıyorsun. En çok buna güveniyorum.",
  "Bazı insanlar bir odaya girince ortam değişir. Sen bir sohbete girince benim günüm değişiyor.",
  "Emek veriyorsun; okuluna, sevdiklerine, bize. Bunu görüyorum.",
  "Seninleyken, uzaktan bile, kendim gibi olabiliyorum.",
  "Değerlisin, çünkü “biz” kelimesini senden sonra sevdim.",
  "Bir insanın varlığı bu kadar yoldan hissedilebiliyorsa, o insan özeldir.",
  "Seni birine anlatmaya kalksam nereden başlayacağımı bilemem. Bu da bir cevap sanırım.",
  "Senin için hazırlanmış bu sayfalar az bile. Daha fazlasını hak ediyorsun.",
  "Yorulduğun günlerde de değerlisin. Hatta en çok o günlerde.",
  "Bir şeyi sevince tam seviyorsun. Hello Kitty de bunun kanıtı.",
  "Seninle tanışmak, hayatımda kendiliğinden güzel giden nadir şeylerden biri.",
  "Değerlisin, çünkü bana sabretmeyi sevdirdin.",
  "Sana yazarken kelimelerimi seçiyorum. Bunu herkes için yapmıyorum.",
  "Günün içinde aklıma kaç kez geldiğini saysam bu sayfa yetmezdi.",
  "İyi bir insan olduğunu bilmek için yanında olmaya gerek yokmuş.",
  "Seni tanımak bana şunu öğretti: yakınlık kilometreyle ölçülmüyor.",
  "Değerlisin; kusursuz olduğun için değil, gerçek olduğun için.",
  "Başka bir şehirde, başka bir saatte yaşıyorsun ama günümün tam ortasındasın.",
  "Bana verdiğin en güzel şey zamanın. Kıymetini biliyorum.",
  "Sana “hayatım” derken abartmıyorum; kelimenin tam anlamını kastediyorum.",
  "Birinin hayatında özel biri olmak kolay değil. Sen bunu hiç çabalamadan yapıyorsun.",
  "Değerlisin, çünkü seninle sessizlik bile boş gelmiyor.",
  "Hangi dili konuşursan konuş, benim en sevdiğim cümleler senin kurdukların.",
  "Sana güveniyorum. Yazması kolay, hissetmesi nadir bir şey bu.",
  "Kendi yolunu çiziyorsun. Ben o yolun kenarında seni alkışlayan kişi olmak istiyorum.",
  "Her şeyin hızla tüketildiği bir zamanda, seninle her şey yavaş ve gerçek.",
  "Değerlisin, çünkü seni düşünmek bile günümü toparlıyor.",
  "Bir gün öğrencilerin seni ne kadar sevdiğini anlatacak. Ben “biliyordum” diyeceğim.",
  "Seninle ilgili yeni bir şey öğrenmek hâlâ hoşuma gidiyor.",
  "Bu dünyada bir yerin var; onu bir sayfaya değil, kalbime yazdım.",
  "Değerlisin aşkım. Bugün bunu sebep göstermeden söylemek istedim.",
  "İnsan sevdiği kişinin iyi olmasını ister. Ben en çok bunu istiyorum: iyi ol.",
  "Neden mi değerlisin? Sen, sen olduğun için.",
];

const TRACES = [
  "Artık saate bakınca iki saat görüyorum: benimki ve seninki.",
  "Hava durumuna bakarken Bakü'yü de açıyorum. Ne zaman başladı bilmiyorum.",
  "Güzel bir şey görünce ilk düşüncem şu oluyor: “Eln bunu görmeli.”",
  "Telefonumda en çok baktığım şey senin fotoğrafın.",
  "Pembe bir fiyonk gördüğüm an aklıma sen geliyorsun. Artık kaçışı yok.",
  "Seni tanıdıktan sonra haritada Hazar'ın kıyısına daha uzun bakıyorum.",
  "“Anılar” çalınca nerede olursam olayım bir an duruyorum.",
  "Bir yerde Hello Kitty görünce içimden gülümsemeden geçemiyorum.",
  "Artık “iyi geceler” derken bir saat ileriyi düşünüyorum.",
  "İngilizce bir kelime duyunca “Eln bunu nasıl öğretirdi” diye düşünüyorum.",
  "Sabah uyanınca aklıma gelen ilk şeylerden birisin.",
  `Takvimde ${MET_DAY} ve ${TOGETHER_DAY} artık sıradan günler değil.`,
  "Bakü ile ilgili bir haber görünce durup okuyorum.",
  "Benden bir saat öndesin; yeni günü hep önce sen görüyorsun.",
  "Beklemeyi sevmezdim. Seninle beklemenin de güzel bir tarafı olduğunu öğrendim.",
  "Uçak sesi duyunca yukarı bakıyorum; hangi yöne gittiğini merak ediyorum.",
  "Bir şey yazarken artık daha özenliyim. Sana yazmaya alışınca öyle oluyor.",
  "İstanbul'da yürürken bazı yerleri aklıma not ediyorum: “Burayı Eln'e göstereceğim.”",
  "Ay'a bakınca aynısını senin de görebildiğini düşünüyorum.",
  "Günümü anlatacak biri olduğunu bilmek, günü yaşama biçimimi değiştirdi.",
  "Eskiden mesafe benim için bir sayıydı. Şimdi bir his.",
  "Artık “aşkım” dediğimde aklımda tek bir kişi var.",
  "Senin oralardan bir kelime duyunca kulağım hemen oraya gidiyor.",
  `${HER_BIRTHDAY} benim için artık iki kere bayram.`,
  "Çay demlerken bile aklıma geliyorsun; sizde de çay bu kadar ciddiye alınıyormuş.",
  "Aramızdaki bir saat bana şunu öğretti: sevdiğin biri için saat hesaplamak yük değil.",
  "İçimde sana ayrılmış bir yer var; orası hiç boş kalmıyor.",
  "Küçük şeyleri fark etmeye başladım. Sana anlatacak olmak yüzünden.",
  "Bir yere giderken “bir gün buraya birlikte geliriz” diye düşünmek alışkanlık oldu.",
  "Bana en çok yakışan hâlim, seni düşünürkenki hâlim.",
  "Sayende bir şehri görmeden sevmeyi öğrendim.",
  "Telefonum titreyince hâlâ “o mu?” diye bakıyorum.",
  "Daha sakin biri oldum. Bunda payın var.",
  "Bazı cümleleri artık senin okuyacağını düşünerek kuruyorum.",
  "Kelimelerin kıymetini senden sonra anladım; uzaktayken elimizdeki en büyük şey onlar.",
  "gartic.io'yu açınca artık oyunu değil, o oyunun bana dolaylı yoldan seni getirmiş olmasını düşünüyorum.",
  "Yıldızlara bakınca artık bu sayfadaki evreni hatırlıyorum.",
  "Bir gün bavul hazırlayacağım düşüncesi bile iyi geliyor.",
  "İçimde bir yer hep Bakü saatiyle çalışıyor.",
  "İyi bir haber alınca anlatmak istediğim ilk kişi sensin.",
  "Kötü bir günün sonunda aklıma gelince omuzlarım iniyor.",
  "Sayende “sonra” kelimesinden korkmuyorum; sonrası güzel.",
  "Sesini duyduktan sonra günün geri kalanı daha kolay geçiyor.",
  "Kedi görünce gülümsüyorum. Bunun sorumlusu belli.",
  "Hayatıma bir ritim geldi: senin günün, benim günüm, ikisinin kesiştiği saatler.",
  "Sayende bir şeyi acele ettirmeden sevmeyi öğreniyorum.",
  "Bir kafede boş bir sandalye görünce karşısına seni koyuyorum.",
  "İstanbul'u artık sana anlatacak gözle geziyorum.",
  "Bir dilek tutmam gerekince artık düşünmeme gerek kalmıyor.",
  "Uzaktaki birini düşünmenin insanı yormadığını, aksine dinlendirdiğini seninle öğrendim.",
  "Bende bıraktığın en büyük iz: daha çok gülümsüyorum.",
  "Seni tanımadan önceki hâlime dönmek istemezdim.",
];

const DETAILS = [
  "Adını yazarken üç harfte bitirmeyi seviyorum: Eln.",
  "Tam adın Elnare. Söylerken sonundaki “e” içimde hep biraz uzuyor.",
  "Benden bir saat ileride yaşıyorsun. Geleceğe benden önce varıyorsun.",
  "Hello Kitty sevmen. Ciddi bir insanın içinde tatlı bir köşe olması.",
  "Fiyonklara olan zaafın. Bu sayfalardaki her fiyonk o yüzden.",
  "Öğretmen olacak olman. “Teacher Eln” kulağa çok yakışıyor.",
  "Fotoğraflarına her baktığımda yeni bir şey fark etmem.",
  "Bakü'nün senin şehrin olması. Bir şehri güzelleştirmek için bu yetiyor.",
  "Bazı kelimeleri farklı söylüyoruz. O farkı çok seviyorum.",
  "Doğum gününün baharda olması. Sana yakışan mevsim.",
  "Benim doğum günüm sonbaharda, seninki baharda. Yılın iki ucundan birbirimize bakıyoruz.",
  `Tanıştığımız günün bir ${MET_WEEKDAY} olması. Haftanın o günü artık bana başka görünüyor.`,
  `Sevgili olduğumuz günün bir ${TOGETHER_WEEKDAY} olması. Takvimde en sevdiğim gün.`,
  `Tanışmamızla “biz” olmamızın arasında tam ${GAP} gün olması.`,
  "Aynı Ay'a bakabilmemiz. Aradaki yol buna engel değil.",
  "Mesajlarının ekranımda belirişi.",
  "Sana “Eln” demek. Kısa, yumuşak, sana ait.",
  "İki şehrimizin de deniz kıyısında olması. Sen Hazar'a bakıyorsun, ben Boğaz'a.",
  "İki şehrin de rüzgârlı olması. Bakü'ye “rüzgârlar şehri” derlermiş; İstanbul da altta kalmaz.",
  "Sizde de çayın önemli olması. Bir gün aynı demlikten içmek istiyorum.",
  "Senin için hazırladığım bu yerde her rengin sana göre seçilmiş olması.",
  "Günün benden önce başlıyor. Ben uyanırken sen çoktan bir saat yol almış oluyorsun.",
  "Yeni yıla benden bir saat önce giriyorsun.",
  "Okuduğun bölümün adı bile hoşuma gidiyor: İngilizce öğretmenliği.",
  "Bir gün sen birilerine İngilizce öğretirken, benim de sana öğretecek bir şeyim olsun isterim: İstanbul'un sokakları.",
  "Adının baş harfiyle benimkinin yan yana durması: E ve A.",
  "Bu sayfalarda adının geçtiği her yer. Bilerek çok koydum.",
  `Aramızdaki mesafenin yaklaşık ${KM} kilometre olması değil; her gün biraz daha az gibi gelmesi.`,
  "Senin şehrinde güneşin benimkinden önce doğması.",
  "Güneş önce sana uğruyor, sonra bana geliyor. Aynı güneş.",
  "Fotoğraflarındaki o sakin hâl.",
  "Pembe ve tonları. Artık sana ait renkler.",
  "Birbirimize “Mosi” dememiz. Kimse anlamıyor; anlamaları da gerekmiyor.",
  "Senin günün bitmek üzereyken benimkinin biraz daha sürmesi. O bir saatte hep seni düşünüyorum.",
  "Takvimde ikimize ait günler olması. Daha fazlası gelecek.",
  "Adını telefonumda görmek.",
  "Senin “Bakü”n, benim “İstanbul”um. İki ayrı kelime, tek bir cümle.",
  "Henüz görmediğim hâlde bildiğimi sandığım şeyler: yürüyüşün, bir odaya girişin. Bir gün karşılaştırmak istiyorum.",
  "Telefonun öbür ucunda senin sesin olduğunu bilmek.",
  "“Posi” dediğimde ne demek istediğimi yalnızca senin bilmen.",
  "İkimizin de öğrenci olması. Aynı dönemin içindeyiz: sınavlar, ödevler, uykusuz geceler.",
  "İkimiz de aynı oyunu oynuyormuşuz ama tanışmamız için Nehir gerekmiş. Hayatın çizdiği en güzel şey bu.",
  "Bir gün “hocam” diye çağrılacak olman.",
  "Hello Kitty fiyongunu sol kulağına takarmış. Bunu bilmem tamamen senin yüzünden.",
  "Sana ait olan her şeyin bende bir karşılığı olması: bir renk, bir şarkı, bir tarih.",
  "Bu satırı okurken yüzünde oluşan ifadeyi hayal edebilmek.",
  "İki ayrı ülkede aynı şarkıyı sevebilmek.",
  "Senden gelen tek bir kelimenin günümü başlatabilmesi.",
  "Aramızda bir sınır var ama aklım oradan hiç durmadan geçiyor.",
  "Saat farkı yüzünden sana “günaydın” derken aslında biraz geç kalmış olmam.",
  "İki şehirde de bir Kız Kulesi olması. Bunu bir işaret saymaya karar verdim.",
  "Senin hakkında bildiğim her küçük şey. Bilmediklerim de: onları öğrenecek olmak.",
];

const DREAMS = [
  "Bir gün havalimanında, kalabalığın içinde seni ilk ben fark etmek istiyorum.",
  "Aynı masada çay içmek. Demliği kim daha iyi demliyor, orada karar veririz.",
  "İstanbul'da vapura binip seni martılarla tanıştırmak.",
  "Bakü'de senin her gün yürüdüğün bir sokakta yanında yürümek.",
  "Hazar'ın kıyısında oturup hiçbir şey konuşmamak.",
  "Boğaz'a karşı sana simit ısmarlamak.",
  "Aynı filmi aynı odada izlemek; durdurup yorum yapma hakkı ikimizde de olsun.",
  "Sana yüz yüze “günaydın” demek.",
  "İlk fotoğrafımızı çekmek. Bu dünyanın en güzel karesi o olacak.",
  "Yağmurlu bir günde tek şemsiyenin altına sığışmak.",
  "Senin sevdiğin bir yemeği senin şehrinde tatmak.",
  "Sana İstanbul'un en güzel gün batımını göstermek.",
  "Birlikte markete gitmek gibi sıradan bir şey. En çok bunu merak ediyorum.",
  "Bir kafede sen ders çalışırken karşında sessizce oturmak.",
  "Elini tutarak bir caddeyi baştan sona yürümek.",
  "Aynı gökyüzüne bu kez aynı yerden bakmak.",
  "Bir gün ilk dersinden çıkmanı sınıfının kapısında beklemek.",
  "Bir gece saat farkını hesaplamadan “uyudun mu?” diye sormak; çünkü yan odadasın.",
  "Sana bir Hello Kitty alıp tepkini kendi gözlerimle görmek.",
  "Bakü'de İçerişehir'in dar sokaklarında kaybolmak; yolu sen bulursun.",
  "Kız Kulesi'ni iki kez görmek: biri senin şehrinde, biri benimkinde.",
  "Galata'dan şehre bakarken sana “işte burası” demek.",
  "Uzun bir yolculukta yan koltukta uyuyakalmanı izlemek.",
  "Doğum gününde mumları üflerken orada olmak.",
  "Kendi doğum günümde dileğimi tutarken sana bakmak.",
  "Bir sabah kahvaltıyı ben hazırlarım; beğenmezsen dürüst ol.",
  "Yan yana oturup aynı ekranda gartic.io oynamak; çizimlerime gülmek serbest.",
  "Sana kendi mahallemi gezdirmek.",
  "Çocukluğunun geçtiği yerleri senden dinleyerek görmek.",
  "Sahilde yürürken rüzgârdan şikâyet etmek; iki şehir de bu konuda iddialı.",
  "Aynı kulaklığı paylaşıp “Anılar”ı birlikte dinlemek.",
  "Bir akşam yemek yapmaya çalışıp sonunda dışarıdan söylemek.",
  "Fotoğrafını ekrandan değil, karşımdan çekmek.",
  `${MET_DAY} gününü bir yıl aynı şehirde karşılamak.`,
  `${TOGETHER_DAY} günü sana elimle yazdığım bir mektubu elden vermek.`,
  "Kar yağarken sıcak bir yerde oturup dışarıyı seyretmek.",
  "Bir kitapçıda ayrı ayrı gezip kasada buluşmak.",
  "Sana Türk kahvesi yapmak. Falına bakmayı da denerim; tutmazsa güleriz.",
  "Senin dilinden bir şarkıyı senden dinlemek.",
  "Sesini bir gün telefondan değil, yanı başımdan duymak.",
  "Bir gün bu sayfaları birlikte açıp “bunu yazarken şunu düşünüyordum” diye anlatmak.",
  "Seni şehrimle, sevdiğim sokaklarla tanıştırmak.",
  "Bir pazar sabahı hiçbir plan yapmamak; birlikte.",
  "Seni uğurlamak zorunda kalmadığım bir akşam.",
  "Bir dondurmayı paylaşıp son lokma için pazarlık etmek.",
  "Trenle bir yere gitmek; camdan dışarıyı sen izle, ben seni.",
  "Aynı günün aynı saatini yaşamak. Bir saat farksız.",
  "Sana “Posi” derken yüzüne bakabilmek.",
  "Sen ders çalışırken sana çay getirmek.",
  "Yürürken adımlarımızın kendiliğinden aynı tempoya gelmesi.",
  "“Görüşürüz” dediğimizde ertesi günü kastetmek.",
  "Bunların hepsini değil, bir tanesini bile seninle yaşamak yeter.",
];

const THOUGHT = [
  "Bugün de aklımdasın hayatım. Haber olsun diye yazıyorum.",
  "Günün nasıl geçerse geçsin, sonunda burada sana ait bir cümle var.",
  "Şu an sende saat bir ileri. Umarım o bir saat güzel geçmiştir.",
  "Bugün kendine iyi davran; benim yerime de.",
  "Bazı günler uzun geliyor. Seni düşününce kısalıyor.",
  "Bugün bir şey seni gülümsetsin diye diledim.",
  "Yorgunsan dinlen. Dünya biraz bekleyebilir.",
  "Bugün için tek bir dileğim var: iyi ol.",
  "İstanbul'dan Bakü'ye bugünkü selam yola çıktı.",
  "Bugün seni düşünmek için özel bir sebep aramadım.",
  "Derslerin yoğunsa bil ki buradan biri sana güveniyor.",
  "Günün içinde küçük bir mola ver. Bu not o mola olsun.",
  "Bugün gökyüzüne bak; ben de bakacağım.",
  "Her gün aynı şeyi söylemek istemiyorum ama her gün aynı şeyi hissediyorum.",
  "Bugünün notu kısa: iyi ki varsın.",
  "Hava nasıl olursa olsun, bugün içim sana doğru açık.",
  "Gün içinde bir yerde durup “Eln şimdi ne yapıyor” diye düşünüyorum. Muhtemelen birden fazla kez.",
  "Sabahın güzel başlasın, akşamın huzurlu bitsin.",
  "Bugün canın bir şeye sıkılırsa, bu sayfanın senin tarafında olduğunu hatırla.",
  "Küçük bir hatırlatma: su iç, bir şeyler ye, kendini yorma.",
  "Bugün de aynı gökyüzünün altındayız. Bu bana yetiyor.",
  "İyi bir gün geçiriyorsan sevindim. Kötüyse, geçecek.",
  "Bugün sana söyleyecek büyük bir şeyim yok. Küçük olanı: seni seviyorum.",
  "Günler birbirine benzese de seni düşündüğüm an her gün başka.",
  "Sabırlı olmam gereken günlerde aklıma sen geliyorsun; kolaylaşıyor.",
  "Bugünün notu üç kelime: seni çok seviyorum.",
  "Günaydın aşkım. Saat kaç olursa olsun; okuduğun an günaydın.",
  "Bugün için dileğim: seni yoran her şey biraz hafiflesin.",
  "Şu an ne yapıyorsan yap, içinde biraz da kendine vakit ayır.",
  "Bugün dünyada güzel bir şey oldu: sen bu satırı okudun.",
  "Bugün de buradayım. Bir yere gittiğim yok.",
  "Mosi, bugün de seni düşünen biri var. Kim olduğunu tahmin etmek zor değil.",
  "Günün en sakin anı sana gelsin.",
  "Bugün bir şeyi başaramadıysan yarın da var. Ben ikisinde de senin tarafındayım.",
  "Aklımdan geçenlerin yarısını yazsam bu sayfa dolar. Bugünlük bu kadar: özledim.",
  "Bugün sana iyi gelecek tek bir şey seç ve onu yap.",
  "Hiçbir şey söylemek zorunda değilsin. Bu not karşılık beklemiyor.",
  "Bugün bir yerde bir fiyonk gördüysen, o benden.",
  "Gün bitmeden: bugün de yeterince iyiydin.",
  "Uyumadan önce bir kez gülümse. Sebebi ben olayım.",
  "Yarın için endişelenme. Bugün bitti ve sen iyi iş çıkardın.",
  "Bugün bir şeye sevindiysen ben de sevindim. Bilmesem de.",
  "İçin daralırsa pencereyi aç. Aynı rüzgâr bir gün bana da uğrar.",
  "Senin için güzel bir cümle ararken en güzeli hep adın çıkıyor.",
  "Kendine yüklenme. Her şeyi aynı gün çözmek zorunda değilsin.",
  "Bugün biri sana “iyi ki varsın” dedi mi? Demediyse ben diyeyim.",
  "Bir gün daha geçti. Yani bir gün daha yaklaştık.",
  "Ne kadar meşgul olursan ol, bir yerlerde senin için duran sakin bir köşe var. Burası.",
  "Bugün yalnızca şunu bilmeni istiyorum: aklımda güzel bir yerdesin.",
  "Akşam olunca şehrin ışıkları yanıyor. Ben o sırada seni düşünüyorum.",
  "Bugünün kelimesi: sabır. Yarınınki: sen.",
  "Başını yastığa koyduğunda şunu bil: bugün biri seni çok düşündü.",
  "Bu, yılın notlarından yalnızca biri. Ama hepsinin söylediği aynı: iyi ki varsın.",
];

const THANKS = [
  "Hayatımda olduğun için teşekkür ederim.",
  "Bana ayırdığın her dakika için teşekkür ederim. Kolay olmadığını biliyorum.",
  "Bana yazdığın her şey için; kısa olanlar için de, uzun olanlar için de.",
  "Beni olduğum gibi dinlediğin için teşekkür ederim.",
  "Uzakta olmayı bir engel gibi görmediğin için.",
  "Sabrın için teşekkür ederim. Bazen benim yerime de sabrediyorsun.",
  "Günlerime bir anlam kattığın için.",
  "“Biz” dediğin için teşekkür ederim.",
  "Bana Bakü'yü sevdirdiğin için. Henüz görmeden.",
  "Kendi dünyanı benimle paylaştığın için.",
  "Yorgun olduğun günlerde bile orada olduğun için.",
  "Bana güvendiğin için teşekkür ederim. Bunu hafife almıyorum.",
  "Beni daha iyi biri olmaya özendirdiğin için.",
  "Küçük şeylere sevinmeyi hatırlattığın için.",
  "İçimdeki acele eden tarafı yavaşlattığın için.",
  "Bir şarkıyı bana ait kıldığın için; her çaldığında sen geliyorsun.",
  "Bu sayfaları hazırlamam için bana bir sebep olduğun için.",
  "Var olduğun için. Bundan daha kısa söyleyemem.",
  "Günümün nasıl geçtiğini merak ettiğin için teşekkür ederim.",
  "Bana kendimi anlatma cesareti verdiğin için.",
  "Aramızdaki bir saati hiç dert etmediğin için.",
  "Beni güldürdüğün her an için.",
  "Bana kelimelerin değerini öğrettiğin için.",
  `${TOGETHER_DAY} için teşekkür ederim. O günü ikimiz yaptık.`,
  `${MET_DAY} için. O gün orada olduğun için.`,
  "Bana beklemenin de bir tür sevgi olduğunu gösterdiğin için.",
  "Bazen hiçbir şey söylemeden anladığın için.",
  "Hayallerime ortak olduğun için.",
  "Beni düşündüğünü hissettirdiğin her an için.",
  "İçtenliğin için teşekkür ederim. Seninle rol yapmam gerekmiyor.",
  "Sesini benimle paylaştığın her konuşma için.",
  "Her şeye rağmen değil, her şeyle birlikte burada olduğun için.",
  "Kendin olduğun için. En çok buna teşekkür ederim.",
  "Bana iyi geldiğin için; bunu yaptığının farkında olmasan da.",
  "Paylaştığın her fotoğraf için. Hepsi bende çok iyi saklanıyor.",
  "Bana “iyi geceler” dediğin her gece için.",
  "Benimle aynı gökyüzüne baktığın için.",
  "Emeğin için. Bir ilişkiyi bu kadar yoldan taşımak emek ister; seninkini görüyorum.",
  "Nehir'e de teşekkür ederim; o grup olmasaydı bu sayfa da olmazdı.",
  "Bir gün “iyi ki” diyeceğimi bildiğim her şey için, şimdiden.",
  "Hayatıma renk getirdiğin için. Çoğunlukla pembe.",
  "Sana yazarken kendimi bulduğum için; bunu sen sağladın.",
  "Beni sıradan bir günün içinde bile özel hissettirdiğin için.",
  "Bana “Mosi” dediğin her an için.",
  "Bana anlattığın her küçük ayrıntı için. Hepsini aklımda tutuyorum.",
  "Olmadığın biri gibi davranmadığın için.",
  "Benimle ilgilendiğin kadar kendinle de ilgilendiğin için. Lütfen buna devam et.",
  "Bu satırı okuduğun için bile teşekkür ederim.",
  "Bana bir “sonra” verdiğin için; beklemeye değer bir sonra.",
  "Kalbindeki yer için.",
  "Teşekkür etmeyi unuttuğum her şey için de teşekkür ederim.",
  "İyi ki varsın. Bu da bir teşekkür.",
];

const MISSING = [
  "Henüz yaşamadığımız anları özlüyorum. Bu mümkünmüş.",
  "Seni özlemek, günün içinde ansızın duran bir saat gibi.",
  "Bugün seni biraz fazla özledim. Şikâyet değil, bilgi.",
  "Özleyince fotoğrafına bakıyorum. Yetmiyor ama iyi geliyor.",
  "Sana hiç sarılmadım ama bunu özlüyorum.",
  "Yanında hiç yürümediğim sokakları özlüyorum.",
  "Sesini çok duydum ama karşımdan hiç duymadım. En çok onu özlüyorum.",
  "Özlemek bazen bir ağırlık değil, bir sıcaklık.",
  "Bir yerde iki kişilik bir masa görünce özlüyorum.",
  "Akşamüstleri daha çok özlüyorum. Gün bitiyor ya, sana anlatacak şey birikiyor.",
  "Seni özlediğimde saate bakıyorum; sende kaç olduğunu hesaplıyorum.",
  "Bazen bir mesajını yeniden okuyorum. Özlemin en kolay ilacı o.",
  "Özlüyorum; ama acele ettirmeden.",
  `Şehir kalabalık, ben birini arıyorum. O kişi burada değil; ${KM} kilometre ötede.`,
  "Özlemek, seni sevmenin uzaktan söyleniş biçimi.",
  "İstanbul güzel bir şehir. Sen de burada olsan daha güzel olurdu.",
  "Bir gün “özledim” yazmak yerine kapını çalabilmek istiyorum.",
  "Gece olunca özlem biraz daha sesli konuşuyor.",
  "Özlediğimde bu sayfalara bir şey ekliyorum. O yüzden bu kadar dolu.",
  "Yan yana susmayı özlüyorum; hiç yapmadık ama nasıl olacağını biliyorum.",
  "Seni özlemek beni üzmüyor. Bir yere ait olduğumu hatırlatıyor.",
  "Uzaklık bazen fazla geliyor. Sonra aklıma sen geliyorsun, uzaklık küçülüyor.",
  "Yağmur yağınca özlüyorum. Neden bilmiyorum; yağmurun işi bu sanırım.",
  "Bir şarkı çalıyor ve sen burada değilsin. Şarkı yine de güzel.",
  "Özledim aşkım. Bugünün notu bu kadar.",
  "Güzel bir şey yediğimde “keşke o da tatsa” diyorum.",
  "Seni özlediğim zaman, karşılaşacağımız anı düşünüyorum. Her seferinde biraz farklı.",
  "Özlem bazen bir soru gibi geliyor: “Şimdi ne yapıyor?” Cevabını bilmesem de iyi olduğunu umuyorum.",
  "Sana göstermek istediğim şeyleri biriktiriyorum. Liste uzadı.",
  "Özlemek için görmüş olmak gerekmiyormuş.",
  "Aynı şehirde olsaydık şu an sana doğru yürüyor olurdum.",
  "Özlüyorum ve bunun için senden bir şey istemiyorum. Yalnızca bil.",
  "Uzun bir günün sonunda en çok sana anlatmayı özlüyorum.",
  "Yan yana gülen iki kişi görünce yerlerinde biz olalım istiyorum.",
  "Sabahları özlem daha sakin. “Günaydın” deyince geçiyor gibi.",
  "Seni özlemenin iyi yanı: bir gün biteceğini bilmek.",
  "Telefonu kapattıktan sonraki sessizlik. Seni en çok orada özlüyorum.",
  "Elim gün içinde telefona kaç kez gidiyor bilmiyorum. Çoğu senin için.",
  "Aramızdaki yol aynı; özlemim her gün biraz farklı.",
  "Özlemin bir rengi olsaydı, bu sayfaların rengi olurdu.",
  "Özlemek sabır istiyor. Sabrım var.",
  "Bazı akşamlar yalnızca yanında oturmak isterdim. Konuşmadan.",
  "Sen uyurken ben biraz daha uyanık kalıyorum; bir saatlik farkın bana bıraktığı sessizlikte seni düşünüyorum.",
  "Vapurlara bakınca içlerinde seni arıyorum. Bir gün orada ol istiyorum.",
  "Seni özlediğimi sana söylemek bile iyi geliyor.",
  "Mesafe aynı kalsa da özlem her gün yeni bir yerinden tutuyor.",
  "Bazen bir an durup “şu an burada olsaydı” diyorum. Gerisini hayal ediyorum.",
  "Özlem bazen bir fotoğrafa, bazen bir saate, bazen bir kelimeye sığıyor.",
  "En çok da sıradan şeyleri özlüyorum; seninle henüz hiç yapmadığım sıradan şeyleri.",
  "Bazen “iyi geceler” demek istemiyorum; çünkü dedikten sonra gün bitiyor.",
  "Özlüyorum. Yarın da özleyeceğim. İkisinin arasında güzel şeyler de olacak.",
  "Bir gün bu notu okurken yanımda oturuyor ol istiyorum.",
];

const SHELVES = [
  ["valued", VALUED],
  ["traces", TRACES],
  ["details", DETAILS],
  ["dreams", DREAMS],
  ["thought", THOUGHT],
  ["thanks", THANKS],
  ["missing", MISSING],
] as const;

export type WrittenNote = { category: (typeof SHELVES)[number][0]; body: string };

/**
 * The notes in the order they are added: one from each shelf in turn, so that
 * in "sequential" mode no two days in a row sound alike.
 */
export const WRITTEN_NOTES: WrittenNote[] = (() => {
  const longest = Math.max(...SHELVES.map(([, lines]) => lines.length));
  const notes: WrittenNote[] = [];
  for (let i = 0; i < longest; i++) {
    for (const [category, lines] of SHELVES) {
      if (lines[i]) notes.push({ category, body: lines[i] });
    }
  }
  return notes;
})();

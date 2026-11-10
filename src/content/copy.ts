/**
 * The world's own voice: the short lines that open each room and the ones
 * shown while a room is still empty. Kept together so the tone can be read —
 * and changed — in one place.
 *
 * The tone: warm, plain, unhurried. Nothing here asks Eln for anything.
 */
export const COPY = {
  gallery: {
    lead: "Bu fotoğrafların hepsi sensin. Ben yalnızca yan yana dizdim.",
    emptyTitle: "Henüz fotoğraf yok",
    empty: "Fotoğraflar eklendiğinde burada, yan yana duracaklar.",
    addOwn: "İstersen sen de fotoğraf ekleyebilirsin.",
  },
  letters: {
    lead: "Her zarfın içinde sana yazılmış bir şey var. Sırası yok, acelesi yok; hangisine dokunursan o açılır.",
    emptyTitle: "Henüz bir mektup yok",
    emptyPartner: "İlk mektup yazıldığında burada senin için bir zarf duracak.",
    emptyOwner: "İlk mektubunu yazdığında burada bir zarf belirecek.",
    sealedTitle: "Günü gelince",
    sealedLead: "Bu zarfların günü henüz gelmedi. O sabah kendiliğinden açılacaklar.",
    addOwn: "İstersen sen de bir mektup bırakabilirsin.",
  },
  reasons: {
    lead: "Her güne küçük bir not. Dünküler de aşağıda, yerli yerinde duruyor.",
    leadFirstDay: "Her güne küçük bir not. Bugünkü burada.",
    emptyTitle: "Henüz bir not yok",
    empty: "İlk not yazıldığında burada, o günün tarihiyle duracak.",
  },
  capsules: {
    lead: "Bugünden geleceğe bırakılanlar. Günü gelince kendiliğinden açılırlar; o güne kadar yalnızca adları görünür.",
    emptyTitle: "Henüz bir kapsül yok",
    empty: "Geleceğe bir şey bırakıldığında burada, gününü bekleyecek.",
    addOwn: "İstersen sen de geleceğe bir şey bırakabilirsin.",
  },
  days: {
    lead: "Takvimde bize ait günler. Her yıl yeniden geliyorlar; en yakını en üstte.",
    emptyTitle: "Henüz özel bir gün yok",
  },
  voice: {
    lead: "Bazı şeyler yazınca eksik kalıyor. Onlar burada, sesle duruyor.",
    empty: "Henüz bir ses kaydı yok. İlk kayıt ikimizden birinin sesi olacak.",
  },
  journal: {
    lead: "İkimizin defteri. Yazmak zorunda olan yok; taslaklar ve “yalnızca ben” kayıtları yazanda kalır.",
  },
  questions: {
    lead: "Puan yok, süre yok, doğru cevap yok. İstediğine, istediğin zaman yaz.",
    leadEmpty: "Henüz soru yok. Kendi sorunu ekleyebilir ya da başlangıç sorularıyla başlayabilirsin.",
  },
  future: {
    leadEmpty: "Birlikte yapmak istediklerimizin listesi. Henüz boş; ilk hayali ikimizden biri ekleyebilir.",
  },
  corner: {
    lead: "Burası tamamen senin. Rengini seç, fiyonk tak, sticker diz; ne yaparsan yalnızca sana görünür.",
  },
  story: {
    addOwn: "İstersen sen de bir anı ekleyebilirsin.",
    meetingUnknown: "Henüz bir tarihi yok. Belli olduğunda bu bölüm buradan devam edecek.",
  },
} as const;

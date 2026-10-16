import { cat, type Category } from './types';

/**
 * Everyday shelves (tiers 1–2): homes, food, animals and places that every
 * player knows, so the first chapters never feel like a vocabulary test.
 */
export const EVERYDAY: Category[] = [
  cat('months', 1, 'Aylar|Months|Monate|Meses', {
    tr: 'ocak,şubat,mart,nisan,mayıs,haziran,temmuz,ağustos,eylül,ekim,kasım,aralık',
    en: 'January,February,March,April,May,June,July,August,September,October,November,December',
    de: 'Januar,Februar,März,April,Mai,Juni,Juli,August,September,Oktober,November,Dezember',
    es: 'enero,febrero,marzo,abril,mayo,junio,julio,agosto,septiembre,octubre,noviembre,diciembre',
  }, { excl: ['time'] }),
  cat('pets', 1, 'Evcil hayvanlar|Pets|Haustiere|Mascotas', {
    tr: 'köpek,kedi,hamster,tavşan,japon balığı,kobay,muhabbet kuşu,çinçilla,beyaz fare',
    en: 'dog,cat,hamster,rabbit,goldfish,guinea pig,ferret,chinchilla,gerbil',
    de: 'Hund,Katze,Hamster,Kaninchen,Goldfisch,Meerschweinchen,Frettchen,Chinchilla,Rennmaus',
    es: 'perro,gato,hámster,conejo,pez dorado,cobaya,hurón,chinchilla,jerbo',
  }, { excl: ['domestic'] }),
  cat('tableware', 1, 'Sofra takımı|Tableware|Geschirr|Vajilla y cubiertos', {
    tr: 'çatal,bıçak,kaşık,tabak,kase,fincan,bardak,kupa bardak,peçete,tepsi,fincan tabağı,sürahi',
    en: 'fork,knife,spoon,plate,bowl,cup,glass,mug,napkin,tray,saucer,jug',
    de: 'Gabel,Messer,Löffel,Teller,Schüssel,Tasse,Glas,Becher,Serviette,Salzstreuer,Untertasse,Krug',
    es: 'tenedor,cuchillo,cuchara,plato,cuenco,taza,vaso,tazón,servilleta,bandeja,salero,jarra',
  }, { excl: ['kitchen'] }),
  cat('toys', 1, 'Oyuncaklar|Toys|Spielzeug|Juguetes', {
    tr: 'oyuncak bebek,oyuncak ayı,top,yoyo,yapboz,bilye,topaç,lastik ördek,oyuncak araba,atlama ipi',
    en: 'doll,teddy bear,ball,yo-yo,jigsaw puzzle,marbles,spinning top,rubber duck,toy car,jump rope',
    de: 'Puppe,Teddybär,Bauklötze,Jo-Jo,Puzzle,Murmeln,Kreisel,Quietscheente,Spielzeugauto,Springseil',
    es: 'marioneta,osito de peluche,pelota,yoyó,puzle,canicas,peonza,bloques de construcción,cochecito,comba',
  }, { excl: ['play'] }),
  cat('face', 1, 'Yüzümüz|The face|Das Gesicht|La cara', {
    tr: 'kaş,kirpik,çene,yanak,alın,dudak,diş,gamze,şakak,göz kapağı',
    en: 'eyebrow,eyelash,chin,cheek,forehead,lip,tooth,tongue,temple,eyelid',
    de: 'Augenbraue,Wimper,Kinn,Wange,Stirn,Lippe,Zahn,Zunge,Schläfe,Augenlid',
    es: 'ceja,pestaña,barbilla,mejilla,frente,labio,diente,pómulo,sien,párpado',
  }, { excl: ['body'] }),
  cat('candy', 1, 'Şekerlemeler|Sweets & candy|Süßigkeiten|Golosinas', {
    tr: 'lolipop,jelibon,pamuk şeker,marşmelov,karamel,horoz şeker,sakız,akide şekeri,bonbon,draje',
    en: 'lollipop,gummy bear,cotton candy,marshmallow,caramel,licorice,chewing gum,rock candy,bonbon,jelly bean',
    de: 'Lutscher,Gummibärchen,Zuckerwatte,Marshmallow,Karamell,Lakritz,Kaugummi,Zuckerstange,Bonbon,Weingummi',
    es: 'piruleta,osito de gominola,algodón de azúcar,malvavisco,caramelo,regaliz,chicle,bastón de caramelo,bombón,gominola',
  }, { excl: ['dessert'] }),
  cat('party', 1, 'Doğum günü partisi|Birthday party|Geburtstagsfeier|Fiesta de cumpleaños', {
    tr: 'balon,doğum günü pastası,mum,konfeti,hediye,parti şapkası,davetiye,serpantin,pinyata,yıldız maytap',
    en: 'balloon,birthday cake,candle,confetti,present,party hat,invitation,streamer,piñata,sparkler',
    de: 'Luftballon,Geburtstagstorte,Kerze,Konfetti,Geschenk,Partyhut,Einladung,Luftschlange,Piñata,Wunderkerze',
    es: 'globo,tarta de cumpleaños,vela,confeti,regalo,gorro de fiesta,invitación,serpentina,piñata,bengala',
  }, { excl: ['dessert', 'fly'] }),
  cat('winter', 1, 'Kış|Winter|Winter|Invierno', {
    tr: 'kardan adam,kızak,eldiven,kartopu,buz sarkıtı,şömine,iglo,buz pateni,kar küresi,kayak gözlüğü',
    en: 'snowman,sled,mittens,snowball,icicle,fireplace,igloo,ice skates,snow globe,earmuffs',
    de: 'Schneemann,Schlitten,Fäustlinge,Schneeball,Eiszapfen,Kamin,Iglu,Schlittschuhe,Schneekugel,Ohrenschützer',
    es: 'muñeco de nieve,trineo,manoplas,bola de nieve,carámbano,chimenea,iglú,patines de hielo,copo de nieve,orejeras',
  }, { excl: ['weather', 'wear', 'sport'] }),

  cat('fast-food', 2, 'Fast food|Fast food|Fast Food|Comida rápida', {
    tr: 'pizza,hamburger,sosisli,patates kızartması,sandviç,nugget,taco,burrito,soğan halkası,tost',
    en: 'pizza,hamburger,hot dog,French fries,sandwich,nuggets,taco,burrito,onion rings,fried chicken',
    de: 'Pizza,Hamburger,Hotdog,Pommes,Sandwich,Nuggets,Taco,Burrito,Zwiebelringe,Currywurst',
    es: 'pizza,hamburguesa,perrito caliente,patatas fritas,sándwich,nuggets,taco,burrito,aros de cebolla,wrap',
  }, { excl: ['dish'] }),
  cat('footwear', 2, 'Ayakkabılar|Footwear|Schuhe|Calzado', {
    tr: 'spor ayakkabı,çizme,sandalet,terlik,topuklu ayakkabı,parmak arası terlik,babet,mokasen,kar botu,yağmur çizmesi',
    en: 'sneakers,boots,sandals,slippers,high heels,flip-flops,ballet flats,loafers,ankle boots,rain boots',
    de: 'Turnschuhe,Stiefel,Sandalen,Hausschuhe,High Heels,Flip-Flops,Ballerinas,Mokassins,Stiefeletten,Gummistiefel',
    es: 'zapatillas,botas,sandalias,pantuflas,tacones,chanclas,alpargatas,mocasines,botines,botas de agua',
  }, { excl: ['wear'] }),
  cat('garden', 2, 'Bahçe|In the garden|Im Garten|En el jardín', {
    tr: 'bahçe küreği,tırmık,sulama kabı,bahçe hortumu,el arabası,çim biçme makinesi,saksı,budama makası,tohum,çit',
    en: 'shovel,rake,watering can,hose,wheelbarrow,lawn mower,flower pot,pruning shears,seeds,fence',
    de: 'Schaufel,Rechen,Gießkanne,Schlauch,Schubkarre,Rasenmäher,Blumentopf,Gartenschere,Samen,Zaun',
    es: 'pala,rastrillo,regadera,manguera,azada,cortacésped,maceta,tijeras de podar,semillas,valla',
  }, { excl: ['tools', 'plant'] }),
  cat('baby', 2, 'Bebek eşyaları|Baby things|Babysachen|Cosas de bebé', {
    tr: 'bebek bezi,emzik,kundak,bebek arabası,çıngırak,mama önlüğü,biberon,ana kucağı,zıbın,diş kaşıyıcı',
    en: 'diaper,pacifier,diaper bag,stroller,rattle,bib,baby bottle,baby carrier,onesie,teether',
    de: 'Windel,Schnuller,Wickeltasche,Kinderwagen,Feuchttücher,Lätzchen,Babyflasche,Babybrei,Spucktuch,Beißring',
    es: 'pañal,chupete,cuna,carrito,sonajero,babero,biberón,trona,portabebés,mordedor',
  }, { excl: ['play', 'wear'] }),
  cat('office', 2, 'Ofis|In the office|Im Büro|En la oficina', {
    tr: 'zımba,ataş,dosya,yapışkan not,delgeç,zarf,mühür,klasör,beyaz tahta,evrak imha makinesi',
    en: 'stapler,paper clip,folder,sticky note,hole punch,envelope,rubber stamp,binder,whiteboard,shredder',
    de: 'Hefter,Büroklammer,Mappe,Haftnotiz,Locher,Briefumschlag,Stempel,Ordner,Whiteboard,Aktenvernichter',
    es: 'grapadora,clip,carpeta,pósit,perforadora,sobre,sello,archivador,pizarra blanca,trituradora',
  }, { excl: ['stationery'] }),
  cat('tech', 2, 'Teknoloji|Gadgets|Technik|Tecnología', {
    tr: 'akıllı telefon,dizüstü bilgisayar,tablet,kulaklık,şarj aleti,oyun konsolu,hoparlör,modem,USB bellek,powerbank',
    en: 'smartphone,laptop,tablet,headphones,charger,game console,speaker,router,USB stick,power bank',
    de: 'Smartphone,Laptop,Tablet,Kopfhörer,Ladegerät,Spielkonsole,Lautsprecher,Router,USB-Stick,Powerbank',
    es: 'smartphone,portátil,tableta,auriculares,cargador,videoconsola,altavoz,router,memoria USB,batería externa',
  }),
  cat('bakery', 2, 'Fırından|Bakery|Bäckerei|Panadería', {
    tr: 'ekmek,baget,kruvasan,poğaça,açma,bazlama,kepekli ekmek,çavdar ekmeği,tahinli çörek,ekşi mayalı ekmek',
    en: 'bread,baguette,croissant,bagel,pretzel,bread roll,brioche,focaccia,ciabatta,sourdough',
    de: 'Brot,Baguette,Croissant,Bagel,Brezel,Brötchen,Brioche,Focaccia,Ciabatta,Sauerteigbrot',
    es: 'pan,baguette,cruasán,bagel,pretzel,panecillo,brioche,focaccia,chapata,pan de masa madre',
  }, { excl: ['breakfast', 'dessert', 'dish'] }),
  cat('landforms', 2, 'Yeryüzü şekilleri|Landscapes|Landschaften|Paisajes', {
    tr: 'dağ,nehir,göl,vadi,şelale,yanardağ,çöl,ada,mağara,buzul,kanyon,ova',
    en: 'mountain,river,lake,valley,waterfall,volcano,desert,island,cave,glacier,canyon,forest',
    de: 'Berg,Fluss,Hügel,Tal,Wasserfall,Vulkan,Wüste,Insel,Höhle,Gletscher,Schlucht,Wald',
    es: 'montaña,río,lago,valle,cascada,volcán,desierto,isla,cueva,glaciar,colina,bosque',
  }),
  cat('space', 2, 'Uzay|Outer space|Weltraum|El espacio', {
    tr: 'asteroit,roket,kuyruklu yıldız,göktaşı,galaksi,uydu,teleskop,kara delik,gezegen,uzay istasyonu',
    en: 'asteroid,rocket,comet,meteor,galaxy,satellite,telescope,black hole,nebula,space station',
    de: 'Asteroid,Rakete,Komet,Meteor,Galaxie,Satellit,Teleskop,Schwarzes Loch,Sternnebel,Raumstation',
    es: 'asteroide,cohete,cometa,meteorito,galaxia,satélite,telescopio,agujero negro,nebulosa,estación espacial',
  }, { excl: ['space'] }),
  cat('exotic-fruits', 2, 'Egzotik meyveler|Exotic fruits|Exotische Früchte|Frutas exóticas', {
    tr: 'ananas,mango,kivi,Hindistan cevizi,papaya,avokado,ejder meyvesi,liçi,guava,yıldız meyvesi',
    en: 'pineapple,mango,kiwi,coconut,papaya,avocado,passion fruit,lychee,guava,star fruit',
    de: 'Ananas,Mango,Kiwi,Dattel,Papaya,Physalis,Maracuja,Litschi,Guave,Sternfrucht',
    es: 'piña,mango,kiwi,coco,papaya,aguacate,maracuyá,lichi,guayaba,carambola',
  }, { excl: ['fruit'] }),
  cat('cleaning', 2, 'Temizlik|Cleaning|Putzen|Limpieza', {
    tr: 'çalı süpürgesi,paspas,temizlik kovası,faraş,deterjan,çamaşır suyu,toz alma fırçası,lastik eldiven,ovma fırçası,çöp torbası',
    en: 'broom,mop,bucket,dustpan,detergent,bleach,feather duster,rubber gloves,scrub brush,trash bag',
    de: 'Besen,Wischmopp,Eimer,Kehrschaufel,Spülmittel,Bleichmittel,Staubwedel,Gummihandschuhe,Scheuerbürste,Müllbeutel',
    es: 'escoba,fregona,cubo de fregar,recogedor,detergente,lejía,plumero,guantes de goma,cepillo,bolsa de basura',
  }, { excl: ['clean'] }),
  cat('reptiles', 2, 'Sürüngenler ve kurbağalar|Reptiles & amphibians|Reptilien & Amphibien|Reptiles y anfibios', {
    tr: 'yılan,kertenkele,timsah,kurbağa,bukalemun,geko,iguana,kara kurbağası,semender,komodo ejderi',
    en: 'snake,lizard,crocodile,frog,chameleon,gecko,iguana,toad,salamander,Komodo dragon',
    de: 'Schlange,Eidechse,Krokodil,Frosch,Chamäleon,Gecko,Leguan,Kröte,Salamander,Komodowaran',
    es: 'serpiente,lagarto,cocodrilo,rana,camaleón,geco,iguana,sapo,salamandra,dragón de Komodo',
  }, { excl: ['wild'] }),
  cat('forest-animals', 2, 'Orman hayvanları|Forest animals|Waldtiere|Animales del bosque', {
    tr: 'sincap,geyik,kirpi,porsuk,kunduz,rakun,köstebek,yaban domuzu,vaşak,karaca',
    en: 'squirrel,deer,hedgehog,badger,beaver,raccoon,mole,wild boar,lynx,porcupine',
    de: 'Eichhörnchen,Hirsch,Igel,Dachs,Biber,Waschbär,Maulwurf,Wildschwein,Luchs,Reh',
    es: 'ardilla,ciervo,erizo,tejón,castor,mapache,topo,jabalí,lince,corzo',
  }, { excl: ['wild'] }),
  cat('turkish-cities', 2, 'Türkiye şehirleri|Turkish cities|Städte der Türkei|Ciudades de Turquía', {
    tr: 'Ankara,İzmir,Bursa,Antalya,Trabzon,Konya,Adana,Gaziantep,Eskişehir,Mardin,Kayseri,Samsun',
    en: 'Ankara,İzmir,Bursa,Antalya,Trabzon,Konya,Adana,Gaziantep,Eskişehir,Mardin,Kayseri,Samsun',
    de: 'Ankara,Izmir,Bursa,Antalya,Trabzon,Konya,Adana,Gaziantep,Eskişehir,Mardin,Kayseri,Samsun',
    es: 'Ankara,Esmirna,Bursa,Antalya,Trebisonda,Konya,Adana,Gaziantep,Eskişehir,Mardin,Kayseri,Samsun',
  }, { excl: ['geo-cities'] }),
  cat('sports-gear', 2, 'Spor malzemeleri|Sports gear|Sportgeräte|Material deportivo', {
    tr: 'raket,badminton topu,düdük,dambıl,kaykay,sörf tahtası,boks eldiveni,hokey sopası,beyzbol sopası,kale direği,madalya,kask',
    en: 'racket,shuttlecock,whistle,dumbbell,skateboard,surfboard,boxing gloves,hockey stick,baseball bat,goalpost,medal,trophy',
    de: 'Schläger,Federball,Trillerpfeife,Hantel,Skateboard,Surfbrett,Boxhandschuhe,Hockeyschläger,Baseballschläger,Torpfosten,Puck,Turnmatte',
    es: 'raqueta,volante de bádminton,silbato,mancuerna,monopatín,tabla de surf,guantes de boxeo,palo de hockey,bate de béisbol,poste,medalla,trofeo',
  }, { excl: ['sport', 'play'] }),
  cat('shops', 2, 'Dükkânlar|Shops|Geschäfte|Tiendas', {
    tr: 'kasap,manav,çiçekçi,kuaför,nalbur,kuyumcu,bakkal,börekçi,şarküteri,oyuncakçı',
    en: 'butcher shop,greengrocer,florist,stationery store,hardware store,jewelry store,newsstand,gift shop,deli,toy store',
    de: 'Metzgerei,Gemüseladen,Blumenladen,Schreibwarenladen,Baumarkt,Juwelier,Kiosk,Geschenkladen,Feinkostladen,Spielzeugladen',
    es: 'carnicería,frutería,floristería,papelería,ferretería,joyería,quiosco,tienda de regalos,charcutería,juguetería',
  }, { excl: ['places', 'jobs'] }),
  cat('time', 2, 'Zaman|Time|Zeit|Unidades de tiempo', {
    tr: 'saniye,dakika,saat,gün,hafta,yıl,on yıl,yüzyıl,binyıl',
    en: 'second,minute,hour,day,week,month,year,decade,century,millennium',
    de: 'Sekunde,Minute,Stunde,Tag,Woche,Monat,Jahr,Jahrzehnt,Jahrhundert,Jahrtausend',
    es: 'segundo,minuto,hora,día,semana,mes,año,década,siglo,milenio',
  }, { excl: ['time'] }),
  cat('travel', 2, 'Seyahat|Travel|Reisen|De viaje', {
    tr: 'pasaport,bavul,biniş kartı,vize,hediyelik eşya,boyun yastığı,kartpostal,otel anahtarı,bagaj etiketi,döviz',
    en: 'passport,suitcase,boarding pass,visa,souvenir,neck pillow,postcard,hotel key,luggage tag,currency exchange',
    de: 'Reisepass,Koffer,Bordkarte,Visum,Souvenir,Nackenkissen,Postkarte,Hotelschlüssel,Gepäckanhänger,Wechselstube',
    es: 'pasaporte,maleta,tarjeta de embarque,visado,recuerdo,almohada de viaje,postal,llave del hotel,etiqueta de equipaje,casa de cambio',
  }, { excl: ['travel', 'money'] }),
  cat('farm', 2, 'Çiftlikte|On the farm|Auf dem Bauernhof|En la granja', {
    tr: 'ahır,korkuluk,saman balyası,saban,yel değirmeni,silo,dirgen,kuyu,arı kovanı,kümes',
    en: 'barn,scarecrow,hay bale,plow,windmill,silo,pitchfork,well,beehive,chicken coop',
    de: 'Scheune,Vogelscheuche,Heuballen,Pflug,Windmühle,Silo,Mistgabel,Brunnen,Bienenstock,Hühnerstall',
    es: 'establo,espantapájaros,paca de heno,arado,molino de viento,silo,horca,pozo,colmena,gallinero',
  }, { excl: ['domestic', 'vehicle', 'tools'] }),
  cat('cat-things', 2, 'Kedi eşyaları|Cat stuff|Katzenzubehör|Cosas de gatos', {
    tr: 'tırmalama tahtası,kum kabı,kedi otu,yün yumağı,kedi yatağı,lazer işaretçi,tasma,kedi maması,kedi oltası,kedi kapısı',
    en: 'scratching post,litter box,catnip,ball of yarn,cat bed,laser pointer,collar,food bowl,feather wand,cat door',
    de: 'Kratzbaum,Katzenklo,Katzenminze,Wollknäuel,Katzenbett,Laserpointer,Halsband,Futternapf,Federangel,Katzenklappe',
    es: 'rascador,arenero,hierba gatera,ovillo de lana,cama para gatos,puntero láser,cascabel,comedero,caña con plumas,gatera',
  }, { excl: ['domestic'] }),
  cat('book-genres', 2, 'Kitap türleri|Book genres|Buchgattungen|Tipos de libros', {
    tr: 'roman,şiir,biyografi,polisiye,bilimkurgu,korku romanı,çizgi roman,yemek kitabı,sözlük,ansiklopedi,masal,anı',
    en: 'novel,poetry,biography,crime novel,science fiction,horror,comic book,cookbook,dictionary,encyclopedia,fairy tale,memoir',
    de: 'Roman,Lyrik,Biografie,Krimi,Science-Fiction,Horror,Comic,Kochbuch,Wörterbuch,Lexikon,Märchen,Memoiren',
    es: 'novela,poesía,biografía,novela negra,ciencia ficción,novela de terror,cómic,libro de cocina,diccionario,enciclopedia,cuento de hadas,memorias',
  }, { excl: ['literature', 'fantasy'] }),
  cat('home-textiles', 2, 'Ev tekstili|Home textiles|Heimtextilien|Textiles del hogar', {
    tr: 'yastık,battaniye,yorgan,çarşaf,perde,halı,minder,masa örtüsü,pike,nevresim',
    en: 'pillow,blanket,duvet,bed sheet,curtain,carpet,cushion,tablecloth,throw,duvet cover',
    de: 'Kopfkissen,Decke,Bettdecke,Bettlaken,Vorhang,Teppich,Sitzkissen,Tischdecke,Tagesdecke,Bettbezug',
    es: 'almohada,manta,edredón,sábana,cortina,alfombra,cojín,mantel,colcha,funda nórdica',
  }, { excl: ['clean', 'kitchen'] }),
];

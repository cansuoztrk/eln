import { cat, type Category } from './types';

/**
 * Tier 3 shelves: hobbies, the wider world, stories and Istanbul flavour.
 * They open once players know the rules and want a little more thinking.
 */
export const WORLD: Category[] = [
  cat('music-genres', 3, 'Müzik türleri|Music genres|Musikrichtungen|Géneros musicales', {
    tr: 'rock,caz,pop,hip hop,blues,reggae,country,tekno,funk,arabesk,türkü,punk',
    en: 'rock,jazz,pop,hip hop,blues,reggae,country,techno,funk,punk,soul,disco',
    de: 'Rockmusik,Jazz,Pop,Hip-Hop,Blues,Reggae,Country,Techno,Funk,Punk,Soul,Gospel',
    es: 'rock,jazz,pop,hip hop,blues,reggae,country,tecno,funk,punk,soul,reguetón',
  }, { excl: ['music'] }),
  cat('dances', 3, 'Danslar|Dances|Tänze|Bailes', {
    tr: 'tango,salsa,vals,bale,flamenko,halay,zeybek,samba,breakdans,horon,çaçaça,step',
    en: 'tango,salsa,waltz,ballet,flamenco,halay,zeybek,samba,breakdance,cha-cha,tap dance,foxtrot',
    de: 'Tango,Salsa,Walzer,Ballett,Flamenco,Halay,Zeybek,Samba,Breakdance,Cha-Cha-Cha,Stepptanz,Foxtrott',
    es: 'tango,salsa,vals,ballet,bachata,halay,zeybek,samba,breakdance,chachachá,claqué,sevillanas',
  }, { excl: ['music'] }),
  cat('medical', 3, 'Tıbbi malzemeler|Medical supplies|Medizinischer Bedarf|Material médico', {
    tr: 'stetoskop,termometre,şırınga,sargı bezi,koltuk değneği,tekerlekli sandalye,röntgen,sedye,alçı,neşter',
    en: 'stethoscope,thermometer,syringe,bandage,crutches,wheelchair,X-ray,stretcher,plaster cast,scalpel',
    de: 'Stethoskop,Fieberthermometer,Spritze,Verband,Krücken,Rollstuhl,Röntgenbild,Trage,Gips,Skalpell',
    es: 'estetoscopio,termómetro,jeringa,venda,muletas,silla de ruedas,radiografía,camilla,escayola,bisturí',
  }),
  cat('dinosaurs', 3, 'Dinozorlar|Dinosaurs|Dinosaurier|Dinosaurios', {
    tr: 'tiranozor,triseratops,stegozor,velosiraptor,brakiyozor,pterodaktil,diplodokus,ankilozor,spinozor,iguanodon',
    en: 'T. rex,triceratops,stegosaurus,velociraptor,brachiosaurus,pterodactyl,diplodocus,ankylosaurus,spinosaurus,iguanodon',
    de: 'Tyrannosaurus,Triceratops,Stegosaurus,Velociraptor,Brachiosaurus,Pterodaktylus,Diplodocus,Ankylosaurus,Spinosaurus,Iguanodon',
    es: 'tiranosaurio,triceratops,estegosaurio,velociraptor,braquiosaurio,pterodáctilo,diplodocus,anquilosaurio,espinosaurio,iguanodonte',
  }),
  cat('fairy-tale', 3, 'Masal kahramanları|Fairy-tale characters|Märchenfiguren|Personajes de cuento', {
    tr: 'Külkedisi,Pamuk Prenses,Kırmızı Başlıklı Kız,Rapunzel,Pinokyo,Alaaddin,Peter Pan,Keloğlan,Nasreddin Hoca,Parmak Kız,Uyuyan Güzel',
    en: 'Cinderella,Snow White,Little Red Riding Hood,Rapunzel,Pinocchio,Aladdin,Peter Pan,Thumbelina,Sleeping Beauty,Rumpelstiltskin,Puss in Boots',
    de: 'Aschenputtel,Schneewittchen,Rotkäppchen,Rapunzel,Pinocchio,Aladin,Peter Pan,Däumelinchen,Dornröschen,Rumpelstilzchen,Der gestiefelte Kater',
    es: 'Cenicienta,Blancanieves,Caperucita Roja,Rapunzel,Pinocho,Aladino,Peter Pan,Pulgarcita,La Bella Durmiente,Rumpelstiltskin,El Gato con Botas',
  }, { excl: ['fantasy'] }),
  cat('bookshop', 3, 'Sahaf dükkânı|In the bookshop|In der Buchhandlung|En la librería', {
    tr: 'kitap ayracı,kitap desteği,yazar kasa,büyüteç,kitap merdiveni,hokka,tüy kalem,dünya küresi,daktilo,okuma lambası',
    en: 'bookmark,bookend,cash register,magnifying glass,library ladder,inkwell,quill,globe,typewriter,reading lamp',
    de: 'Lesezeichen,Buchstütze,Kasse,Lupe,Bibliotheksleiter,Tintenfass,Federkiel,Globus,Schreibmaschine,Leselampe',
    es: 'marcapáginas,sujetalibros,caja registradora,lupa,escalera de biblioteca,tintero,pluma de ave,globo terráqueo,máquina de escribir,lámpara de lectura',
  }),
  cat('boats', 3, 'Deniz taşıtları|Boats|Boote|Embarcaciones', {
    tr: 'yelkenli,yat,vapur,kano,kayık,denizaltı,gondol,sal,römorkör,feribot,sürat teknesi',
    en: 'sailboat,yacht,ferry,canoe,rowing boat,submarine,gondola,raft,tugboat,cruise ship,speedboat',
    de: 'Segelboot,Jacht,Fähre,Kanu,Ruderboot,U-Boot,Gondel,Floß,Schlepper,Kreuzfahrtschiff,Schnellboot',
    es: 'velero,yate,ferri,canoa,barca de remos,submarino,góndola,balsa,remolcador,crucero,lancha',
  }, { excl: ['vehicle'] }),
  cat('machines', 3, 'İş makineleri|Construction machines|Baumaschinen|Maquinaria de obra', {
    tr: 'buldozer,ekskavatör,vinç,forklift,silindir,damperli kamyon,beton mikseri,traktör,beko loder,greyder',
    en: 'bulldozer,excavator,tower crane,forklift,road roller,dump truck,cement mixer,tractor,backhoe,grader',
    de: 'Bulldozer,Bagger,Kran,Gabelstapler,Straßenwalze,Kipper,Betonmischer,Traktor,Baggerlader,Grader',
    es: 'bulldozer,excavadora,grúa,carretilla elevadora,apisonadora,volquete,hormigonera,tractor,retroexcavadora,motoniveladora',
  }, { excl: ['vehicle'] }),
  cat('fish', 3, 'Balık pazarı|Fish market|Fischmarkt|Mercado de pescado', {
    tr: 'hamsi,levrek,çipura,uskumru,palamut,somon,ton balığı,sardalya,alabalık,kılıç balığı,barbunya,lüfer',
    en: 'anchovy,sea bass,sea bream,mackerel,bonito,salmon,tuna,sardine,trout,swordfish,red mullet,bluefish',
    de: 'Sardelle,Wolfsbarsch,Dorade,Makrele,Bonito,Lachs,Thunfisch,Sardine,Forelle,Schwertfisch,Rotbarbe,Blaubarsch',
    es: 'anchoa,lubina,dorada,caballa,bonito,salmón,atún,sardina,trucha,pez espada,salmonete,anjova',
  }, { excl: ['sea'] }),
  cat('grains', 3, 'Tahıllar ve bakliyat|Grains & pulses|Getreide & Hülsenfrüchte|Cereales y legumbres', {
    tr: 'buğday,pirinç,arpa,yulaf,mercimek,nohut,fasulye,bezelye,bulgur,çavdar,kinoa,börülce',
    en: 'wheat,rice,barley,oats,lentil,chickpea,bean,pea,bulgur,rye,quinoa,corn',
    de: 'Weizen,Reis,Gerste,Hafer,Linse,Kichererbse,Bohne,Erbse,Bulgur,Roggen,Quinoa,Mais',
    es: 'trigo,arroz,cebada,avena,lenteja,garbanzo,judía,guisante,bulgur,centeno,quinoa,maíz',
  }, { excl: ['veg'] }),
  cat('makeup', 3, 'Makyaj çantası|Make-up bag|Schminktasche|Neceser de maquillaje', {
    tr: 'ruj,rimel,göz kalemi,allık,fondöten,oje,parfüm,göz farı,pudra,kapatıcı',
    en: 'lipstick,mascara,eyeliner,blush,foundation,nail polish,perfume,eyeshadow,face powder,concealer',
    de: 'Lippenstift,Wimperntusche,Eyeliner,Rouge,Make-up,Nagellack,Parfüm,Lidschatten,Puder,Concealer',
    es: 'pintalabios,rímel,delineador,colorete,base de maquillaje,esmalte de uñas,perfume,sombra de ojos,polvos,corrector',
  }, { excl: ['groom'] }),
  cat('hobbies', 3, 'Hobiler|Hobbies|Hobbys|Aficiones', {
    tr: 'örgü,fotoğrafçılık,çömlekçilik,origami,dikiş,nakış,hat sanatı,pul koleksiyonu,ahşap oymacılığı,bahçıvanlık,maket yapımı',
    en: 'knitting,photography,pottery,origami,sewing,embroidery,calligraphy,stamp collecting,woodcarving,gardening,model building',
    de: 'Stricken,Fotografieren,Töpfern,Origami,Nähen,Sticken,Kalligrafie,Briefmarkensammeln,Schnitzen,Gärtnern,Modellbau',
    es: 'punto,fotografía,cerámica,origami,costura,bordado,caligrafía,filatelia,talla de madera,jardinería,maquetismo',
  }, { excl: ['arts'] }),
  cat('world-cities', 3, 'Dünya şehirleri|World cities|Weltstädte|Ciudades del mundo', {
    tr: 'New York,Barselona,Sidney,Rio de Janeiro,Dubai,Venedik,Münih,Chicago,Los Angeles,Şanghay,Milano,Toronto',
    en: 'New York,Barcelona,Sydney,Rio de Janeiro,Dubai,Venice,Munich,Chicago,Los Angeles,Shanghai,Milan,Toronto',
    de: 'New York,Barcelona,Sydney,Rio de Janeiro,Dubai,Venedig,München,Chicago,Los Angeles,Shanghai,Mailand,Toronto',
    es: 'Nueva York,Barcelona,Sídney,Río de Janeiro,Dubái,Venecia,Múnich,Chicago,Los Ángeles,Shanghái,Milán,Toronto',
  }, { excl: ['geo-cities'] }),
  cat('europe', 3, 'Avrupa ülkeleri|European countries|Europäische Länder|Países de Europa', {
    tr: 'Almanya,Fransa,İspanya,Yunanistan,Portekiz,Hollanda,İsveç,Polonya,Avusturya,İsviçre,Belçika,İrlanda',
    en: 'Germany,France,Spain,Greece,Portugal,Netherlands,Sweden,Poland,Austria,Switzerland,Belgium,Ireland',
    de: 'Deutschland,Frankreich,Spanien,Griechenland,Portugal,Niederlande,Schweden,Polen,Österreich,Schweiz,Belgien,Irland',
    es: 'Alemania,Francia,España,Grecia,Portugal,Países Bajos,Suecia,Polonia,Austria,Suiza,Bélgica,Irlanda',
  }, { excl: ['countries'] }),
  cat('seas', 3, 'Denizler ve okyanuslar|Seas & oceans|Meere & Ozeane|Mares y océanos', {
    tr: 'Pasifik,Atlas Okyanusu,Hint Okyanusu,Arktik,Akdeniz,Karadeniz,Ege,Kızıldeniz,Marmara,Hazar,Baltık,Karayip',
    en: 'Pacific,Atlantic,Indian Ocean,Arctic,Mediterranean,Black Sea,Aegean,Red Sea,Sea of Marmara,Caspian,Baltic,Caribbean',
    de: 'Pazifik,Atlantik,Indischer Ozean,Arktis,Mittelmeer,Schwarzes Meer,Ägäis,Rotes Meer,Marmarameer,Kaspisches Meer,Ostsee,Karibik',
    es: 'Pacífico,Atlántico,océano Índico,Ártico,Mediterráneo,mar Negro,Egeo,mar Rojo,mar de Mármara,Caspio,Báltico,Caribe',
  }),
  cat('istanbul-sights', 3, 'İstanbul’un simgeleri|Istanbul landmarks|Wahrzeichen Istanbuls|Monumentos de Estambul', {
    tr: 'Ayasofya,Galata Kulesi,Kız Kulesi,Topkapı Sarayı,Dolmabahçe Sarayı,Sultanahmet Camii,Kapalıçarşı,Yerebatan Sarnıcı,Rumeli Hisarı,Boğaziçi Köprüsü,Mısır Çarşısı,Haydarpaşa Garı',
    en: 'Hagia Sophia,Galata Tower,Maiden’s Tower,Topkapı Palace,Dolmabahçe Palace,Blue Mosque,Grand Bazaar,Basilica Cistern,Rumeli Fortress,Bosphorus Bridge,Spice Bazaar,Haydarpaşa Station',
    de: 'Hagia Sophia,Galataturm,Leanderturm,Topkapı-Palast,Dolmabahçe-Palast,Blaue Moschee,Großer Basar,Cisterna Basilica,Rumeli Hisarı,Bosporus-Brücke,Ägyptischer Basar,Bahnhof Haydarpaşa',
    es: 'Santa Sofía,Torre de Gálata,Torre de la Doncella,Palacio de Topkapı,Palacio de Dolmabahçe,Mezquita Azul,Gran Bazar,Cisterna Basílica,Fortaleza de Rumeli,Puente del Bósforo,Bazar de las Especias,Estación de Haydarpaşa',
  }, { excl: ['landmark'], pack: 'istanbul' }),
  cat('street-food', 3, 'Sokak lezzetleri|Turkish street food|Türkisches Streetfood|Comida callejera turca', {
    tr: 'midye dolma,kokoreç,balık ekmek,kumpir,tantuni,çiğ köfte,gözleme,dürüm,ıslak hamburger,tavuk pilav',
    en: 'stuffed mussels,kokoreç,fish sandwich,kumpir,tantuni,çiğ köfte,gözleme,dürüm,wet burger,chicken and rice',
    de: 'gefüllte Muscheln,Kokoreç,Fischbrötchen,Kumpir,Tantuni,Çiğ Köfte,Gözleme,Dürüm,nasser Burger,Hähnchen mit Reis',
    es: 'mejillones rellenos,kokoreç,bocadillo de pescado,kumpir,tantuni,çiğ köfte,gözleme,dürüm,hamburguesa mojada,pollo con arroz',
  }, { excl: ['dish'], pack: 'istanbul' }),
  cat('turkish-drinks', 3, 'Türk içecekleri|Turkish drinks|Türkische Getränke|Bebidas turcas', {
    tr: 'ayran,şalgam,boza,salep,şerbet,Türk kahvesi,ıhlamur,adaçayı,kuşburnu çayı,elma çayı,demirhindi',
    en: 'ayran,şalgam,boza,salep,sherbet,Turkish coffee,linden tea,sage tea,rosehip tea,apple tea,tamarind drink',
    de: 'Ayran,Şalgam,Boza,Salep,Scherbett,Türkischer Kaffee,Lindenblütentee,Salbeitee,Hagebuttentee,Apfeltee,Tamarindensaft',
    es: 'ayran,şalgam,boza,salep,sorbete,café turco,tila,té de salvia,té de escaramujo,té de manzana,bebida de tamarindo',
  }, { excl: ['drink'], pack: 'istanbul' }),
  cat('sauces', 3, 'Soslar|Sauces & dips|Soßen & Dips|Salsas y cremas', {
    tr: 'ketçap,mayonez,hardal,pesto,soya sosu,sirke,zeytinyağı,humus,tahin,nar ekşisi,acı sos,barbekü sosu',
    en: 'ketchup,mayonnaise,mustard,pesto,soy sauce,vinegar,olive oil,hummus,tahini,pomegranate molasses,hot sauce,barbecue sauce',
    de: 'Ketchup,Mayonnaise,Senf,Pesto,Sojasoße,Essig,Olivenöl,Hummus,Tahini,Granatapfelsirup,scharfe Soße,Barbecuesoße',
    es: 'kétchup,mayonesa,mostaza,pesto,salsa de soja,vinagre,aceite de oliva,hummus,tahini,melaza de granada,salsa picante,salsa barbacoa',
  }),
  cat('flying', 3, 'Uçan şeyler|Things that fly|Dinge, die fliegen|Cosas que vuelan', {
    tr: 'bumerang,frizbi,kâğıt uçak,sıcak hava balonu,dron,uçurtma,planör,paraşüt,zeplin,dilek feneri',
    en: 'boomerang,frisbee,paper plane,hot-air balloon,drone,kite,glider,parachute,zeppelin,sky lantern',
    de: 'Bumerang,Frisbee,Papierflieger,Heißluftballon,Drohne,Lenkdrachen,Segelflugzeug,Fallschirm,Zeppelin,Himmelslaterne',
    es: 'bumerán,frisbi,avión de papel,globo aerostático,dron,cometa de papel,planeador,paracaídas,zepelín,farolillo volador',
  }, { excl: ['vehicle', 'space'] }),
  cat('wallet', 3, 'Cüzdanda neler var?|In a wallet|Im Portemonnaie|En la cartera', {
    tr: 'kredi kartı,kimlik kartı,banknot,bozuk para,fiş,vesikalık fotoğraf,kartvizit,bilet,hediye çeki,ehliyet',
    en: 'credit card,ID card,banknote,coins,receipt,passport photo,business card,ticket,gift card,driver’s license',
    de: 'Kreditkarte,Personalausweis,Geldschein,Münzen,Kassenbon,Passfoto,Visitenkarte,Fahrkarte,Gutschein,Führerschein',
    es: 'tarjeta de crédito,DNI,billete,monedas,recibo,foto de carné,tarjeta de visita,entrada,tarjeta regalo,carné de conducir',
  }),
  cat('circus', 3, 'Sirk|At the circus|Im Zirkus|En el circo', {
    tr: 'palyaço,akrobat,jonglör,ip cambazı,sunucu,sihirbaz,trapez,tek tekerlekli bisiklet,sirk çadırı,ateş yutucu',
    en: 'clown,acrobat,juggler,tightrope walker,ringmaster,magician,trapeze,unicycle,big top,fire-eater',
    de: 'Clown,Akrobat,Jongleur,Seiltänzer,Zirkusdirektor,Zauberer,Trapez,Einrad,Zirkuszelt,Feuerschlucker',
    es: 'payaso,acróbata,malabarista,funambulista,maestro de pista,mago,trapecio,monociclo,carpa,tragafuegos',
  }, { excl: ['jobs', 'fantasy'] }),
  cat('pirates', 3, 'Korsanlar|Pirates|Piraten|Piratas', {
    tr: 'hazine sandığı,göz bandı,kanca,gülle,çapa,korsan bayrağı,pala,tahta bacak,batık gemi,kaptan,dürbün',
    en: 'treasure chest,eye patch,hook,cannonball,anchor,pirate flag,cutlass,peg leg,shipwreck,captain,spyglass',
    de: 'Schatztruhe,Augenklappe,Haken,Kanonenkugel,Anker,Piratenflagge,Säbel,Holzbein,Schiffswrack,Kapitän,Fernrohr',
    es: 'cofre del tesoro,parche,garfio,bala de cañón,ancla,bandera pirata,sable,pata de palo,naufragio,capitán,catalejo',
  }),
  cat('castle', 3, 'Şatoda|At the castle|Auf der Burg|En el castillo', {
    tr: 'şövalye,kral,kraliçe,prens,prenses,taht,taç,kılıç,kalkan,zırh,asma köprü,hendek',
    en: 'knight,king,queen,prince,princess,throne,crown,sword,shield,armor,drawbridge,moat',
    de: 'Ritter,König,Königin,Prinz,Prinzessin,Thron,Krone,Schwert,Schild,Rüstung,Zugbrücke,Burggraben',
    es: 'caballero,rey,reina,príncipe,princesa,trono,corona,espada,escudo,armadura,puente levadizo,foso',
  }, { excl: ['fantasy'] }),
  cat('water-sports', 3, 'Su sporları|Water sports|Wassersport|Deportes acuáticos', {
    tr: 'sörf,dalış,kürek çekme,yelken,su topu,kanoculuk,şnorkel,rüzgâr sörfü,rafting,su kayağı',
    en: 'surfing,diving,rowing,sailing,water polo,kayaking,snorkelling,windsurfing,canoe racing,water skiing',
    de: 'Surfen,Tauchen,Rudern,Segeln,Wasserball,Kajakfahren,Schnorcheln,Windsurfen,Kanurennsport,Wasserski',
    es: 'surf,buceo,remo,navegación a vela,waterpolo,kayak,esnórquel,windsurf,piragüismo,esquí acuático',
  }, { excl: ['sport'] }),
  cat('creative-jobs', 3, 'Sanatla ilgili meslekler|Creative jobs|Kreative Berufe|Profesiones creativas', {
    tr: 'oyuncu,şarkıcı,fotoğrafçı,mimar,dansçı,gazeteci,tasarımcı,müzisyen,yönetmen,heykeltıraş,illüstratör',
    en: 'actor,singer,photographer,architect,dancer,journalist,designer,musician,film director,sculptor,illustrator',
    de: 'Schauspieler,Sänger,Fotograf,Architekt,Tänzer,Journalist,Designer,Musiker,Regisseur,Bildhauer,Illustrator',
    es: 'actor,cantante,fotógrafo,arquitecto,bailarín,periodista,diseñador,músico,director de cine,escultor,ilustrador',
  }, { excl: ['jobs'] }),
  cat('organs', 3, 'Organlarımız|Inside the body|Im Körper|Dentro del cuerpo', {
    tr: 'beyin,akciğer,karaciğer,böbrek,mide,bağırsak,kemik,kas,cilt,pankreas,dalak,omurga',
    en: 'brain,lungs,liver,kidney,stomach,intestine,bone,muscle,skin,pancreas,spleen,spine',
    de: 'Gehirn,Lunge,Leber,Niere,Magen,Darm,Knochen,Muskel,Haut,Bauchspeicheldrüse,Milz,Wirbelsäule',
    es: 'cerebro,pulmones,hígado,riñón,estómago,intestino,hueso,músculo,piel,páncreas,bazo,columna',
  }, { excl: ['body'] }),
  cat('languages', 3, 'Diller|Languages|Sprachen|Idiomas', {
    tr: 'Türkçe,İngilizce,Almanca,İspanyolca,Fransızca,İtalyanca,Arapça,Rusça,Japonca,Çince,Portekizce,Korece',
    en: 'Turkish,English,German,Spanish,French,Italian,Arabic,Russian,Japanese,Chinese,Portuguese,Korean',
    de: 'Türkisch,Englisch,Deutsch,Spanisch,Französisch,Italienisch,Arabisch,Russisch,Japanisch,Chinesisch,Portugiesisch,Koreanisch',
    es: 'turco,inglés,alemán,español,francés,italiano,árabe,ruso,japonés,chino,portugués,coreano',
  }),
  cat('zodiac', 3, 'Burçlar|Star signs|Sternzeichen|Signos del zodiaco', {
    tr: 'Koç,Boğa,İkizler,Başak,Terazi,Akrep,Yay,Oğlak,Kova,Balık',
    en: 'Aries,Taurus,Gemini,Cancer,Leo,Virgo,Libra,Scorpio,Sagittarius,Capricorn,Aquarius,Pisces',
    de: 'Widder,Stier,Zwillinge,Krebs,Jungfrau,Waage,Skorpion,Schütze,Steinbock,Wassermann,Fische',
    es: 'Aries,Tauro,Géminis,Cáncer,Leo,Virgo,Libra,Escorpio,Sagitario,Capricornio,Acuario,Piscis',
  }),
  cat('coffee', 3, 'Kahve çeşitleri|Coffee menu|Kaffeekarte|Carta de cafés', {
    tr: 'espresso,latte,kapuçino,americano,mocha,macchiato,flat white,frappe,cortado,affogato,filtre kahve',
    en: 'espresso,latte,cappuccino,americano,mocha,macchiato,flat white,frappé,cortado,affogato,filter coffee',
    de: 'Espresso,Latte macchiato,Cappuccino,Americano,Mokka,Macchiato,Flat White,Frappé,Cortado,Affogato,Filterkaffee',
    es: 'espresso,café con leche,capuchino,americano,moca,macchiato,flat white,frappé,cortado,affogato,café de filtro',
  }, { excl: ['drink'] }),
];

import { cat, type Category } from './types';

/**
 * Tier 4–5 shelves for long-time players: literature (it is a bookshop,
 * after all), arts, science and the finer points of food and culture.
 * Lists may differ per language where a local name is the natural pick.
 */
export const EXPERT: Category[] = [
  cat('writers', 4, 'Yazarlar|Writers|Schriftsteller|Escritores', {
    tr: 'Shakespeare,Tolstoy,Cervantes,Goethe,Dickens,Kafka,Dostoyevski,Sabahattin Ali,Yaşar Kemal,Orhan Pamuk,Sait Faik,Halide Edib',
    en: 'Shakespeare,Tolstoy,Cervantes,Goethe,Dickens,Kafka,Dostoevsky,Jane Austen,Mark Twain,Victor Hugo,Agatha Christie,Orhan Pamuk',
    de: 'Shakespeare,Tolstoi,Cervantes,Goethe,Schiller,Kafka,Dostojewski,Thomas Mann,Hermann Hesse,Victor Hugo,Agatha Christie,Orhan Pamuk',
    es: 'Shakespeare,Tolstói,Cervantes,Goethe,Dickens,Kafka,Dostoievski,García Márquez,Borges,Isabel Allende,Lorca,Orhan Pamuk',
  }, { excl: ['literature'] }),
  cat('novels', 4, 'Klasik romanlar|Classic novels|Klassische Romane|Novelas clásicas', {
    tr: 'Don Kişot,Suç ve Ceza,Savaş ve Barış,Sefiller,Moby Dick,Madam Bovary,Robinson Crusoe,Oliver Twist,Drakula,İnce Memed,Kürk Mantolu Madonna,Aşk-ı Memnu',
    en: 'Don Quixote,Crime and Punishment,War and Peace,Les Misérables,Moby-Dick,Madame Bovary,Robinson Crusoe,Oliver Twist,Dracula,Pride and Prejudice,Jane Eyre,Frankenstein',
    de: 'Don Quijote,Schuld und Sühne,Krieg und Frieden,Die Elenden,Moby Dick,Madame Bovary,Robinson Crusoe,Oliver Twist,Dracula,Buddenbrooks,Der Steppenwolf,Frankenstein',
    es: 'Don Quijote,Crimen y castigo,Guerra y paz,Los miserables,Moby Dick,Madame Bovary,Robinson Crusoe,Oliver Twist,Drácula,Cien años de soledad,La Regenta,Frankenstein',
  }, { excl: ['literature', 'fantasy'] }),
  cat('cheeses', 4, 'Peynirler|Cheeses|Käsesorten|Quesos', {
    tr: 'kaşar,tulum peyniri,ezine,lor,çökelek,hellim,örgü peyniri,mozarella,parmesan,rokfor,cheddar,gravyer',
    en: 'cheddar,mozzarella,parmesan,brie,camembert,gouda,feta,roquefort,emmental,ricotta,halloumi,manchego',
    de: 'Cheddar,Mozzarella,Parmesan,Brie,Camembert,Gouda,Feta,Roquefort,Emmentaler,Ricotta,Halloumi,Bergkäse',
    es: 'cheddar,mozzarella,parmesano,brie,camembert,gouda,feta,roquefort,emmental,ricotta,halloumi,manchego',
  }, { excl: ['breakfast'] }),
  cat('pasta', 4, 'Makarna çeşitleri|Pasta shapes|Nudelsorten|Tipos de pasta', {
    tr: 'spagetti,penne,lazanya,ravyoli,burgu makarna,fiyonk makarna,tagliatelle,erişte,tortellini,gnocchi,şehriye,fettuccine',
    en: 'spaghetti,penne,lasagne,ravioli,fusilli,farfalle,tagliatelle,macaroni,tortellini,gnocchi,linguine,fettuccine',
    de: 'Spaghetti,Penne,Lasagne,Ravioli,Fusilli,Farfalle,Tagliatelle,Makkaroni,Tortellini,Gnocchi,Linguine,Fettuccine',
    es: 'espaguetis,macarrones,lasaña,raviolis,fusilli,lacitos,tallarines,fideos,tortellini,ñoquis,linguine,canelones',
  }, { excl: ['dish'] }),
  cat('fabrics', 4, 'Kumaşlar|Fabrics|Stoffe|Telas', {
    tr: 'pamuk,yün,ipek,keten,kot,dantel,kadife,polyester,kaşmir,saten,keçe,şifon',
    en: 'cotton,wool,silk,tweed,denim,leather,velvet,polyester,cashmere,satin,felt,chiffon',
    de: 'Baumwolle,Wolle,Seide,Leinen,Jeansstoff,Flanell,Samt,Polyester,Kaschmir,Satin,Filz,Chiffon',
    es: 'algodón,lana,seda,lino,tela vaquera,cuero,terciopelo,poliéster,cachemira,satén,fieltro,franela',
  }),
  cat('turkish-arts', 4, 'Geleneksel sanatlar|Traditional Turkish arts|Traditionelle türkische Künste|Artes tradicionales turcas', {
    tr: 'ebru,hat,çini,minyatür,tezhip,kilim dokuma,telkari,Karagöz,meddahlık,halı dokuma,cam üfleme,bakır işçiliği',
    en: 'paper marbling,Islamic calligraphy,tile art,miniature painting,manuscript illumination,kilim weaving,filigree,shadow puppetry,storytelling,carpet weaving,glassblowing,coppersmithing',
    de: 'Papiermarmorierung,Kalligrafiekunst,Fliesenkunst,Miniaturmalerei,Buchmalerei,Kelimweberei,Filigranarbeit,Schattentheater,Erzählkunst,Teppichknüpfen,Glasbläserei,Kupferschmiedekunst',
    es: 'papel marmolado,caligrafía islámica,azulejería,miniatura,iluminación de manuscritos,tejido de kilim,filigrana,teatro de sombras,cuentacuentos,alfombra anudada,vidrio soplado,calderería',
  }, { excl: ['arts'], pack: 'istanbul' }),
  cat('landmarks', 4, 'Dünya harikaları|World landmarks|Wahrzeichen der Welt|Monumentos del mundo', {
    tr: 'Eyfel Kulesi,Kolezyum,Big Ben,Tac Mahal,Mısır Piramitleri,Özgürlük Heykeli,Çin Seddi,Machu Picchu,Petra,Stonehenge,Akropolis,Efes Antik Kenti',
    en: 'Eiffel Tower,Colosseum,Big Ben,Taj Mahal,Pyramids of Giza,Statue of Liberty,Great Wall of China,Machu Picchu,Petra,Stonehenge,Acropolis,Ephesus',
    de: 'Eiffelturm,Kolosseum,Big Ben,Taj Mahal,Pyramiden von Gizeh,Freiheitsstatue,Chinesische Mauer,Machu Picchu,Petra,Stonehenge,Akropolis,Ephesos',
    es: 'Torre Eiffel,Coliseo,Big Ben,Taj Mahal,Pirámides de Guiza,Estatua de la Libertad,Gran Muralla china,Machu Picchu,Petra,Stonehenge,Acrópolis,Éfeso',
  }, { excl: ['landmark'] }),
  cat('martial-arts', 4, 'Dövüş sanatları|Martial arts|Kampfkünste|Artes marciales', {
    tr: 'karate,judo,tekvando,kung fu,aikido,sumo,kick boks,capoeira,jiu-jitsu,muay thai,kendo,yağlı güreş',
    en: 'karate,judo,taekwondo,kung fu,aikido,sumo,kickboxing,capoeira,jiu-jitsu,muay thai,kendo,oil wrestling',
    de: 'Karate,Judo,Taekwondo,Kung-Fu,Aikido,Sumo,Kickboxen,Capoeira,Jiu-Jitsu,Muay Thai,Kendo,Ölringen',
    es: 'kárate,judo,taekwondo,kung-fu,aikido,sumo,kickboxing,capoeira,jiu-jitsu,muay thai,kendo,lucha en aceite',
  }, { excl: ['sport'] }),
  cat('car-parts', 4, 'Arabanın parçaları|Car parts|Autoteile|Partes del coche', {
    tr: 'direksiyon,lastik,motor,fren,ön far,tampon,ön cam,emniyet kemeri,jant,vites kolu,korna,dikiz aynası',
    en: 'steering wheel,tire,engine,brake,headlight,bumper,windshield,seat belt,trunk,gearshift,license plate,rear-view mirror',
    de: 'Lenkrad,Reifen,Motor,Bremse,Scheinwerfer,Stoßstange,Windschutzscheibe,Sicherheitsgurt,Kofferraum,Schaltknüppel,Hupe,Rückspiegel',
    es: 'capó,neumático,motor,freno,intermitente,parachoques,parabrisas,cinturón de seguridad,maletero,palanca de cambios,claxon,retrovisor',
  }, { excl: ['vehicle'] }),
  cat('lab', 4, 'Laboratuvar|Science lab|Labor|Laboratorio', {
    tr: 'mikroskop,deney tüpü,beher,erlenmayer,bunsen beki,pipet,petri kabı,mıknatıs,koruyucu gözlük,deney önlüğü,turnusol kâğıdı,hassas terazi',
    en: 'microscope,test tube,beaker,flask,Bunsen burner,pipette,Petri dish,magnet,safety goggles,lab coat,litmus paper,precision scale',
    de: 'Mikroskop,Reagenzglas,Becherglas,Erlenmeyerkolben,Bunsenbrenner,Pipette,Petrischale,Magnet,Schutzbrille,Laborkittel,Lackmuspapier,Feinwaage',
    es: 'microscopio,tubo de ensayo,vaso de precipitados,matraz,mechero Bunsen,pipeta,placa de Petri,imán,gafas de seguridad,bata de laboratorio,papel tornasol,balanza de precisión',
  }, { excl: ['zodiac'] }),
  cat('math', 4, 'Matematik|Math|Mathematik|Matemáticas', {
    tr: 'toplama,çıkarma,çarpma,bölme,kesir,denklem,açı,yüzde,karekök,ondalık sayı,tam sayı,asal sayı',
    en: 'addition,subtraction,multiplication,division,fraction,equation,angle,percentage,square root,decimal,integer,prime number',
    de: 'Addition,Subtraktion,Multiplikation,Division,Bruch,Gleichung,Winkel,Prozent,Quadratwurzel,Dezimalzahl,ganze Zahl,Primzahl',
    es: 'suma,resta,multiplicación,división,fracción,ecuación,ángulo,porcentaje,raíz cuadrada,decimal,número entero,número primo',
  }, { excl: ['math'] }),
  cat('traits', 4, 'Kişilik özellikleri|Personality traits|Charakterzüge|Rasgos de carácter', {
    tr: 'cesur,dürüst,tembel,cömert,utangaç,zeki,sabırlı,inatçı,kibar,neşeli,çalışkan,meraklı',
    en: 'brave,honest,lazy,generous,shy,clever,patient,stubborn,polite,cheerful,hard-working,nosy',
    de: 'mutig,ehrlich,faul,großzügig,schüchtern,klug,geduldig,stur,höflich,fröhlich,fleißig,neugierig',
    es: 'valiente,sincero,perezoso,generoso,tímido,listo,paciente,terco,educado,alegre,optimista,chismoso',
  }, { excl: ['feel'] }),
  cat('units', 4, 'Ölçü birimleri|Units of measure|Maßeinheiten|Unidades de medida', {
    tr: 'metre,kilogram,litre,gram,santimetre,kilometre,inç,mil,ton,milimetre,derece,hektar',
    en: 'meter,kilogram,liter,gram,centimeter,kilometer,inch,mile,ton,millimeter,gallon,hectare',
    de: 'Meter,Kilogramm,Liter,Gramm,Zentimeter,Kilometer,Milliliter,Meile,Tonne,Millimeter,Grad,Hektar',
    es: 'mililitro,kilogramo,litro,gramo,centímetro,kilómetro,pulgada,milla,tonelada,milímetro,grado,hectárea',
  }, { excl: ['time', 'units'] }),
  cat('currencies', 4, 'Para birimleri|Currencies|Währungen|Monedas del mundo', {
    tr: 'lira,dolar,avro,yen,ruble,rupi,peso,frank,dinar,yuan,sterlin,riyal',
    en: 'lira,dollar,euro,yen,ruble,rupee,peso,franc,dinar,yuan,sterling,riyal',
    de: 'Lira,Dollar,Euro,Yen,Rubel,Rupie,Peso,Franken,Dinar,Yuan,Pfund Sterling,Riyal',
    es: 'lira turca,dólar,euro,yen,rublo,rupia,peso mexicano,franco suizo,dinar,yuan,libra esterlina,riyal',
  }, { excl: ['money'] }),
  cat('houseplants', 4, 'Saksı bitkileri|Houseplants|Zimmerpflanzen|Plantas de interior', {
    tr: 'kaktüs,aloe vera,eğrelti otu,sarmaşık,bambu,bonsai,deve tabanı,sukulent,kauçuk,barış çiçeği,paşa kılıcı,yosun',
    en: 'cactus,aloe vera,fern,ivy,bamboo,bonsai,monstera,succulent,rubber plant,peace lily,snake plant,moss',
    de: 'Kaktus,Aloe vera,Farn,Efeu,Bambus,Bonsai,Monstera,Sukkulente,Gummibaum,Einblatt,Bogenhanf,Moos',
    es: 'cactus,aloe vera,helecho,hiedra,bambú,bonsái,costilla de Adán,suculenta,ficus,espatifilo,lengua de suegra,musgo',
  }, { excl: ['plant'] }),
  cat('cat-breeds', 4, 'Kedi ırkları|Cat breeds|Katzenrassen|Razas de gatos', {
    tr: 'Van kedisi,Ankara kedisi,İran kedisi,Siyam,Maine Coon,Sfenks kedisi,Ragdoll,Bengal,Scottish Fold,British Shorthair,Rus mavisi,Habeş kedisi',
    en: 'Turkish Van,Turkish Angora,Persian cat,Siamese,Maine Coon,Sphynx,Ragdoll,Bengal,Scottish Fold,British Shorthair,Russian Blue,Abyssinian',
    de: 'Türkisch Van,Türkisch Angora,Perserkatze,Siamkatze,Maine Coon,Sphynx,Ragdoll,Bengalkatze,Scottish Fold,Britisch Kurzhaar,Russisch Blau,Kartäuser',
    es: 'van turco,angora turco,gato persa,siamés,maine coon,sphynx,ragdoll,gato de Bengala,scottish fold,británico de pelo corto,azul ruso,abisinio',
  }, { excl: ['domestic'] }),
  cat('dog-breeds', 4, 'Köpek ırkları|Dog breeds|Hunderassen|Razas de perros', {
    tr: 'Kangal,golden retriever,labrador,Alman kurdu,kaniş,bulldog,beagle,dalmaçyalı,chihuahua,husky,pug,dachshund',
    en: 'Kangal,golden retriever,labrador,German shepherd,poodle,bulldog,beagle,Dalmatian,chihuahua,husky,pug,dachshund',
    de: 'Kangal,Golden Retriever,Labrador,Deutscher Schäferhund,Pudel,Bulldogge,Beagle,Dalmatiner,Chihuahua,Husky,Mops,Dackel',
    es: 'kangal,golden retriever,labrador,pastor alemán,caniche,bulldog,beagle,dálmata,chihuahua,husky,carlino,teckel',
  }, { excl: ['domestic'] }),

  cat('scientists', 5, 'Bilim insanları|Scientists|Wissenschaftler|Científicos', {
    tr: 'Einstein,Newton,Marie Curie,Darwin,Galileo,Tesla,Edison,Pasteur,Arşimet,Kopernik,Aziz Sancar,Cahit Arf',
    en: 'Einstein,Newton,Marie Curie,Darwin,Galileo,Tesla,Edison,Pasteur,Archimedes,Copernicus,Ada Lovelace,Stephen Hawking',
    de: 'Einstein,Newton,Marie Curie,Darwin,Galilei,Tesla,Edison,Pasteur,Archimedes,Kopernikus,Max Planck,Robert Koch',
    es: 'Einstein,Newton,Marie Curie,Darwin,Galileo,Tesla,Edison,Pasteur,Arquímedes,Copérnico,Ramón y Cajal,Severo Ochoa',
  }, { excl: ['units'] }),
  cat('painters', 5, 'Ressamlar|Painters|Maler|Pintores', {
    tr: 'Picasso,Van Gogh,Leonardo da Vinci,Monet,Rembrandt,Dalí,Frida Kahlo,Michelangelo,Klimt,Osman Hamdi Bey,Abidin Dino,Fikret Mualla',
    en: 'Picasso,Van Gogh,Leonardo da Vinci,Monet,Rembrandt,Dalí,Frida Kahlo,Michelangelo,Klimt,Vermeer,Turner,Matisse',
    de: 'Picasso,Van Gogh,Leonardo da Vinci,Monet,Rembrandt,Dalí,Frida Kahlo,Michelangelo,Klimt,Dürer,Caspar David Friedrich,Paul Klee',
    es: 'Picasso,Van Gogh,Leonardo da Vinci,Monet,Rembrandt,Dalí,Frida Kahlo,Miguel Ángel,Klimt,Velázquez,Goya,El Greco',
  }),
  cat('composers', 5, 'Besteciler|Composers|Komponisten|Compositores', {
    tr: 'Mozart,Beethoven,Bach,Chopin,Vivaldi,Çaykovski,Verdi,Wagner,Itri,Debussy,Hacı Arif Bey,Ahmet Adnan Saygun',
    en: 'Mozart,Beethoven,Bach,Chopin,Vivaldi,Tchaikovsky,Verdi,Wagner,Debussy,Handel,Schubert,Brahms',
    de: 'Mozart,Beethoven,Haydn,Chopin,Vivaldi,Tschaikowski,Verdi,Wagner,Debussy,Händel,Schubert,Brahms',
    es: 'Mozart,Beethoven,Bach,Chopin,Vivaldi,Chaikovski,Verdi,Wagner,Debussy,Albéniz,Falla,Granados',
  }),
  cat('elements', 5, 'Kimyasal elementler|Chemical elements|Chemische Elemente|Elementos químicos', {
    tr: 'hidrojen,oksijen,karbon,azot,helyum,neon,sodyum,kalsiyum,klor,kükürt,potasyum,fosfor',
    en: 'hydrogen,oxygen,carbon,nitrogen,helium,neon,sodium,calcium,chlorine,sulfur,potassium,phosphorus',
    de: 'Wasserstoff,Sauerstoff,Kohlenstoff,Stickstoff,Helium,Neon,Natrium,Calcium,Chlor,Schwefel,Kalium,Phosphor',
    es: 'hidrógeno,oxígeno,carbono,nitrógeno,helio,neón,sodio,calcio,cloro,azufre,potasio,magnesio',
  }, { excl: ['element'] }),
  cat('civilizations', 5, 'Antik uygarlıklar|Ancient civilizations|Antike Hochkulturen|Civilizaciones antiguas', {
    tr: 'Hititler,Sümerler,Mayalar,Aztekler,İnkalar,Vikingler,Fenikeliler,Babilliler,Lidyalılar,Frigler,Urartular,Etrüskler',
    en: 'Hittites,Sumerians,Maya,Aztecs,Incas,Vikings,Phoenicians,Babylonians,Lydians,Phrygians,Urartians,Etruscans',
    de: 'Hethiter,Sumerer,Maya,Azteken,Inka,Wikinger,Phönizier,Babylonier,Lyder,Phryger,Urartäer,Etrusker',
    es: 'hititas,sumerios,mayas,aztecas,incas,vikingos,fenicios,babilonios,lidios,frigios,urartianos,etruscos',
  }),
  cat('greek-gods', 5, 'Yunan tanrıları|Greek gods|Griechische Götter|Dioses griegos', {
    tr: 'Zeus,Hera,Poseidon,Athena,Apollon,Afrodit,Hermes,Ares,Artemis,Hades,Dionysos,Demeter',
    en: 'Zeus,Hera,Poseidon,Athena,Apollo,Aphrodite,Hermes,Ares,Artemis,Hades,Dionysus,Demeter',
    de: 'Zeus,Hera,Poseidon,Athene,Apollon,Aphrodite,Hermes,Ares,Artemis,Hades,Dionysos,Demeter',
    es: 'Zeus,Hera,Poseidón,Atenea,Apolo,Afrodita,Hermes,Ares,Artemisa,Hades,Dioniso,Deméter',
  }),
];

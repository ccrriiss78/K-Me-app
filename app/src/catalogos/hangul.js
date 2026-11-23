// CATÁLOGO de palabras en hangul del sello (TECH_SPEC §4.2, P008).
//
// Regla de la autora (22/11/2026, D043): «usa solo lo que esté bien comprobado como correcto».
// Por eso solo hay palabras con su propia entrada en un diccionario del Instituto Nacional de la
// Lengua Coreana (NIKL):
// - B: Diccionario Básico de Coreano, versión en español (krdict.korean.go.kr/spa). El significado
//   en español es el que da el propio diccionario.
// - U: Urimalsaem, el diccionario abierto del NIKL (opendict.korean.go.kr), que recoge palabras
//   nuevas y de fans. Da la definición en coreano («definicion»); el significado en español es una
//   traducción de esa definición.
// La lectura en letras latinas sigue la romanización oficial coreana, a partir de la pronunciación
// que da el diccionario.
//
// Quedaron fuera por no tener entrada propia: 응원봉 (lightstick), 화이팅 (la forma oficial es
// 파이팅) y las formas conjugadas 사랑해, 고마워 y 보고 싶어.
//
// Cómo se usa (como el catálogo de Connect):
// - «id»: lo que guarda el sello. No cambies el id de una palabra ya usada.
// - Nunca se añade ni se cambia una palabra sin comprobarla antes en un diccionario oficial y
//   sin el visto bueno de la autora (CLAUDE.md: nada de hangul inventado).

const COMPROBADA_EN = '2026-11-22';
const BUSQUEDA_B = 'https://krdict.korean.go.kr/spa/dicMarinerSearch/search?nation=spa&nationCode=6&ParaWordNo=&mainSearchWord=';

// Fuente B: la búsqueda de la palabra en el diccionario básico. «entrada» lleva el número del
// homónimo cuando la misma palabra tiene varias entradas (por ejemplo, 감사¹ «gratitud»).
function enB(hangul, entrada = hangul) {
  return { diccionario: 'B', entrada, enlace: BUSQUEDA_B + encodeURIComponent(hangul), comprobadaEn: COMPROBADA_EN };
}

// Fuente U: el enlace va directo a la acepción de Urimalsaem.
function enU(entrada, numeroAcepcion, definicion) {
  return {
    diccionario: 'U',
    entrada,
    definicion,
    enlace: `https://opendict.korean.go.kr/dictionary/view?sense_no=${numeroAcepcion}`,
    comprobadaEn: COMPROBADA_EN,
  };
}

export const GRUPOS_HANGUL = [
  { id: 'emociones', texto: 'Emociones y sentimientos' },
  { id: 'musica', texto: 'Música y escenario' },
  { id: 'fandom', texto: 'Idols y fans' },
  { id: 'simbolos', texto: 'Símbolos' },
];

const palabra = (id, grupo, hangul, lectura, significado, fuente, extra = {}) => ({
  id, grupo, hangul, lectura, significado, fuente, validadaPor: 'autora', validadaEn: COMPROBADA_EN, ...extra,
});

export const PALABRAS_HANGUL = [
  // Emociones y sentimientos
  palabra('amor', 'emociones', '사랑', 'sarang', 'amor', enB('사랑', '사랑¹')),
  palabra('felicidad', 'emociones', '행복', 'haengbok', 'felicidad', enB('행복')),
  palabra('emocion', 'emociones', '설렘', 'seollem', 'emoción que acelera el corazón',
    enU('설렘', 784723, '마음이 가라앉지 아니하고 들떠서 두근거림. 또는 그런 느낌.')),
  palabra('gratitud', 'emociones', '감사', 'gamsa', 'agradecimiento, gratitud', enB('감사', '감사¹'),
    { aviso: 'Otra palabra igual significa «auditoría».' }),
  palabra('esperanza', 'emociones', '희망', 'huimang', 'esperanza', enB('희망')),
  palabra('valor', 'emociones', '용기', 'yonggi', 'valor, valentía', enB('용기', '용기¹'),
    { aviso: 'Otra palabra igual significa «recipiente».' }),
  palabra('sueno', 'emociones', '꿈', 'kkum', 'sueño (lo que sueñas)', enB('꿈')),
  palabra('amistad', 'emociones', '우정', 'ujeong', 'amistad', enB('우정')),
  palabra('corazon', 'emociones', '마음', 'maeum', 'corazón (los sentimientos)', enB('마음')),
  palabra('sonrisa', 'emociones', '미소', 'miso', 'sonrisa', enB('미소')),
  palabra('consuelo', 'emociones', '위로', 'wiro', 'consuelo', enB('위로')),
  palabra('nostalgia', 'emociones', '그리움', 'geurium', 'nostalgia', enB('그리움')),
  palabra('para-siempre', 'emociones', '영원히', 'yeongwonhi', 'para siempre, eternamente', enB('영원히')),
  palabra('juntos', 'emociones', '함께', 'hamkke', 'juntos', enB('함께')),

  // Música y escenario
  palabra('musica', 'musica', '음악', 'eumak', 'música', enB('음악')),
  palabra('cancion', 'musica', '노래', 'norae', 'canción', enB('노래')),
  palabra('baile', 'musica', '춤', 'chum', 'baile, danza', enB('춤')),
  palabra('escenario', 'musica', '무대', 'mudae', 'escenario', enB('무대')),
  palabra('concierto', 'musica', '콘서트', 'konseoteu', 'concierto', enB('콘서트')),
  palabra('album', 'musica', '앨범', 'aelbeom', 'álbum', enB('앨범')),
  palabra('comeback', 'musica', '컴백', 'keombaek', 'regreso (comeback)', enB('컴백')),
  palabra('debut', 'musica', '데뷔', 'debwi', 'debut', enB('데뷔')),
  palabra('fanchant', 'musica', '응원법', 'eungwonbeop', 'fanchant: animar con consignas, canciones y movimientos',
    enU('응원법', 1420947, '운동 경기나 콘서트 따위에서, 선수나 가수 등이 힘을 낼 수 있도록 구호·노래·율동 등으로 응원하는 방법.')),
  palabra('photocard', 'musica', '포카', 'poka', 'photocard (abreviado)',
    enU('포카', 1596106, '‘포토 카드’를 줄여 이르는 말.')),

  // Idols y fans
  palabra('fan', 'fandom', '팬', 'paen', 'fan', enB('팬', '팬¹'),
    { aviso: 'Otras palabras iguales significan «sartén» y «ventilador».' }),
  palabra('fandom', 'fandom', '팬덤', 'paendeom', 'fandom', enB('팬덤')),
  palabra('idol', 'fandom', '아이돌', 'aidol', 'ídolo (idol)', enB('아이돌')),
  palabra('bias', 'fandom', '최애', 'choeae', 'favorito, favorita (bias)', enB('최애')),
  palabra('maknae', 'fandom', '막내', 'mangnae', 'el o la menor (maknae)', enB('막내'),
    { aviso: 'Se pronuncia [망내]; los fans lo escriben «maknae».' }),
  palabra('lider', 'fandom', '리더', 'rideo', 'líder', enB('리더')),
  palabra('aegyo', 'fandom', '애교', 'aegyo', 'encanto, gracia (aegyo)', enB('애교')),
  palabra('carino-de-fan', 'fandom', '팬심', 'paensim', 'cariño de fan',
    enU('팬심', 658158, '운동 경기나 선수 또는 연극, 영화, 음악 따위나 배우, 가수 등을 열광적으로 좋아하는 사람의 마음.')),
  palabra('vamos', 'fandom', '파이팅', 'paiting', '¡vamos! (fighting)', enB('파이팅'),
    { aviso: 'Es la forma oficial; los fans también escriben 화이팅, que no está en el catálogo.' }),
  palabra('gran-exito', 'fandom', '대박', 'daebak', 'gran éxito', enB('대박')),

  // Símbolos
  palabra('estrella', 'simbolos', '별', 'byeol', 'estrella', enB('별', '별¹')),
  palabra('luz', 'simbolos', '빛', 'bit', 'luz', enB('빛')),
];

export function buscarPalabra(id) {
  return PALABRAS_HANGUL.find((p) => p.id === id);
}

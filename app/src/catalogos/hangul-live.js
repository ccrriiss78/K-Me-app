// CATÁLOGO de los retos de «Mi escenario» (D062): de momento, la miniclase HANGUL LIVE 001,
// «Tu voz. Nuestra luz». Textos y dibujos aprobados por la autora el 24/11/2026 (E0073): «ok, pero
// de momento acepto tb los dibujos». Se pueden cambiar después de verlos en el navegador.
//
// Hangul (D043, excepción D062): estas 3 expresiones solo valen para la miniclase.
// - 파이팅 tiene entrada propia en el Diccionario Básico de Coreano del NIKL (ya está en el sello).
// - 안녕하세요 y 고마워요 no la tienen: son las formas educadas de 안녕하다 y 고맙다. Se da la fuente de
//   esa palabra base y van marcadas como pendientes de revisar por una persona que hable coreano.
// - El catálogo del sello (hangul.js) no cambia.
//
// Cómo se usa:
// - En la base de datos solo se guardan el id del reto y los números de las preguntas acertadas:
//   los textos se pueden corregir aquí sin tocar la base de datos.
// - No cambies el id del reto, el id de una expresión ni el número de una pregunta: los usan el
//   progreso guardado y la recompensa.
// - La recompensa (Kpopis y tesoro) la entrega el servidor una sola vez por cuenta (D063).

const BUSQUEDA_B = 'https://krdict.korean.go.kr/spa/dicMarinerSearch/search?nation=spa&nationCode=6&ParaWordNo=&mainSearchWord=';
const fuenteB = (entrada) => ({
  diccionario: 'Diccionario Básico de Coreano (NIKL)',
  entrada,
  enlace: BUSQUEDA_B + encodeURIComponent(entrada),
});

// Las 3 expresiones, en el orden en que se enseñan.
// - traduccion y explicacion: la tarjeta de la miniclase.
// - significado y sirvePara: lo que se ve tras cada respuesta («= hola: sirve para saludar»).
const EXPRESIONES_001 = [
  {
    id: 'annyeonghaseyo',
    hangul: '안녕하세요',
    lectura: 'annyeonghaseyo',
    traduccion: '«Hola», en forma educada',
    explicacion: 'Literalmente pregunta si estás bien, en paz. Es el saludo educado: perfecto para alguien que no conoces, como otra persona en la fila del concierto.',
    significado: 'hola',
    sirvePara: 'saludar',
    fuente: fuenteB('안녕하다'),
    pendienteDeRevision: true,
  },
  {
    id: 'gomawoyo',
    hangul: '고마워요',
    lectura: 'gomawoyo',
    traduccion: '«Gracias», educado y cercano',
    explicacion: 'Sirve para dar las gracias con educación a alguien con quien tienes confianza, como alguien del fandom que te regala una photocard.',
    significado: 'gracias',
    sirvePara: 'dar las gracias',
    fuente: fuenteB('고맙다'),
    pendienteDeRevision: true,
  },
  {
    id: 'paiting',
    hangul: '파이팅',
    lectura: 'paiting',
    traduccion: '«¡Ánimo!, ¡vamos!»',
    explicacion: 'Viene del inglés «fighting». Se grita para dar fuerza, por ejemplo a tu idol antes de salir al escenario.',
    significado: '¡ánimo!',
    sirvePara: 'dar ánimos',
    fuente: fuenteB('파이팅'),
    pendienteDeRevision: false,
  },
];

// Las 3 preguntas. Las opciones son siempre las 3 expresiones, en un orden distinto en cada una,
// y la respuesta correcta cambia de sitio. «toca»: lo que había que hacer («Aquí toca saludar»).
// «bien»: lo que se añade al acertar, después de la traducción.
const PREGUNTAS_001 = [
  {
    numero: 1,
    texto: 'En la fila del concierto quieres saludar a alguien que no conoces. ¿Qué le dices?',
    opciones: ['paiting', 'annyeonghaseyo', 'gomawoyo'],
    respuesta: 'annyeonghaseyo',
    toca: 'saludar',
    bien: 'Es el saludo educado, perfecto para alguien que no conoces.',
  },
  {
    numero: 2,
    texto: 'Alguien del fandom te regala una photocard de tu bias. ¿Qué le dices?',
    opciones: ['annyeonghaseyo', 'paiting', 'gomawoyo'],
    respuesta: 'gomawoyo',
    toca: 'dar las gracias',
    bien: 'Así agradeces el regalo con educación.',
  },
  {
    numero: 3,
    texto: 'Tu idol está a punto de salir al escenario. ¿Qué le gritas para darle ánimos?',
    opciones: ['paiting', 'gomawoyo', 'annyeonghaseyo'],
    respuesta: 'paiting',
    toca: 'dar ánimos',
    bien: 'Así le das fuerza a tu idol.',
  },
];

// HANGUL LIVE 002 y 003 (D086, E0101), a petición de la autora: «quiero añadir algún mensaje más para
// el hangul… puede tener que ver con las emociones además de con el kpop». Sus 6 palabras salen del
// catálogo del sello (hangul.js: comprobado en el NIKL y aprobado por la autora, D043); el 27/11/2026
// se volvió a comprobar que cada una tiene su entrada propia en el Diccionario Básico de Coreano, con
// ese significado. Las explicaciones siguen las acepciones del diccionario.
const EXPRESIONES_002 = [
  {
    id: 'sarang',
    hangul: '사랑',
    lectura: 'sarang',
    traduccion: '«Amor»',
    explicacion: 'Es el amor de pareja, pero también el cariño por alguien o por algo que te gusta mucho, como la música de tu grupo.',
    significado: 'amor',
    sirvePara: 'hablar de amor',
    fuente: fuenteB('사랑'),
    pendienteDeRevision: false,
  },
  {
    id: 'haengbok',
    hangul: '행복',
    lectura: 'haengbok',
    traduccion: '«Felicidad»',
    explicacion: 'Es la alegría de sentirte bien y a gusto con lo que vives, como al salir de un concierto.',
    significado: 'felicidad',
    sirvePara: 'hablar de la felicidad',
    fuente: fuenteB('행복'),
    pendienteDeRevision: false,
  },
  {
    id: 'miso',
    hangul: '미소',
    lectura: 'miso',
    traduccion: '«Sonrisa»',
    explicacion: 'Es una sonrisa suave, sin reír en voz alta, como la de tu bias en una photocard.',
    significado: 'sonrisa',
    sirvePara: 'hablar de una sonrisa',
    fuente: fuenteB('미소'),
    pendienteDeRevision: false,
  },
];

const PREGUNTAS_002 = [
  {
    numero: 1,
    texto: 'Preparas una pancarta para decirle a tu idol cuánto le quieres. ¿Qué palabra escribes?',
    opciones: ['haengbok', 'sarang', 'miso'],
    respuesta: 'sarang',
    toca: 'hablar de amor',
    bien: 'Es la palabra del amor, también del que sientes por tu idol.',
  },
  {
    numero: 2,
    texto: 'Al terminar el concierto, tu idol dice que esa noche le ha dado mucha felicidad. ¿Qué palabra usa?',
    opciones: ['sarang', 'miso', 'haengbok'],
    respuesta: 'haengbok',
    toca: 'hablar de la felicidad',
    bien: 'Así se dice lo bien que se siente.',
  },
  {
    numero: 3,
    texto: 'En tu photocard nueva, tu bias sale con una sonrisa suave. ¿Qué palabra la nombra?',
    opciones: ['miso', 'haengbok', 'sarang'],
    respuesta: 'miso',
    toca: 'hablar de una sonrisa',
    bien: 'Es una sonrisa suave, como la de tu photocard.',
  },
];

const EXPRESIONES_003 = [
  {
    id: 'mudae',
    hangul: '무대',
    lectura: 'mudae',
    traduccion: '«Escenario»',
    explicacion: 'Es el sitio donde se canta, se baila o se actúa delante del público.',
    significado: 'escenario',
    sirvePara: 'hablar del escenario',
    fuente: fuenteB('무대'),
    pendienteDeRevision: false,
  },
  {
    id: 'choeae',
    hangul: '최애',
    lectura: 'choeae',
    traduccion: '«Favorito, favorita»',
    explicacion: 'Lo que más quieres. Los fans la usan para su miembro favorito del grupo: su bias.',
    significado: 'favorito',
    sirvePara: 'decir quién es tu favorito',
    fuente: fuenteB('최애'),
    pendienteDeRevision: false,
  },
  {
    id: 'keombaek',
    hangul: '컴백',
    lectura: 'keombaek',
    traduccion: '«Regreso, vuelta» (comeback)',
    explicacion: 'Viene del inglés «comeback»: volver adonde ya estabas. En el K-pop, un grupo hace su comeback cuando vuelve con canciones nuevas.',
    significado: 'regreso',
    sirvePara: 'hablar del regreso de un grupo',
    fuente: fuenteB('컴백'),
    pendienteDeRevision: false,
  },
];

const PREGUNTAS_003 = [
  {
    numero: 1,
    texto: 'Se apagan las luces y tu grupo sale a cantar y bailar delante de todo el público. ¿Dónde está?',
    opciones: ['choeae', 'mudae', 'keombaek'],
    respuesta: 'mudae',
    toca: 'hablar del escenario',
    bien: 'Es el sitio donde actúa tu grupo.',
  },
  {
    numero: 2,
    texto: 'Alguien del fandom te pregunta quién es tu miembro favorito del grupo. ¿Qué palabra usa?',
    opciones: ['keombaek', 'mudae', 'choeae'],
    respuesta: 'choeae',
    toca: 'decir quién es tu favorito',
    bien: 'Así se pregunta por tu bias.',
  },
  {
    numero: 3,
    texto: 'Tu grupo anuncia que vuelve con canciones nuevas después de un tiempo. ¿Cómo se llama esa vuelta?',
    opciones: ['keombaek', 'choeae', 'mudae'],
    respuesta: 'keombaek',
    toca: 'hablar del regreso de un grupo',
    bien: 'Es el comeback: la vuelta de tu grupo.',
  },
];

// Las clases, en el orden en que se siguen («Siguiente clase» y «Clase anterior»).
// - queSeAprende: el título de lo que enseña la clase (por defecto, «Las 3 expresiones»).
// - aviso: solo si alguna palabra está pendiente de revisar.
// - recompensa: los Kpopis y, si lo hay, el tesoro; solo la primera vez que se completa.
export const RETOS = [
  {
    id: 'hangul-live-001',
    titulo: 'HANGUL LIVE 001',
    lema: 'Tu voz. Nuestra luz',
    entrada: 'Antes de un concierto, los fans se saludan, se dan las gracias y animan a su idol. Aprende a hacerlo en coreano y gana tu primer lightstick.',
    aviso: '안녕하세요 y 고마워요 son formas educadas de palabras del diccionario. Pendiente de revisar por una persona que hable coreano.',
    expresiones: EXPRESIONES_001,
    preguntas: PREGUNTAS_001,
    recompensa: { kpopis: 20, tesoro: 'luz-hangul-001' },
  },
  {
    id: 'hangul-live-002',
    titulo: 'HANGUL LIVE 002',
    lema: 'Lo que sentimos',
    entrada: 'En el K-pop, los fans hablan mucho de lo que sienten. Aprende tres palabras para decirlo en coreano: amor, felicidad y sonrisa.',
    queSeAprende: 'Las 3 palabras',
    expresiones: EXPRESIONES_002,
    preguntas: PREGUNTAS_002,
    recompensa: { kpopis: 20 },
  },
  {
    id: 'hangul-live-003',
    titulo: 'HANGUL LIVE 003',
    lema: 'Nuestro escenario',
    entrada: 'Escenario, favorito y comeback: tres palabras que todo fan escucha. Aprende a reconocerlas en coreano.',
    queSeAprende: 'Las 3 palabras',
    expresiones: EXPRESIONES_003,
    preguntas: PREGUNTAS_003,
    recompensa: { kpopis: 20 },
  },
];

// Repasar (D087, E0102; la autora: «y si en otra sesión repiten clase podría ganar 5 Kpopis»): repetir
// una clase ya completada da estos Kpopis, como mucho una vez al día por clase (día de Madrid). La
// recompensa de la clase sigue siendo solo para la primera vez.
export const REPASO = { kpopis: 5 };

export const buscarReto = (id) => RETOS.find((r) => r.id === id) ?? null;
// La clase de antes y la de después, para repasar y para seguir.
const posicion = (id) => RETOS.findIndex((r) => r.id === id);
export const retoAnterior = (id) => (posicion(id) > 0 ? RETOS[posicion(id) - 1] : null);
export const retoSiguiente = (id) => (posicion(id) >= 0 ? RETOS[posicion(id) + 1] ?? null : null);
export const buscarExpresion = (reto, id) => reto.expresiones.find((e) => e.id === id) ?? null;

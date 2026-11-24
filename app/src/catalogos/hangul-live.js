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
];

export const buscarReto = (id) => RETOS.find((r) => r.id === id) ?? null;
export const buscarExpresion = (reto, id) => reto.expresiones.find((e) => e.id === id) ?? null;

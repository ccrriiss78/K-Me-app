// CATÁLOGO de Connect (D038): las emociones que se eligen al publicar y las reacciones del muro.
//
// Es la única lista que hay que tocar para cambiarlas:
// - «id»: lo que se guarda en la base de datos. No cambies el id de algo ya usado: las publicaciones
//   y reacciones guardadas con ese id dejarían de reconocerse (la emoción se vería como «retirada»
//   y la reacción dejaría de contarse).
// - «texto»: lo que se lee en la página. Se puede cambiar cuando quieras.
// - «icono»: el dibujo, un SVG en app/public/img/connect/. Se puede sustituir por otro archivo.
//   Los de las reacciones se pintan con el color del botón (máscara CSS): dibújalos en negro sobre
//   fondo transparente. Los de las emociones se muestran tal cual (caritas con el marco del logo).
// Para añadir una, añade una línea con un id nuevo y su icono. Para retirarla, quítala de la lista.
// Listas propuestas por el asistente por encargo de la autora (22/11/2026, E0051).

export const EMOCIONES = [
  { id: 'feliz', texto: 'Feliz', icono: '/img/connect/emociones/feliz.svg' },
  { id: 'emocion', texto: '¡Qué emoción!', icono: '/img/connect/emociones/emocion.svg' },
  { id: 'orgullo', texto: 'Orgullo fan', icono: '/img/connect/emociones/orgullo.svg' },
  { id: 'flechazo', texto: 'Flechazo', icono: '/img/connect/emociones/flechazo.svg' },
  { id: 'energia', texto: 'Energía a tope', icono: '/img/connect/emociones/energia.svg' },
  { id: 'risa', texto: '¡Qué risa!', icono: '/img/connect/emociones/risa.svg' },
  { id: 'sorpresa', texto: '¡Sorpresa!', icono: '/img/connect/emociones/sorpresa.svg' },
  { id: 'nervios', texto: 'Nervios de concierto', icono: '/img/connect/emociones/nervios.svg' },
  { id: 'comeback', texto: 'Esperando el comeback', icono: '/img/connect/emociones/comeback.svg' },
  { id: 'lagrimas', texto: 'Lágrimas de emoción', icono: '/img/connect/emociones/lagrimas.svg' },
  { id: 'gratitud', texto: 'Gratitud', icono: '/img/connect/emociones/gratitud.svg' },
  { id: 'calma', texto: 'En calma', icono: '/img/connect/emociones/calma.svg' },
  { id: 'nostalgia', texto: 'Nostalgia', icono: '/img/connect/emociones/nostalgia.svg' },
  { id: 'bajon', texto: 'Un poco de bajón', icono: '/img/connect/emociones/bajon.svg' },
];

// Cada pulsación suma una reacción más: dar muchas es una forma de darle más fuerza (D038).
// Tope por persona, publicación y tipo, para que nadie inunde el muro. Se puede cambiar aquí.
export const MAX_REACCIONES_POR_TIPO = 10;

export const REACCIONES = [
  { id: 'corazon', texto: 'Corazón', icono: '/img/connect/reacciones/corazon.svg' },
  { id: 'aplauso', texto: 'Aplauso', icono: '/img/connect/reacciones/aplauso.svg' },
  { id: 'lightstick', texto: 'Lightstick', icono: '/img/connect/reacciones/lightstick.svg' },
  { id: 'minicorazon', texto: 'Mini corazón', icono: '/img/connect/reacciones/minicorazon.svg' },
  { id: 'brillas', texto: 'Brillas', icono: '/img/connect/reacciones/brillas.svg' },
  { id: 'fuego', texto: 'Fuego', icono: '/img/connect/reacciones/fuego.svg' },
  { id: 'fanchant', texto: 'Fanchant', icono: '/img/connect/reacciones/fanchant.svg' },
  { id: 'corona', texto: 'Corona', icono: '/img/connect/reacciones/corona.svg' },
  { id: 'flores', texto: 'Flores', icono: '/img/connect/reacciones/flores.svg' },
  { id: 'llorar', texto: 'Llorar', icono: '/img/connect/reacciones/llorar.svg' },
  { id: 'emocion', texto: 'Me emociona', icono: '/img/connect/reacciones/emocion.svg' },
  { id: 'tristeza', texto: 'Me entristece', icono: '/img/connect/reacciones/tristeza.svg' },
  { id: 'abrazo', texto: 'Un abrazo', icono: '/img/connect/reacciones/abrazo.svg' },
  { id: 'risa', texto: 'Me hace reír', icono: '/img/connect/reacciones/risa.svg' },
  { id: 'sorpresa', texto: 'Me sorprende', icono: '/img/connect/reacciones/sorpresa.svg' },
];

// Lo que se muestra si una publicación guarda una emoción que ya no está en la lista.
export const EMOCION_RETIRADA = { id: null, texto: 'Emoción retirada', icono: '/img/connect/emociones/calma.svg' };

export const buscarEmocion = (id) => EMOCIONES.find((e) => e.id === id) ?? null;
export const buscarReaccion = (id) => REACCIONES.find((r) => r.id === id) ?? null;

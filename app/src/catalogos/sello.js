// CATÁLOGO de Sello Studio (TECH_SPEC §4): colores, adornos, encuadres del avatar y límites.
// Las palabras en hangul están en su propio catálogo: hangul.js.
//
// Como en Connect, es la única lista que hay que tocar para cambiar las opciones:
// - «id»: lo que se guarda en la receta del sello (columna «composicion»). No cambies el id de algo
//   ya usado: los sellos guardados con ese id dejarían de abrirse.
// - «nombre» / «texto»: lo que se lee en la página. Se puede cambiar cuando quieras.
// - «valor» (colores): el tono. Si se retoca, cambia en todos los sellos que lo usan.
// - «icono» (adornos): un SVG de una sola tinta, en negro sobre fondo transparente y con
//   viewBox 0 0 24 24. El sello lo pinta del color que elija el fan.
//
// Decisiones de la autora del 22/11/2026 (D041): el sello lleva una palabra en hangul, su avatar
// o las dos cosas, nunca vacío; el alias público se muestra u oculta; no hay nombre personal ni
// otro texto libre. Colores: los 24 de la ropa del editor de avatar más los del logo original.

export const MAX_SELLOS = 20; // por cuenta (Q1)
export const MAX_MOTIVOS = 3; // adornos que acompañan, sin tapar la palabra ni el avatar
export const LARGO_NOMBRE_SELLO = { min: 1, max: 40 }; // el nombre con el que lo encuentras en «Mis sellos»; no sale en el sello

// Paleta del sello. Primero, los colores del logo original (negro, blanco y fucsia K-ME, que es el
// mismo tono que el «Fucsia» del editor). Después, 9 colores vivos que pidió la autora (D046):
// rojo y amarillo (el mismo de los ojos del editor), del 22/11/2026, y los vivos de «Mi ambiente»
// (editor-avatar/editor-avatar/js/kme-ambiente-visual.js, acentos), del 23/11/2026: verde, naranja
// («Mandarina» en Mi ambiente; aquí ya había una «Mandarina» más suave), amarillo pop, lima,
// turquesa, azul eléctrico y orquídea. De Mi ambiente no se traen «Cereza» (muy parecida al rojo y
// al rojo cereza) ni «Tinta noche» (no es un color vivo). Por último, los otros 23 de la ropa del
// editor de avatar, con sus mismos nombres (editor-avatar/editor-avatar/datos/kme.json, «paletas.arriba»).
export const COLORES = [
  { id: 'negro', nombre: 'Negro K-ME', valor: '#000000' },
  { id: 'blanco', nombre: 'Blanco K-ME', valor: '#ffffff' },
  { id: 'fucsia', nombre: 'Fucsia K-ME', valor: '#e83475' },
  { id: 'rojo', nombre: 'Rojo', valor: '#e2231a' },
  { id: 'naranja', nombre: 'Naranja', valor: '#e65725' },
  { id: 'amarillo-pop', nombre: 'Amarillo pop', valor: '#f6ad19' },
  { id: 'amarillo', nombre: 'Amarillo', valor: '#ffd000' },
  { id: 'lima', nombre: 'Lima', valor: '#d0eb39' },
  { id: 'verde', nombre: 'Verde', valor: '#18844a' },
  { id: 'turquesa', nombre: 'Turquesa', valor: '#007c91' },
  { id: 'azul-electrico', nombre: 'Azul eléctrico', valor: '#2457d6' },
  { id: 'orquidea', nombre: 'Orquídea', valor: '#8e4cd3' },
  { id: 'blanco-calido', nombre: 'Blanco cálido', valor: '#fffaf7' },
  { id: 'tinta', nombre: 'Tinta', valor: '#282126' },
  { id: 'gris', nombre: 'Gris', valor: '#6e737b' },
  { id: 'crema', nombre: 'Crema', valor: '#ede0cb' },
  { id: 'beige', nombre: 'Beige', valor: '#c7ab8d' },
  { id: 'tierra', nombre: 'Tierra', valor: '#8b6248' },
  { id: 'chocolate', nombre: 'Chocolate', valor: '#503a32' },
  { id: 'azul-marino', nombre: 'Azul marino', valor: '#293b58' },
  { id: 'denim', nombre: 'Denim', valor: '#557a9d' },
  { id: 'azul-cielo', nombre: 'Azul cielo', valor: '#6b9cd1' },
  { id: 'azul-pastel', nombre: 'Azul pastel', valor: '#b8d9ec' },
  { id: 'rosa-pastel', nombre: 'Rosa pastel', valor: '#f5bfd3' },
  { id: 'rosa-empolvado', nombre: 'Rosa empolvado', valor: '#cc7797' },
  { id: 'lavanda', nombre: 'Lavanda', valor: '#c5b1e3' },
  { id: 'lila', nombre: 'Lila', valor: '#9673b7' },
  { id: 'violeta', nombre: 'Violeta', valor: '#6a4ba1' },
  { id: 'menta', nombre: 'Menta', valor: '#b8d8c7' },
  { id: 'verde-bosque', nombre: 'Verde bosque', valor: '#56866d' },
  { id: 'oliva', nombre: 'Oliva', valor: '#818449' },
  { id: 'amarillo-suave', nombre: 'Amarillo suave', valor: '#f5d975' },
  { id: 'mandarina', nombre: 'Mandarina', valor: '#e8a15b' },
  { id: 'rojo-cereza', nombre: 'Rojo cereza', valor: '#c94d58' },
  { id: 'burdeos', nombre: 'Burdeos', valor: '#793549' },
];

// Adornos: los nueve primeros reutilizan los dibujos de las reacciones de Connect (mismo archivo).
// Es una lista aparte para que cambiar las reacciones no rompa los sellos. Estrella, nota musical y
// rayitas K-ME, aprobadas por la autora «de momento», las dibujó ChatGPT (E0058) en
// app/public/img/sello/motivos/; su dibujo concreto está pendiente de aprobación visual.
export const MOTIVOS = [
  { id: 'corazon', texto: 'Corazón', icono: '/img/connect/reacciones/corazon.svg' },
  { id: 'aplauso', texto: 'Aplauso', icono: '/img/connect/reacciones/aplauso.svg' },
  { id: 'lightstick', texto: 'Lightstick', icono: '/img/connect/reacciones/lightstick.svg' },
  { id: 'minicorazon', texto: 'Mini corazón', icono: '/img/connect/reacciones/minicorazon.svg' },
  { id: 'brillos', texto: 'Brillos', icono: '/img/connect/reacciones/brillas.svg' },
  { id: 'fuego', texto: 'Fuego', icono: '/img/connect/reacciones/fuego.svg' },
  { id: 'fanchant', texto: 'Fanchant', icono: '/img/connect/reacciones/fanchant.svg' },
  { id: 'corona', texto: 'Corona', icono: '/img/connect/reacciones/corona.svg' },
  { id: 'flores', texto: 'Flores', icono: '/img/connect/reacciones/flores.svg' },
  { id: 'estrella', texto: 'Estrella', icono: '/img/sello/motivos/estrella.svg' },
  { id: 'nota', texto: 'Nota musical', icono: '/img/sello/motivos/nota.svg' },
  { id: 'rayitas', texto: 'Rayitas K-ME', icono: '/img/sello/motivos/rayitas.svg' },
];

// Dos encuadres del MISMO avatar guardado (D041). «recorte» es la ventana del lienzo del editor de
// avatar (400 × 480) que se enseña; se dibuja sin deformar (preserveAspectRatio «meet»).
// Medidas de ChatGPT (E0058, V066) con todo el catálogo del editor: rostros, peinados (con pelo
// largo, acabados y mechones), accesorios, cuerpos, prendas y calzado. Lo más lejos que llega el
// dibujo: x 36,75–348,25; y 6,6–356,25 (cabeza) y 6,6–433,4 (cuerpo). Los recortes dejan al menos
// 8 de margen, centrados en x = 200; la ventana puede salirse del lienzo (esa parte es transparente).
// - rostro: además del recorte, se dibujan solo las capas de la cabeza («capas»); si no, con el pelo
//   largo se vería la ropa. Si se añaden accesorios de mano, habrá que separarlos antes.
// - cuerpo: todas las capas (capas: null).
// Los recortes anteriores (rostro 55 8 290 300 y cuerpo 60 0 280 450) cortaban pelo largo y bordes.
// Son amplios a propósito: falta que la autora confirme que el avatar no queda pequeño.
export const ENCUADRES = [
  {
    id: 'rostro',
    texto: 'Solo rostro',
    recorte: { x: 25, y: -5, ancho: 350, alto: 370 },
    capas: ['pelo_atras', 'cabeza', 'maquillaje', 'ojos', 'maquillaje_detalles', 'cejas', 'boca', 'pelo_frente', 'accesorio'],
  },
  { id: 'cuerpo', texto: 'Cuerpo entero', recorte: { x: 25, y: -5, ancho: 350, alto: 450 }, capas: null },
];

// De momento solo hay distribución automática: se adapta al contenido (D041). El control
// «Más palabra ↔ Más avatar» fue una propuesta de ChatGPT, sin aprobar.
export const DISTRIBUCIONES = ['automatica'];

// El sello con el que empieza el editor: los colores del logo y la palabra del boceto de ChatGPT.
export const DISENO_INICIAL = Object.freeze({
  borde: 'negro',
  fondo: 'blanco',
  palabra: { id: 'amistad', color: 'negro' },
  avatar: null,
  alias: { visible: true, color: 'negro' },
  motivos: [{ id: 'corazon', color: 'fucsia' }],
  distribucion: 'automatica',
});

export const buscarColor = (id) => COLORES.find((c) => c.id === id);
export const buscarMotivo = (id) => MOTIVOS.find((m) => m.id === id);
export const buscarEncuadre = (id) => ENCUADRES.find((e) => e.id === id);

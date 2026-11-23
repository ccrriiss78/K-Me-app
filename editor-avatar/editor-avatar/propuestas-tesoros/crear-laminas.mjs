// Generador de documentación visual. No se importa desde el editor ni implementa T029.
// Usa únicamente recursos existentes y escribe en esta carpeta de propuestas.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { svgDelAvatar } from '../js/renderizador.js';

const destino = new URL('./', import.meta.url);
const catalogoUrl = new URL('../datos/kme.json', import.meta.url);
const datos = JSON.parse(await readFile(catalogoUrl, 'utf8'));
const archivos = new Map();
for (const lista of Object.values(datos.piezas)) for (const pieza of lista) {
  for (const capa of Object.keys(pieza.capas)) {
    pieza.capas[capa] = [pieza.capas[capa]].flat();
    for (const ruta of pieza.capas[capa]) {
      if (archivos.has(ruta)) continue;
      const svg = await readFile(new URL(ruta, catalogoUrl), 'utf8');
      archivos.set(ruta, svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>')));
    }
  }
}
const catalogo = new Catalogo(datos, archivos);
const color = { papel: '#f7f3ef', panel: '#fffdf9', tinta: '#000000', rosa: '#e83475', lavanda: '#c8b0f0', menta: '#afe0bf' };
const escapar = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const texto = (x, y, s, size = 20, weight = 400, fill = color.tinta, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" ${extra}>${escapar(s)}</text>`;
const rect = (x, y, w, h, fill = color.panel, stroke = color.tinta, rx = 20, sw = 1.5) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const firma = (x, y, escala = 1) => `<g transform="translate(${x} ${y}) scale(${escala})" stroke="${color.rosa}" stroke-width="5" stroke-linecap="round"><path d="M0 16L9 0M13 16L22 0"/></g>`;
const pill = (x, y, w, s, fill = color.papel) => rect(x, y, w, 32, fill, color.tinta, 16, 1) + texto(x + 14, y + 22, s, 14, 700);
const boton = (x, y, w, s, primario = true) => rect(x, y, w, 46, primario ? color.tinta : color.panel, color.tinta, 14) + texto(x + w / 2, y + 29, s, 16, 700, primario ? color.panel : color.tinta, 'text-anchor="middle"');
const cabeza = (titulo, subtitulo, alto) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 ${alto}" role="img" aria-labelledby="titulo descripcion"><title id="titulo">${escapar(titulo)}</title><desc id="descripcion">${escapar(subtitulo)}. Propuesta pendiente de aprobación; datos ficticios; no es una pantalla funcional.</desc><rect width="1400" height="${alto}" fill="${color.papel}"/><g font-family="Segoe UI,Arial,sans-serif" fill="${color.tinta}">${texto(40, 43, 'K-ME / STUDIO', 18, 800)}${firma(215, 25, .8)}${texto(1360, 43, 'PROPUESTA · DATOS FICTICIOS', 15, 700, color.tinta, 'text-anchor="end"')}${texto(40, 111, titulo, 56, 850)}${texto(40, 153, subtitulo, 22)}<path d="M40 183H1360" stroke="${color.tinta}" stroke-width="1"/>`;
const fin = '</g></svg>';

// Plantilla de ilustración propia: origen 0,0 y lienzo 160 × 220.
// No es un catálogo de premios, una receta de cuenta ni una concesión de evento.
const estrella = `<path d="M80 24L89 47L113 56L89 65L80 89L71 65L47 56L71 47Z"/>`;
function lightstick(tipo) {
  const acento = [color.rosa, color.lavanda, color.menta][tipo];
  const formas = [
    '<circle cx="80" cy="57" r="47"/>',
    '<ellipse cx="80" cy="57" rx="40" ry="49"/>',
    '<path d="M80 13C102-4 119 19 115 33C144 36 143 65 123 75C133 99 105 115 88 101C69 121 42 105 44 85C15 79 18 49 39 42C32 20 58 3 73 18Q77 15 80 13Z"/>'
  ];
  const motivos = [estrella,
    '<circle cx="80" cy="57" r="23"/><ellipse cx="80" cy="57" rx="38" ry="11" transform="rotate(-25 80 57)" fill="none"/>',
    '<path d="M80 35C103 40 108 61 80 78C52 61 57 40 80 35Z"/><path d="M80 44V73" fill="none"/>'
  ];
  return `<g stroke="${color.tinta}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><g fill="${color.panel}">${formas[tipo]}</g><g fill="${acento}">${motivos[tipo]}</g><path d="M66 104H94L91 119H69Z" fill="${acento}"/><rect x="70" y="119" width="20" height="71" rx="9" fill="${color.panel}"/><path d="M73 133H87M73 142H87"/><path d="M80 190C104 202 99 220 81 210C64 201 64 197 80 190Z" fill="none"/>${firma(112, 7, .62)}</g>`;
}
const objetos = [
  { evento: 'Pulso compartido', objeto: 'Lightstick Pulso', tipo: 'Circular · estrella', fecha: '22/11/2026', acento: color.rosa },
  { evento: 'Órbita fan', objeto: 'Lightstick Órbita', tipo: 'Ovalado · planeta', fecha: '21/11/2026', acento: color.lavanda },
  { evento: 'Jardín de voces', objeto: 'Lightstick Jardín', tipo: 'Flor · semilla', fecha: '20/11/2026', acento: color.menta }
];
function objetoEn(x, y, escala, tipo) { return `<g transform="translate(${x} ${y}) scale(${escala})">${lightstick(tipo)}</g>`; }

// Se conserva el personaje real del renderizador. La superposición no cambia sus recursos.
const avatar = structuredClone(catalogo.porDefecto);
const real = svgDelAvatar(catalogo, avatar, { id: 'avatar-real-tesoros' });
const preview = real.replace('</svg>', `<g data-boceto="objeto-no-integrado" transform="translate(218 293) rotate(-10 25 53) scale(.33)">${lightstick(0)}</g></svg>`);
const montar = (svg, x, y, ancho, alto) => svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${ancho}" height="${alto}" `);

let principal = cabeza('Mis tesoros', 'Los recuerdos que has ganado también cuentan quién eres.', 1040);
principal += pill(40, 204, 185, 'AVATAR STUDIO') + pill(240, 204, 175, 'MIS TESOROS', color.rosa);
principal += texto(1360, 226, 'Se gana en un evento. No se compra.', 18, 650, color.tinta, 'text-anchor="end"');
principal += rect(40, 260, 355, 520) + texto(65, 296, 'TU AVATAR · VISTA ORIENTATIVA', 14, 750);
principal += montar(preview, 65, 310, 305, 366);
principal += texto(65, 709, 'Pulso está puesto', 23, 750) + texto(65, 739, 'Avatar real; agarre por ajustar.', 16);
for (let i = 0; i < 3; i++) {
  const o = objetos[i], x = 420 + i * 318;
  principal += rect(x, 260, 304, 520, color.panel, i === 0 ? color.rosa : color.tinta, 22, i === 0 ? 3 : 1.5);
  principal += pill(x + 18, 280, 110, i === 0 ? '✓ PUESTO' : 'GANADO', i === 0 ? color.rosa : color.papel);
  principal += objetoEn(x + 76, 331, .91, i);
  principal += texto(x + 22, 565, o.objeto, 24, 750) + texto(x + 22, 600, o.evento, 22, 650);
  principal += texto(x + 22, 634, 'Concierto · evento ficticio', 16) + texto(x + 22, 665, 'Ganado · ' + o.fecha, 17);
  principal += boton(x + 20, 704, 264, i === 0 ? 'Quitar del avatar' : 'Poner en mi avatar', i !== 0);
}
function estuche(x, y, escala = 1, lleno = false) {
  return `<g transform="translate(${x} ${y}) scale(${escala})" stroke="${color.tinta}" stroke-width="3" fill="${color.panel}" stroke-linecap="round" stroke-linejoin="round"><path d="M8 55L17 12Q20 2 35 4L98 11Q113 14 110 27L102 58Z"/><rect x="0" y="53" width="115" height="55" rx="17"/><path d="M17 65H98"/>${lleno ? `<g transform="translate(38 20) scale(.25)">${lightstick(0)}</g>` : ''}<path d="M49 82Q43 72 39 80Q38 86 49 93Q61 86 59 80Q55 73 49 82Z" fill="${color.rosa}"/></g>`;
}
principal += rect(40, 810, 644, 150) + estuche(62, 831, .9) + texto(192, 853, 'Cuando todavía no tienes objetos', 22, 750) + texto(192, 892, 'Aquí vivirán tus recuerdos de eventos.', 19) + texto(192, 925, 'Sin objetos bloqueados ni precios.', 17);
principal += rect(708, 810, 652, 150) + estuche(731, 832, .9, true) + texto(861, 853, 'Este recuerdo ya es tuyo', 23, 750) + texto(861, 893, 'Pulso compartido · Concierto', 19) + texto(861, 925, 'Ganado · 22/11/2026', 17);
principal += texto(40, 1003, 'Boceto estático · Sin guardado, eventos ni equipación funcional · Los botones representan estados por aprobar.', 16) + fin;

let plantilla = cabeza('Un evento, un recuerdo propio', 'Plantilla modular de lightsticks · tres conciertos ficticios · dibujos originales por aprobar.', 1060);
for (let i = 0; i < 3; i++) {
  const x = 40 + 448 * i, o = objetos[i];
  plantilla += rect(x, 215, 424, 497) + texto(x + 24, 257, '0' + (i + 1), 20, 800);
  plantilla += objetoEn(x + 110, 278, 1.28, i) + texto(x + 24, 604, o.evento, 27, 750);
  plantilla += texto(x + 24, 642, o.tipo, 20) + texto(x + 24, 680, 'Concierto ficticio · ' + o.fecha, 18);
}
plantilla += rect(40, 743, 1320, 240) + texto(65, 785, 'LA PLANTILLA', 17, 800) + texto(65, 823, 'Cabeza + cuello + mango + correa + motivo', 27, 750);
plantilla += texto(65, 863, 'El contorno y el motivo distinguen al evento, incluso sin color.', 21);
plantilla += texto(65, 899, 'Lienzo propio 160 × 220. Para el avatar: escala y anclaje por anchura.', 20);
plantilla += texto(65, 935, 'No son variantes que ya se repartan a fans. No hay sorteo, rarezas ni catálogo de compra.', 18);
plantilla += `<circle cx="1190" cy="787" r="14" fill="${color.rosa}" stroke="#000"/><circle cx="1240" cy="787" r="14" fill="${color.lavanda}" stroke="#000"/><circle cx="1290" cy="787" r="14" fill="${color.menta}" stroke="#000"/>`;
plantilla += texto(40, 1023, 'Paleta existente: negro, marfil, fucsia K-ME, lavanda y menta de Mi ambiente. No incorpora colores nuevos.', 16) + fin;

const baseConnect = new URL('../../../app/public/img/connect/', import.meta.url);
const emociones = [];
const reacciones = [];
for (const [subcarpeta, lista] of [['emociones', emociones], ['reacciones', reacciones]]) {
  for (const nombre of (await readdir(new URL(subcarpeta + '/', baseConnect))).filter(n => n.endsWith('.svg')).sort()) {
    lista.push({ nombre: nombre.slice(0, -4), svg: await readFile(new URL(subcarpeta + '/' + nombre, baseConnect), 'utf8') });
  }
}
const actual = nombre => reacciones.find(o => o.nombre === nombre).svg;
const nuevoAplauso = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g stroke="#000" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M10 21L4 15Q2 13 4 12L7 14L4 7Q4 5 6 6L9 11L7 5Q7 3 9 4L12 11L11 6Q12 4 13 7L15 14Q17 18 14 21Z"/><path d="M16 7L18 4M19 10L22 9M16 16L19 15M16 2V1"/></g></svg>`;
const nuevoMini = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="#000" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 22L6 16Q5 14 7 14L10 16L9 10Q9 8 11 10L13 15L15 11Q17 9 17 12L16 18L14 22"/><path d="M14 7C9 4 10 1 12 1Q14 1 14 3Q15 0 17 1C20 3 16 6 14 7Z"/></g></svg>`;
let ideas = cabeza('Pequeños gestos, una misma identidad', 'Grupo E · ideas visuales nuevas, sin implementar · Connect conserva sus decisiones D038.', 1190);
ideas += rect(40, 214, 690, 355) + texto(65, 255, 'CONNECT · ANTES / PROPUESTA', 18, 800);
ideas += texto(65, 288, 'Conservar marco y rubor de las caritas.', 20);
for (let i = 0; i < 7; i++) ideas += montar(emociones[i].svg, 65 + i * 90, 306, 54, 54);
ideas += texto(65, 403, 'Aplauso', 19, 700) + montar(actual('aplauso'), 190, 371, 45, 45) + texto(248, 403, '→', 25) + montar(nuevoAplauso, 291, 371, 45, 45);
ideas += texto(370, 403, 'Mini corazón', 19, 700) + montar(actual('minicorazon'), 529, 371, 45, 45) + texto(584, 403, '→', 25) + montar(nuevoMini, 630, 371, 45, 45);
ideas += texto(65, 463, 'Probar a 20–24 px y con el nombre accesible.', 19) + texto(65, 499, 'Solo bocetos: decidir si mejoran la lectura.', 19) + texto(65, 536, 'No se cambian los SVG de Connect.', 17);
ideas += rect(754, 214, 606, 355) + texto(780, 255, 'EVENTOS · ENERGÍA COMPARTIDA', 18, 800);
ideas += texto(780, 298, 'Boceto de estados · no define reglas', 20);
for (const [i, pct] of [65, 100].entries()) {
  const y = 330 + i * 90;
  ideas += rect(780, y, 465, 26, color.papel, color.tinta, 13, 1) + `<rect x="782" y="${y + 2}" width="${461 * pct / 100}" height="22" rx="11" fill="${color.rosa}"/>`;
  ideas += texto(1270, y + 22, pct + '%', 22, 800) + texto(780, y + 58, i ? 'Un recuerdo de haber estado juntos.' : 'La energía crece con vuestra presencia.', 18);
}
ideas += texto(780, 539, 'Sin parpadeos. Estado directo si reduces movimiento.', 16);
ideas += rect(40, 594, 1320, 320) + texto(65, 638, 'NO TODO TIENE QUE PEDIRTE VOLVER MAÑANA', 18, 800);
ideas += texto(65, 684, 'Recuerdos, combinaciones y encuentros.', 34, 750);
ideas += texto(65, 728, 'Una colección que cuenta tu historia, sin rachas ni clasificaciones.', 24);
ideas += texto(65, 774, 'Objetos del evento: una identidad común. Detalles personales: elección por decidir.', 22);
ideas += texto(65, 817, 'Sin precios en Mis tesoros. Sin huecos de «te falta». Sin presión para completar.', 22);
ideas += texto(65, 861, 'Animación propuesta: entrada breve y única. El estado final también se entiende sin ella.', 20);
ideas += rect(40, 939, 1320, 171) + texto(65, 979, 'CAPAS Y CUERPO · CRITERIOS PARA EL SIGUIENTE BLOQUE', 17, 800);
ideas += texto(65, 1018, 'Objeto separado de gafas y auriculares · mango entre palma y mano · anclaje por anchura', 21);
ideas += texto(65, 1055, 'Comprobar cabello, mangas y ropa · sin recorte en los dos marcos ni en impresión', 21);
ideas += texto(40, 1150, 'Los objetos para otros tipos de evento solo se enumeran en el informe; aún no se dibujan.', 16) + fin;

const salidas = [
  ['KME_MIS_TESOROS_PROPUESTA.svg', principal],
  ['KME_LIGHTSTICKS_PLANTILLA.svg', plantilla],
  ['KME_IDEAS_VISUALES.svg', ideas]
];
for (const [nombre, contenido] of salidas) await writeFile(new URL(nombre, destino), contenido, { encoding: 'utf8', flag: 'w' });
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>K-ME · Propuesta Mis tesoros</title><style>:root{color:#000;background:#f7f3ef;font:18px/1.5 'Segoe UI',Arial,sans-serif}body{margin:0}main{max-width:1400px;margin:auto;padding:24px}h1{font-size:2rem;margin:0}a{color:#000;text-underline-offset:4px}a:focus-visible{outline:3px solid #000;outline-offset:4px}nav{display:flex;gap:24px;flex-wrap:wrap;padding:16px 0}figure{margin:24px 0 50px}img{display:block;width:100%;height:auto;border:1px solid #000;border-radius:16px}figcaption{font-size:1rem;margin-top:12px}p{max-width:90ch}.aviso{padding:16px;border:1px solid #000;border-radius:14px;background:#fffdf9}</style></head><body><main><h1>Mis tesoros · propuesta para revisar</h1><p class="aviso"><strong>Diseño pendiente de aprobación · datos ficticios.</strong> Estos son dibujos estáticos. Poner y quitar no funcionan todavía; no hay premios, eventos ni guardado por cuenta. El avatar es el del editor actual, con una superposición orientativa; no acredita el ajuste final de mano y capas.</p><nav aria-label="Láminas"><a href="#tesoros">El apartado</a><a href="#plantilla">Lightsticks</a><a href="#ideas">Ideas visuales</a><a href="REVISION_Y_PROPUESTA.md">Informe completo A–E</a></nav><figure id="tesoros"><img src="KME_MIS_TESOROS_PROPUESTA.svg" alt="Propuesta Mis tesoros: avatar real del editor, tres recuerdos ficticios de conciertos con nombre, tipo y fecha, estados puesto y disponible, estado vacío y objeto ganado."><figcaption>El apartado puede alojar objetos de distintos tipos de evento. Se ilustran únicamente conciertos, como pidió la autora.</figcaption></figure><figure id="plantilla"><img src="KME_LIGHTSTICKS_PLANTILLA.svg" alt="Tres lightsticks originales: bola circular con estrella fucsia, bola ovalada con planeta lavanda y flor con semilla menta."><figcaption>Plantilla de ilustración, todavía fuera del catálogo del editor. Colores presentes en la paleta actual.</figcaption></figure><figure id="ideas"><img src="KME_IDEAS_VISUALES.svg" alt="Bocetos nuevos: revisión de dos reacciones, energía colectiva estática al 65 y 100 por ciento, motivación sin rachas y criterios de capas."><figcaption>Grupo E: ninguna idea nueva se aplica sin aprobación. Connect conserva sus archivos y su comportamiento.</figcaption></figure><p>Otros objetos posibles, solo como ideas sin dibujar: broche de pincel para un taller, charm de nudo para un encuentro local, pulsera de ritmo para baile y etiqueta de estuche para un encuentro de intercambio. Sus eventos y reglas no están decididos.</p><p><a href="REVISION_Y_PROPUESTA.md">Leer revisión, fuentes, aprobaciones, contradicciones y siguiente bloque de tests.</a></p></main></body></html>`;
await writeFile(new URL('ABRIR_PROPUESTA.html', destino), html, 'utf8');
console.log(JSON.stringify({ documentos: [...salidas.map(([n]) => n), 'ABRIR_PROPUESTA.html'], recursosConnectLeidos: emociones.length + reacciones.length, emociones: emociones.length, reacciones: reacciones.length, recursosAvatarLeidos: archivos.size, implementacionT029: false }, null, 2));

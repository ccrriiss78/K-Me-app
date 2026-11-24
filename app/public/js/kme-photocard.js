// PHOTOCARD DEL SELLO (D045, T035): lo que no depende del navegador, para poder probarlo en Node.
// - svgSelloPhotocard: mete el sello entero en una tarjeta de 55 × 85 mm, centrado, sin recortarlo
//   ni estirarlo, con un margen y el mismo fondo que la photocard del avatar.
// - crearPdfPhotocard: COPIA del generador del editor de avatar
//   (editor-avatar/editor-avatar/js/kme-impresion.js), como decidió la autora (D045): un PDF sin
//   bibliotecas con una imagen JPEG a 300 ppp. Un test comprueba que da los mismos bytes que el
//   original; si cambias uno, cambia el otro.
// - nombreArchivo: el nombre de la descarga, a partir del nombre del sello, sin símbolos.
// El script del navegador (sello-impresion.js) pasa el sello a imagen con un <canvas> y descarga.

export const FORMATO = { id: '55x85', ancho: 55, alto: 85 };
// 55 × 85 mm a 300 puntos por pulgada.
export const PIXELES = { ancho: Math.round((FORMATO.ancho / 25.4) * 300), alto: Math.round((FORMATO.alto / 25.4) * 300) };
export const FONDO = '#fffdf9';

// La tarjeta se dibuja en décimas de milímetro (550 × 850); el margen, como en la del avatar.
const MARGEN = 12;
const r2 = (n) => Math.round(n * 100) / 100;

export function svgSelloPhotocard(selloSvg) {
  const etiqueta = /^\s*<svg\b[^>]*>/.exec(String(selloSvg ?? ''))?.[0];
  const caja = etiqueta && /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(etiqueta);
  if (!caja) throw new Error('No hay ningún sello que imprimir.');
  const [lienzoAncho, lienzoAlto] = [Number(caja[1]), Number(caja[2])];
  const w = FORMATO.ancho * 10;
  const h = FORMATO.alto * 10;
  const escala = Math.min((w - 2 * MARGEN) / lienzoAncho, (h - 2 * MARGEN) / lienzoAlto);
  const ancho = r2(lienzoAncho * escala);
  const alto = r2(lienzoAlto * escala);
  const x = r2((w - ancho) / 2);
  const y = r2((h - alto) / 2);
  // La etiqueta del sello pierde lo que solo sirve en la pantalla (clase, ancho, alto) y recibe su
  // sitio en la tarjeta; el viewBox se conserva: el sello va entero.
  const nueva = etiqueta.trim()
    .replace(/\s(?:width|height|x|y|class|style|preserveAspectRatio)="[^"]*"/g, '')
    .replace('<svg', `<svg x="${x}" y="${y}" width="${ancho}" height="${alto}" preserveAspectRatio="xMidYMid meet"`);
  const dibujo = String(selloSvg).trim().replace(etiqueta.trim(), nueva);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${FORMATO.ancho}mm" height="${FORMATO.alto}mm" viewBox="0 0 ${w} ${h}" data-formato="${FORMATO.id}"><rect width="${w}" height="${h}" fill="${FONDO}"/>${dibujo}</svg>`;
}

// --- Copia de kme-impresion.js (editor de avatar). No la cambies sin cambiar el original. ---
const formatosPhotocard = [{ id: '55x85', ancho: 55, alto: 85 }, { id: '54x86', ancho: 54, alto: 86 }];
function formatoPhotocard(id) {
  const f = formatosPhotocard.find((x) => x.id === id);
  if (!f) throw new Error('Tamaño de photocard no disponible');
  return f;
}

// PDF local y sin bibliotecas: una imagen a 300 ppp, con su tamaño físico en puntos. En hoja A4,
// la tarjeta va centrada, con guías de corte y el aviso de imprimir al 100 %.
export function crearPdfPhotocard(jpeg, { formato = '55x85', hojaA4 = false, anchoPx, altoPx } = {}) {
  const f = formatoPhotocard(formato);
  if (!(jpeg instanceof Uint8Array) || jpeg.length < 4 || jpeg[0] !== 255 || jpeg[1] !== 216 || !Number.isInteger(anchoPx) || !Number.isInteger(altoPx) || anchoPx < 1 || altoPx < 1) throw new Error('Imagen de impresión no válida');
  const pt = (mm) => (mm * 72) / 25.4;
  const n = (v) => Number(v.toFixed(5));
  const pw = pt(hojaA4 ? 210 : f.ancho);
  const ph = pt(hojaA4 ? 297 : f.alto);
  const w = pt(f.ancho);
  const h = pt(f.alto);
  const x = (pw - w) / 2;
  const y = (ph - h) / 2;
  let contenido = `q ${n(w)} 0 0 ${n(h)} ${n(x)} ${n(y)} cm /Im0 Do Q\n`;
  if (hojaA4) {
    contenido += '% guias-corte\n0.4 w 0 0 0 RG\n';
    const margen = pt(1);
    const largo = pt(3);
    for (const cx of [x, x + w]) {
      for (const cy of [y, y + h]) {
        const dx = cx === x ? -1 : 1;
        const dy = cy === y ? -1 : 1;
        contenido += `${n(cx + dx * margen)} ${n(cy)} m ${n(cx + dx * (margen + largo))} ${n(cy)} l S\n`;
        contenido += `${n(cx)} ${n(cy + dy * margen)} m ${n(cx)} ${n(cy + dy * (margen + largo))} l S\n`;
      }
    }
    contenido += `BT /F1 10 Tf 36 36 Td (${f.ancho} x ${f.alto} mm | Imprimir al 100% - sin ajustar a pagina.) Tj ET\n`;
  }
  const encoder = new TextEncoder();
  const partes = [];
  const offsets = [0];
  let longitud = 0;
  const agregar = (valor) => {
    const bytes = typeof valor === 'string' ? encoder.encode(valor) : valor;
    partes.push(bytes);
    longitud += bytes.length;
  };
  const objeto = (id, contenidoObjeto) => {
    offsets[id] = longitud;
    agregar(`${id} 0 obj\n${contenidoObjeto}\nendobj\n`);
  };
  agregar('%PDF-1.4\n%KME\n');
  objeto(1, '<< /Type /Catalog /Pages 2 0 R >>');
  objeto(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  objeto(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(pw)} ${n(ph)}] /Resources << /XObject << /Im0 4 0 R >> /Font << /F1 6 0 R >> >> /Contents 5 0 R >>`);
  offsets[4] = longitud;
  agregar(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${anchoPx} /Height ${altoPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  agregar(jpeg);
  agregar('\nendstream\nendobj\n');
  objeto(5, `<< /Length ${encoder.encode(contenido).length} >>\nstream\n${contenido}endstream`);
  objeto(6, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const inicioXref = longitud;
  agregar('xref\n0 7\n0000000000 65535 f \n');
  for (let i = 1; i <= 6; i++) agregar(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
  agregar(`trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`);
  const resultado = new Uint8Array(longitud);
  let pos = 0;
  for (const p of partes) {
    resultado.set(p, pos);
    pos += p.length;
  }
  return resultado;
}
// --- Fin de la copia ---

// «Mi sello ✦ Amor» → «kme-sello-mi-sello-amor-55x85.pdf». Solo letras sin acento, números y guiones.
export function nombreArchivo(nombre, extension) {
  const base = String(nombre ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 40).replace(/-+$/, '');
  return `kme-sello${base ? `-${base}` : ''}-${FORMATO.id}.${extension}`;
}

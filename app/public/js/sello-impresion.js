// IMPRIMIR Y DESCARGAR EL SELLO (D045, T035), en el editor del sello.
// Usa lo que se ve en la vista previa ([data-sello-dibujo]), aunque todavía no esté guardado.
// - «Imprimir»: la photocard de 55 × 85 mm, sola en la página, con el diálogo del navegador.
// - «Photocard 55 × 85 mm (PDF)»: hoja A4 con la tarjeta centrada y guías de corte.
// - «Descargar PNG»: la tarjeta a 300 ppp (650 × 1004 píxeles).
// Sin JavaScript, el bloque sigue oculto y la página dice que hace falta (<noscript>).
// Lo que no depende del navegador está en kme-photocard.js, con sus tests.

import { PIXELES, FONDO, svgSelloPhotocard, crearPdfPhotocard, nombreArchivo } from './kme-photocard.js';

const bloque = document.querySelector('[data-sello-impresion]');

// La photocard en un <canvas> del tamaño de impresión.
function dibujarEnLienzo(svg) {
  return new Promise((ok, mal) => {
    const imagen = new Image();
    imagen.onload = () => {
      const lienzo = document.createElement('canvas');
      lienzo.width = PIXELES.ancho;
      lienzo.height = PIXELES.alto;
      const ctx = lienzo.getContext('2d');
      if (!ctx) return mal(new Error('No hay lienzo disponible'));
      ctx.fillStyle = FONDO;
      ctx.fillRect(0, 0, lienzo.width, lienzo.height);
      ctx.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
      ok(lienzo);
    };
    imagen.onerror = () => mal(new Error('No se pudo preparar la imagen del sello'));
    imagen.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

const comoBlob = (lienzo, tipo, calidad) => new Promise((ok, mal) => {
  lienzo.toBlob((blob) => (blob ? ok(blob) : mal(new Error('No se pudo preparar el archivo'))), tipo, calidad);
});

// Imprime la tarjeta sola: la página se oculta al imprimir (estilos @media print) y solo queda la
// imagen, a 55 × 85 mm.
function imprimir(lienzo) {
  return new Promise((ok) => {
    let hoja = document.querySelector('.sello-hoja');
    if (!hoja) {
      hoja = document.createElement('div');
      hoja.className = 'sello-hoja';
      hoja.setAttribute('aria-hidden', 'true');
      document.body.append(hoja);
    }
    const imagen = new Image();
    imagen.alt = '';
    imagen.onload = () => {
      hoja.replaceChildren(imagen);
      document.documentElement.classList.add('imprimiendo-sello');
      window.addEventListener('afterprint', () => document.documentElement.classList.remove('imprimiendo-sello'), { once: true });
      window.print();
      ok();
    };
    imagen.src = lienzo.toDataURL('image/png');
  });
}

if (bloque) {
  const estado = bloque.querySelector('[data-sello-impresion-estado]');
  const botones = [...bloque.querySelectorAll('button[data-imprimir]')];
  const decir = (texto) => { estado.textContent = texto; };
  let ocupado = false;

  async function preparar(accion) {
    if (ocupado) return;
    const sello = document.querySelector('[data-sello-dibujo] svg.sello');
    if (!sello) {
      decir('Corrige el sello para poder imprimirlo.');
      return;
    }
    ocupado = true;
    botones.forEach((b) => { b.disabled = true; });
    decir('Preparando tu photocard…');
    try {
      // XMLSerializer (y no outerHTML): la imagen se lee como XML, y el HTML podría escribir
      // entidades como &nbsp; que el XML no conoce.
      const lienzo = await dibujarEnLienzo(svgSelloPhotocard(new XMLSerializer().serializeToString(sello)));
      const nombre = document.querySelector('#nombre')?.value;
      if (accion === 'imprimir') {
        await imprimir(lienzo);
        decir('Elige la impresora e imprime al 100 %, sin ajustar a la página.');
      } else if (accion === 'pdf') {
        const jpeg = new Uint8Array(await (await comoBlob(lienzo, 'image/jpeg', 0.98)).arrayBuffer());
        const pdf = crearPdfPhotocard(jpeg, { formato: '55x85', hojaA4: true, anchoPx: lienzo.width, altoPx: lienzo.height });
        descargar(new Blob([pdf], { type: 'application/pdf' }), nombreArchivo(nombre, 'pdf'));
        decir('PDF A4 preparado · 55 × 85 mm. Imprímelo al 100 %, sin ajustar a la página.');
      } else {
        descargar(await comoBlob(lienzo, 'image/png'), nombreArchivo(nombre, 'png'));
        decir('PNG preparado · 55 × 85 mm a 300 ppp.');
      }
    } catch (error) {
      console.error(error);
      decir('No se pudo preparar la photocard. Inténtalo de nuevo.');
    } finally {
      ocupado = false;
      botones.forEach((b) => { b.disabled = false; });
    }
  }

  for (const boton of botones) boton.addEventListener('click', () => preparar(boton.dataset.imprimir));
  bloque.hidden = false;
}

// Dibuja un avatar completo como SVG o PNG.
// Sirve para el editor y para mostrar el avatar en cualquier otra página (perfil, comentarios...).
import { cargarCatalogo } from './catalogo.js';
import { cssDeColores } from './colores.js';
import { svgAImagen } from './utilidades.js';
import { normalizarAvatar } from './estado.js';
import { aplicarIrisAcuarela } from './kme-iris-acuarela.js';
import { adaptarMaquillaje } from './kme-maquillaje.js';
import { ajustarGrosorCejas } from './kme-grosores.js';
import { aplicarCabelloAcuarela } from './kme-cabello-acuarela.js';
import { aplicarPinceladasCabello, aplicarMechonesCabello, coloresMechonesKme } from './kme-cabello-pinceladas.js';

let contador = 0;

/**
 * Devuelve el avatar como texto SVG.
 * opciones:
 *   recorte   viewBox a mostrar, por ejemplo '60 40 280 280' para solo la cabeza
 *   conFondo  incluir la capa de fondo (true por defecto)
 *   rellenar  true = recorta para llenar el hueco; false = encaja entero
 *   ancho, alto  tamaño en píxeles (necesario para convertir a PNG)
 *   soloCapas lista de ids de capa a incluir
 *   estilos   incluir el <style> con los colores (true por defecto)
 *   id        id del <svg>; las reglas de color se limitan a ese id
 */
export function svgDelAvatar(catalogo, avatar, opciones = {}) {
  const {
    recorte = `0 0 ${catalogo.datos.lienzo.ancho} ${catalogo.datos.lienzo.alto}`,
    conFondo = true, rellenar = false, ancho, alto, soloCapas = null, estilos = true, id,
  } = opciones;
  const contenido = catalogo.contenido(avatar);
  // La piel del top termina donde empieza la cintura elegida. Así no tapa
  // un pantalón alto, ni deja un hueco transparente con uno de talle bajo.
  const superior = catalogo.pieza('ropa.arriba', avatar.ropa.arriba);
  if (superior?.coleccion === 'lamina-kpop' || superior?.perfilIntegrado) {
    const cintura = catalogo.pieza('ropa.abajo', avatar.ropa.abajo)?.cinturaY || 350;
    const clip = `abdomen-${++contador}`;
    if(superior.perfilIntegrado){
      contenido.torso=contenido.anatomia||contenido.torso;
      contenido.anatomia='';
      contenido.ropa_arriba=contenido.ropa_arriba.replace(/<path data-parte="(?:cuello|brazo-izquierdo|brazo-derecho)"[^>]*\/>/g,'');
      contenido.ropa_arriba=contenido.ropa_arriba.replaceAll('__KME_PRENDA__',`prenda-${++contador}`);
    }else{
      contenido.torso = `<defs><clipPath id="${clip}"><rect x="0" y="0" width="400" height="${cintura}"/></clipPath></defs><g clip-path="url(#${clip})">${contenido.torso || ''}</g>`;
    }
    // El abdomen pertenece al torso continuo; otra silueta superpuesta aquí
    // dibujaba una segunda cintura y líneas verticales ajenas al cuerpo.
    contenido.ropa_arriba = contenido.ropa_arriba.replace(/<path data-parte="abdomen"[^>]*\/>/,'');
    if (superior.topCorto) {
      contenido.torso=`<g data-parte="abdomen">${contenido.torso}</g>`;
      contenido.ropa_arriba += `<circle data-parte="ombligo" cx="200" cy="${cintura >= 370 ? 360 : 346}" r="1.45" class="f-pecas" opacity=".8" stroke="none"/>`;
    }
  }
  for (const capa of ['pelo_atras','pelo_frente']) {
    const prefijo=`pelo-${++contador}`;
    contenido[capa] = aplicarCabelloAcuarela(contenido[capa],avatar.pelo.acabado,prefijo);
    contenido[capa] = aplicarPinceladasCabello(contenido[capa],avatar.pelo.acabado,avatar.pelo.color,capa,prefijo+'-b');
    contenido[capa] = aplicarMechonesCabello(contenido[capa],avatar.pelo,capa,prefijo,coloresMechonesKme(catalogo));
  }
  contenido.cejas = ajustarGrosorCejas(contenido.cejas || '', avatar.grosorCejas);
  contenido.ojos = aplicarIrisAcuarela(contenido.ojos || '');
  for (const capa of ['maquillaje', 'maquillaje_detalles']) {
    contenido[capa] = adaptarMaquillaje(contenido[capa] || '', avatar, contenido.ojos);
  }
  // En el menú se muestra la prenda sola. El avatar conserva toda su anatomía.
  if(opciones.soloPrendaSuperior){
    contenido.ropa_arriba=contenido.ropa_arriba
      .replace(/<path\b[^>]*class="f-piel"[^>]*\/>/g,'')
      .replace(/<circle\b[^>]*data-parte="ombligo"[^>]*\/>/g,'');
  }
  const capas = catalogo.capas.filter(c =>
    (conFondo || c.id !== 'fondo') && (!soloCapas || soloCapas.includes(c.id)));
  const idSvg = id || (estilos ? `avatar-svg-${++contador}` : null);
  const estilo = estilos ? `<style>${cssDeColores(avatar, '#' + idSvg)}</style>` : '';
  const tam = ancho ? ` width="${ancho}" height="${alto}"` : '';
  const dibujo = idsUnicosCollage(capas.map(c => contenido[c.id]).join('\n'), idSvg || `avatar-${++contador}`);
  return `<svg xmlns="http://www.w3.org/2000/svg"${idSvg ? ` id="${idSvg}"` : ''} viewBox="${recorte}" preserveAspectRatio="xMidYMid ${rellenar ? 'slice' : 'meet'}"${tam}>${estilo}${dibujo}</svg>`;
}

// Las piezas del lote collage (D067) traen ids fijos en sus patrones y recortes («collage-…»). Cada
// dibujo les antepone su propio id, y también a sus referencias (url(#…), href="#…"), para que
// varios avatares en una misma página no compartan definiciones. Las piezas anteriores no cambian.
function idsUnicosCollage(svg, prefijo) {
  return svg.replace(/(\sid="|url\(#|href="#)(collage-[\w-]+)/g, (_, antes, nombre) => `${antes}${prefijo}-${nombre}`);
}

/** Devuelve el avatar como PNG (data URL). */
export async function pngDelAvatar(catalogo, avatar, { ancho = 800, alto = 960, recorte } = {}) {
  const img = await svgAImagen(svgDelAvatar(catalogo, avatar, { ancho, alto, recorte }));
  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  canvas.getContext('2d').drawImage(img, 0, 0, ancho, alto);
  return canvas.toDataURL('image/png');
}

/**
 * Atajo para usar en otras páginas:
 *   const r = await crearRenderizador('datos/catalogo.json');
 *   div.innerHTML = r.svg(avatarGuardado, { recorte: '60 40 280 280' });
 *   img.src = await r.png(avatarGuardado);
 */
export async function crearRenderizador(urlCatalogo = 'datos/catalogo.json') {
  const catalogo = await cargarCatalogo(urlCatalogo);
  const norm = a => normalizarAvatar(a, catalogo.porDefecto);
  return {
    catalogo,
    svg: (avatar, opciones) => svgDelAvatar(catalogo, norm(avatar), opciones),
    png: (avatar, opciones) => pngDelAvatar(catalogo, norm(avatar), opciones),
  };
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { EditorVisual } from '../js/kme-editor-visual.js';
import { montarEditorVisual } from '../js/kme-vista-visual.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { normalizarAvatar } from '../js/estado.js';
import { leer } from '../js/utilidades.js';
import { documentoVisual } from './helpers/dom-visual.js';

const url = new URL('../datos/kme.json', import.meta.url);
const datos = JSON.parse(await readFile(url, 'utf8')), archivos = new Map();
for (const lista of Object.values(datos.piezas)) for (const pieza of lista) {
  for (const capa in pieza.capas) {
    pieza.capas[capa] = [pieza.capas[capa]].flat();
    for (const ruta of pieza.capas[capa]) {
      const svg = await readFile(new URL(ruta, url), 'utf8');
      archivos.set(ruta, svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>')));
    }
  }
}
const catalogo = new Catalogo(datos, archivos);
const efectos = [
  ['sombraEstilo', 'acuarela', 'sombra', 'colorSombra', 'Sombra', 'Sombra acuarela'],
  ['delineado', 'pop', 'delineado', 'colorDelineado', 'Delineado', 'Delineado pop'],
  ['brillo', 'escenario', 'brillo', 'colorBrillo', 'Brillo', 'Luz de escenario'],
  ['gemas', 'cristal', 'gemas', 'colorGemas', 'Gemas', 'Gemas'],
  ['mejillas', 'difuminado', 'rubor', 'colorRubor', 'Mejillas', 'Rubor difuminado'],
  ['labios', 'pigmento', 'labios', 'colorLabios', 'Labios', 'Pigmento suave'],
];
const svg = avatar => svgDelAvatar(catalogo, avatar, {id: 'prueba-maquillaje'});
function completo() {
  const e = new EditorVisual(catalogo);
  for (const [campo, id] of efectos) e.elegirPieza('maquillaje.' + campo, id);
  return e;
}

test('Los seis efectos aprobados son piezas SVG independientes del rostro, sin imágenes ni recursos externos', async () => {
  for (const [campo, id, marca] of efectos) {
    const pieza = catalogo.pieza('maquillaje.' + campo, id);
    assert.ok(pieza, 'Falta la opción de maquillaje: ' + marca);
    for (const ruta of Object.values(pieza.capas).flat()) {
      const dibujo = await readFile(new URL(ruta, url), 'utf8');
      assert.match(dibujo, /viewBox="0 0 400 480"/);
      assert.ok(dibujo.includes('data-maquillaje="' + marca + '"'));
      assert.doesNotMatch(dibujo, /<(?:image|script|foreignObject|filter)\b|(?:href|src)=|\bon\w+=|url\(/i);
    }
  }
});

test('Se pueden combinar los seis efectos y quitar uno sin quitar los demás ni los accesorios', () => {
  const e = completo(), accesorio = e.avatar.accesorio;
  for (const [, , marca] of efectos) assert.ok(svg(e.avatar).includes('data-maquillaje="' + marca + '"'));
  e.elegirPieza('maquillaje.sombraEstilo', 'nada');
  assert.doesNotMatch(svg(e.avatar), /data-maquillaje="sombra"/);
  for (const [, , marca] of efectos.slice(1)) assert.ok(svg(e.avatar).includes('data-maquillaje="' + marca + '"'));
  assert.equal(e.avatar.accesorio, accesorio);
  e.deshacer(); assert.match(svg(e.avatar), /data-maquillaje="sombra"/);
});

test('Cada efecto admite la paleta existente con color independiente del iris y rechaza colores ajenos sin editar', () => {
  const e = completo(), iris = e.avatar.ojos.color;
  for (const [, , marca, campo] of efectos) {
    const previos = structuredClone(e.avatar.maquillaje);
    for (const color of catalogo.paleta('arriba')) {
      e.elegirColor('maquillaje.' + campo, color);
      assert.ok(svg(e.avatar).includes('.f-m-' + marca + '{fill:' + color + '}'));
      assert.equal(e.avatar.ojos.color, iris);
    }
    for (const clave in previos) if (clave !== campo) assert.equal(e.avatar.maquillaje[clave], previos[clave]);
    const antes = JSON.stringify(e.avatar);
    assert.throws(() => e.elegirColor('maquillaje.' + campo, '#123456'));
    assert.equal(JSON.stringify(e.avatar), antes);
  }
});

test('Sombras y delineado siguen cada ojo abierto o cerrado en las tres formas y los dos guiños', () => {
  const e = completo();
  for (const rostro of catalogo.piezas('rostro')) for (const pieza of catalogo.piezas('ojos.estilo')) {
    e.avatar.rostro = rostro.id; e.avatar.ojos.estilo = pieza.id;
    const dibujo = svg(e.avatar);
    for (const lado of ['izquierdo', 'derecho']) {
      const cerrado = pieza.id.includes('cerrados') || pieza.id.includes('guino-' + lado);
      assert.ok(dibujo.includes('data-estado-ojo="' + (cerrado ? 'cerrado' : 'abierto') + '"'), pieza.id);
    }
    assert.doesNotMatch(dibujo, /undefined|NaN/);
    const tituloOjos = archivos.get(pieza.capas.ojos[0]).match(/<title>[\s\S]*?<\/title>/)[0];
    assert.ok(dibujo.indexOf('data-maquillaje="sombra"') < dibujo.indexOf(tituloOjos));
  }
});

test('Las tres bocas conservan sus trazos y las gemas quedan delante de los ojos y detrás del pelo', () => {
  const e = completo();
  for (const boca of catalogo.piezas('boca')) {
    e.avatar.boca = boca.id;
    const dibujo = svg(e.avatar), original = archivos.get(boca.capas.boca[0]);
    assert.ok(dibujo.includes(original));
    assert.ok(dibujo.includes('data-boca="' + boca.id + '"'));
    assert.equal((dibujo.match(/data-boca=/g) || []).length, 1);
    assert.ok(dibujo.indexOf('data-maquillaje="labios"') < dibujo.indexOf(original));
    assert.ok(dibujo.indexOf('data-maquillaje="gemas"') > dibujo.indexOf('data-parte="linea-ojo"'));
    const cabello = catalogo.contenido(e.avatar).pelo_frente;
    assert.ok(dibujo.indexOf('data-maquillaje="gemas"') < dibujo.indexOf(cabello));
  }
});

test('El pigmento C sigue exactamente el contorno de cada boca y ofrece fino, medio y grueso con deshacer', () => {
  const e = completo();
  for (const boca of catalogo.piezas('boca')) {
    e.avatar.boca = boca.id;
    const original = archivos.get(boca.capas.boca[0]);
    let anchura = 0;
    for (const grosor of ['fino', 'medio', 'grueso']) {
      e.elegirGrosorLabios(grosor);
      const dibujo = svg(e.avatar);
      const pigmento = dibujo.match(/<g data-maquillaje="labios"[\s\S]*?<\/g>/)[0];
      assert.ok(pigmento.includes('data-grosor="' + grosor + '"'));
      const anchuraActual = Number(pigmento.match(/data-trazo="velo"[^>]*stroke-width="([\d.]+)"/)[1]);
      assert.ok(anchuraActual > anchura); anchura = anchuraActual;
      if (boca.id === 'asombro') assert.match(pigmento, /cx="200" cy="248" rx="4" ry="6"/);
      else {
        const contorno = original.match(/<path d="([^"]+)"/)[1];
        assert.ok(pigmento.includes('d="' + contorno + '"'));
      }
    }
    e.deshacer(); assert.equal(e.avatar.maquillaje.grosorLabios, 'medio');
  }
  const antes = JSON.stringify(e.avatar);
  assert.throws(() => e.elegirGrosorLabios('inventado'));
  assert.equal(JSON.stringify(e.avatar), antes);
});

test('La categoría Maquillaje permite seleccionar, recolorear, quitar y deshacer desde los controles reales', () => {
  const doc = documentoVisual(), vista = montarEditorVisual(doc, catalogo);
  assert.ok(doc.buscar('Categoría: Maquillaje'), 'Falta la categoría visible');
  doc.buscar('Categoría: Maquillaje').click();
  for (const [, , marca, campo, titulo, nombre] of efectos) {
    doc.buscar('Maquillaje: ' + titulo).click();
    assert.ok(doc.buscar(titulo + ': ' + nombre));
    doc.buscar(titulo + ': ' + nombre).click();
    assert.ok(doc.getElementById('avatar-grande').innerHTML.includes('data-maquillaje="' + marca + '"'));
    doc.buscar('Color de ' + titulo.toLowerCase() + ': Violeta').click();
    assert.equal(leer(vista.estado.avatar, 'maquillaje.' + campo), '#6a4ba1');
  }
  doc.buscar('Maquillaje: Gemas').click();
  doc.buscar('Gemas: Sin gemas').click();
  assert.doesNotMatch(doc.getElementById('avatar-grande').innerHTML, /data-maquillaje="gemas"/);
  doc.getElementById('deshacer').click();
  assert.match(doc.getElementById('avatar-grande').innerHTML, /data-maquillaje="gemas"/);
});

test('Los avatares anteriores se normalizan sin maquillaje nuevo activado y cada base conserva su elección', () => {
  const antiguo = structuredClone(catalogo.porDefecto);
  antiguo.maquillaje = {sombra: null, labial: null, mejillas: 'comillas'};
  const a = normalizarAvatar(antiguo, catalogo.porDefecto);
  assert.equal(a.maquillaje.mejillas, 'comillas');
  for (const [campo] of efectos.filter(e => e[0] !== 'mejillas')) assert.equal(leer(a, 'maquillaje.' + campo), 'nada');
  assert.doesNotMatch(svg(a), /data-maquillaje=/);
  const e = completo(); e.cambiarBase(1);
  assert.equal(e.avatar.maquillaje.gemas, 'nada');
  e.cambiarBase(0); assert.equal(e.avatar.maquillaje.gemas, 'cristal');
  e.restaurar(); assert.equal(e.avatar.maquillaje.gemas, 'nada');
});

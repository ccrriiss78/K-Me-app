import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { seleccionarPiezaKme } from '../js/kme-ropa.js';
const url = new URL('../datos/kme.json', import.meta.url);
const tallas = { relajado:'delgado', recto:'medio', amplio:'grueso' };
const familias = ['cargo','falda','bermudas'];
async function cargar() {
  const datos = JSON.parse(await readFile(url, 'utf8')), archivos = new Map();
  for (const lista of Object.values(datos.piezas)) for (const pieza of lista) for (const capa in pieza.capas) {
    pieza.capas[capa] = [pieza.capas[capa]].flat();
    for (const ruta of pieza.capas[capa]) {
      const svg = await readFile(new URL(ruta,url),'utf8');
      archivos.set(ruta,svg.slice(svg.indexOf('>')+1,svg.lastIndexOf('</svg>')));
    }
  }
  return new Catalogo(datos,archivos);
}
test('Pantalón, falda y bermudas tienen tres variantes que reúnen ropa y piernas en un mismo SVG', async () => {
  const c = await cargar();
  for (const familia of familias) {
    const siluetas=[];
    for (const [cuerpo,talla] of Object.entries(tallas)) {
      const p=c.pieza('ropa.abajo',`${familia}-integrada-${talla}`);
      assert.ok(p,`Falta ${familia} ${talla}`);
      assert.equal(p.cuerpoCompatible,cuerpo);
      assert.equal(p.capas.piernas[0],p.capas.ropa_abajo[0],'Una pieza incluye ropa y piernas');
      const svg=c.archivos.get(p.capas.piernas[0]);
      assert.match(svg,/data-parte="piernas"/);assert.match(svg,/data-parte="calzado"/);
      assert.match(svg,/class="f-piel"/);assert.match(svg,/class="f-abajo"/);
      siluetas.push(svg.match(/data-parte="prenda"[^>]*d="([^"]+)"/)[1]);
    }
    assert.equal(new Set(siluetas).size,3,`Las siluetas de ${familia} deben diferir`);
  }
});
test('Cada conjunto conserva un solo par de piernas y calzado y dibuja la prenda debajo de la camiseta', async () => {
  const c=await cargar();
  for(const cuerpo of Object.keys(tallas)) for(const familia of familias) {
    const a=structuredClone(c.porDefecto);
    seleccionarPiezaKme(c,a,'ropa.abajo',`${familia}-integrada-${tallas[cuerpo]}`);
    const capas=c.contenido(a), todo=Object.values(capas).join('');
    assert.equal(capas.cuerpo,'');
    assert.equal((todo.match(/data-parte="piernas"/g)||[]).length,1,'Piernas duplicadas');
    assert.equal((todo.match(/data-parte="calzado"/g)||[]).length,1,'Calzado duplicado');
    assert.match(capas.piernas,/data-parte="piernas"/);
    assert.doesNotMatch(capas.piernas,/data-parte="prenda"/);
    assert.match(capas.ropa_abajo,/data-parte="prenda"/);
    assert.doesNotMatch(capas.ropa_abajo,/data-parte="piernas"/);
    assert.ok(c.capas.findIndex(x=>x.id==='ropa_abajo')<c.capas.findIndex(x=>x.id==='ropa_arriba'));
  }
});
test('Cuerpo, camiseta y prenda inferior mantienen el mismo tamaño sin perder la familia de ropa elegida', async () => {
  const c=await cargar();
  for(const familia of familias) {
    const a=structuredClone(c.porDefecto);
    seleccionarPiezaKme(c,a,'ropa.abajo',`${familia}-integrada-delgado`);
    for(const [cuerpo,talla] of Object.entries(tallas)) {
      seleccionarPiezaKme(c,a,'cuerpo',cuerpo);
      assert.equal(a.ropa.arriba,`camiseta-integrada-${talla}`);
      assert.equal(a.ropa.abajo,`${familia}-integrada-${talla}`);
    }
    seleccionarPiezaKme(c,a,'ropa.arriba','camiseta-integrada-medio');
    assert.equal(a.cuerpo,'recto');assert.equal(a.ropa.abajo,`${familia}-integrada-medio`);
    seleccionarPiezaKme(c,a,'ropa.abajo',`${familia}-integrada-delgado`);
    assert.equal(a.cuerpo,'relajado');assert.equal(a.ropa.arriba,'camiseta-integrada-delgado');
  }
});
test('Las prendas antiguas siguen disponibles y al volver a ellas no se duplican las piernas', async () => {
  const c=await cargar(),a=structuredClone(c.porDefecto);
  seleccionarPiezaKme(c,a,'ropa.abajo','falda-integrada-medio');
  seleccionarPiezaKme(c,a,'ropa.arriba','chaqueta');
  assert.equal(a.ropa.abajo,'falda');assert.ok(c.contenido(a).cuerpo);assert.equal(c.contenido(a).piernas,'');
  seleccionarPiezaKme(c,a,'ropa.abajo','cargo-integrada-grueso');
  assert.equal(a.ropa.arriba,'camiseta-integrada-grueso');
  assert.equal(c.contenido(a).cuerpo,'');
  for(const familia of familias) assert.ok(c.pieza('ropa.abajo',familia));
});
test('Las tres bases comienzan con ropa inferior integrada acorde con su cuerpo', async () => {
  const c=await cargar();
  for(const b of c.datos.bases) {
    const p=c.pieza('ropa.abajo',b.avatar.ropa.abajo);
    assert.ok(p?.gruposPorCapa,'La base debe vestir una pieza integrada');
    assert.equal(p.cuerpoCompatible,b.avatar.cuerpo);
  }
});

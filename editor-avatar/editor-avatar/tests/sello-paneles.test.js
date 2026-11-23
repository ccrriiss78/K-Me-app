import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const raiz = new URL('../../../app/', import.meta.url);
function entorno(incompleto = false) {
  const nodo = id => ({ id, hidden: false, atributos: {}, eventos: {},
    setAttribute(k,v) { this.atributos[k] = String(v); },
    getAttribute(k) { return this.atributos[k] ?? null; },
    addEventListener(k,fn) { this.eventos[k] = fn; },
    focus() { this.enfocado = true; }
  });
  const paneles = ['contenido','colores','detalles'].map(k => nodo('sello-' + k));
  const enlaces = paneles.map(p => { const n = nodo('enlace-' + p.id); n.atributos.href = '#' + p.id; return n; });
  const menu = nodo('menu');
  menu.querySelectorAll = () => enlaces;
  const form = { querySelector: () => menu };
  const document = {
    querySelector: () => form,
    getElementById: id => incompleto && id === paneles[2].id ? null : paneles.find(p => p.id === id)
  };
  return { paneles, enlaces, menu,
    async iniciar() { vm.runInNewContext(await readFile(new URL('public/js/sello-paneles.js', raiz),'utf8'), {document}); },
    activar(i,tipo='click',key) { const e = {key, preventDefault(){this.impedido=true;}}; enlaces[i].eventos[tipo]?.(e); return e; }
  };
}

test('Sin JavaScript, las tres secciones son enlaces a contenido visible y el guardado sigue en el formulario', async () => {
  const html = await readFile(new URL('src/views/sello-editor.ejs',raiz),'utf8');
  for (const id of ['contenido','colores','detalles']) {
    assert.match(html,new RegExp(`href="#sello-${id}"`));
    assert.match(html,new RegExp(`id="sello-${id}"`));
    assert.doesNotMatch(html,new RegExp(`id="sello-${id}"[^>]*hidden`));
  }
  assert.match(html,/name="accion" value="vista"/);
  assert.match(html,/name="accion" value="guardar"/);
  assert.doesNotMatch(html,/role="tab"|onclick=/);
});

test('Al activar una categoría se muestra su panel, se actualiza la selección y no se envía el formulario', async () => {
  const e=entorno(); await e.iniciar();
  assert.equal(e.menu.atributos.role,'tablist');
  assert.deepEqual(e.paneles.map(p=>p.hidden),[false,true,true]);
  assert.equal(e.activar(1).impedido,true);
  assert.deepEqual(e.paneles.map(p=>p.hidden),[true,false,true]);
  assert.deepEqual(e.enlaces.map(n=>n.atributos['aria-selected']),['false','true','false']);
  assert.equal(e.paneles[1].atributos['aria-labelledby'],e.enlaces[1].id);
});

test('Flechas, Inicio, Fin y Espacio permiten elegir categorías con un único tabulador de entrada', async () => {
  const e=entorno(); await e.iniciar();
  e.activar(0,'keydown','ArrowLeft');
  assert.equal(e.paneles[2].hidden,false); assert.equal(e.enlaces[2].enfocado,true);
  e.activar(2,'keydown','Home'); assert.equal(e.paneles[0].hidden,false);
  e.activar(0,'keydown','End'); assert.equal(e.paneles[2].hidden,false);
  e.activar(2,'keydown','ArrowRight'); assert.equal(e.paneles[0].hidden,false);
  e.activar(1,'keydown',' '); assert.equal(e.paneles[1].hidden,false);
  assert.deepEqual(e.enlaces.map(n=>n.atributos.tabindex),['-1','0','-1']);
  assert.equal(e.activar(1,'keydown','Tab').impedido,undefined);
});

test('Si falta una sección, se conservan los enlaces y ningún contenido queda oculto', async () => {
  const e=entorno(true); await e.iniciar();
  assert.deepEqual(e.paneles.map(p=>p.hidden),[false,false,false]);
  assert.equal(e.menu.atributos.role,undefined);
});

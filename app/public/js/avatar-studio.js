// AVATAR STUDIO EN LA APP (T037; contrato v1, D052; dirección visual D057).
// Monta el editor APROBADO (sus módulos, servidos desde /editor/js/) en la página, sin cambiar sus
// opciones ni su diseño, y le añade lo propio de la app: abrir un avatar guardado, el nombre y
// «Guardar» en la cuenta. El guardado con el servidor está en avatar-studio-guardado.js.
// - Conflicto (otro dispositivo lo guardó antes): no se sobrescribe; «Guardar como copia».
// - Límite de 20: se eligen aquí mismo los avatares que se borran (D058), sin salir de la página
//   ni perder el diseño, y después se guarda.
// - Si se intenta salir con cambios sin guardar, el navegador pregunta.
// Sin borradores en localStorage (D052). Sin scripts en línea (CSP): este archivo es un módulo.

import { cargarCatalogo } from '/editor/js/catalogo.js';
import { montarEditorVisual } from '/editor/js/kme-vista-visual.js';
import { montarAmbienteVisual } from '/editor/js/kme-ambiente-visual.js';
import { montarImpresion } from '/editor/js/kme-impresion.js';
import { crearGuardado } from './avatar-studio-guardado.js';

const raiz = document.getElementById('avatar-studio');
const $ = (id) => document.getElementById(id);
const LARGO_NOMBRE = 40;

function nodo(etiqueta, texto, atributos = {}) {
  const n = document.createElement(etiqueta);
  if (texto) n.textContent = texto; // siempre como texto: los nombres no se interpretan como HTML
  for (const [k, v] of Object.entries(atributos)) n.setAttribute(k, v);
  return n;
}

async function iniciar() {
  const { id, version, csrf, catalogo: urlCatalogo } = raiz.dataset;
  const guardado = crearGuardado({ fetch: (url, opciones) => window.fetch(url, { credentials: 'same-origin', ...opciones }), csrf, id, version });
  const catalogo = await cargarCatalogo(urlCatalogo);
  montarAmbienteVisual(document);
  const vista = montarEditorVisual(document, catalogo);

  // Un avatar guardado se abre con su receta de la cuenta.
  if (id) {
    const res = await window.fetch(`/studio/avatares/${encodeURIComponent(id)}`, { credentials: 'same-origin', headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error('No se pudo abrir el avatar guardado.');
    const datos = await res.json();
    vista.estado.cargarAvatar(datos.receta);
    guardado.estado.version = datos.version;
    vista.actualizar();
  }
  montarImpresion(document, catalogo, vista);

  const formulario = $('guardar-avatar');
  const campoNombre = $('nombre-avatar');
  const botonGuardar = formulario.querySelector('button[type="submit"]');
  const estadoGuardado = $('estado-guardado');
  const conflicto = $('acciones-conflicto');
  const panelLimite = $('panel-limite');
  const decir = (texto) => { estadoGuardado.textContent = texto; };
  const instantanea = () => JSON.stringify(vista.estado.avatar);
  let guardadoComo = instantanea() + campoNombre.value;
  let ocupado = false;

  const nombreElegido = () => campoNombre.value.trim();

  function mostrar(r) {
    conflicto.hidden = r.tipo !== 'conflicto';
    if (r.tipo !== 'limite') cerrarLimite();
    decir(r.mensaje);
    if (r.tipo === 'creado') {
      history.replaceState(null, '', r.direccion);
      raiz.dataset.id = r.id;
      document.title = 'Editar avatar · K-ME';
    }
    if (r.tipo === 'creado' || r.tipo === 'guardado') {
      raiz.dataset.version = String(r.version);
      guardadoComo = instantanea() + campoNombre.value;
    }
    if (r.tipo === 'limite') abrirLimite();
  }

  async function ejecutar(accion) {
    if (ocupado) return;
    ocupado = true;
    botonGuardar.disabled = true;
    decir('Guardando…');
    try {
      mostrar(await accion());
    } finally {
      ocupado = false;
      botonGuardar.disabled = false;
    }
  }

  const guardar = () => ejecutar(() => guardado.guardar({ nombre: nombreElegido(), receta: vista.estado.avatar }));

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (!nombreElegido()) {
      decir('Ponle al avatar un nombre de 1 a 40 caracteres.');
      campoNombre.focus();
      return;
    }
    guardar();
  });

  $('guardar-copia').addEventListener('click', () => {
    campoNombre.value = [...`Copia de ${nombreElegido()}`].slice(0, LARGO_NOMBRE).join('');
    ejecutar(() => guardado.guardarComoCopia({ nombre: nombreElegido(), receta: vista.estado.avatar }));
  });
  // Recargar la versión guardada: la dirección actual (cambia al crear una copia).
  $('recargar-avatar').addEventListener('click', (evento) => {
    guardadoComo = null; // se sale a propósito: no hace falta preguntar
    evento.currentTarget.setAttribute('href', location.pathname);
  });

  // --- Límite de 20: elegir aquí cuáles borrar (D058) ---
  function cerrarLimite() {
    panelLimite.hidden = true;
    panelLimite.replaceChildren();
  }

  async function abrirLimite() {
    panelLimite.replaceChildren(nodo('p', 'Cargando tus avatares…'));
    panelLimite.hidden = false;
    let lista;
    try {
      lista = await guardado.listar();
    } catch (error) {
      panelLimite.replaceChildren(nodo('p', error.message));
      return;
    }
    const titulo = nodo('h2', 'Elige cuáles borrar para hacer sitio', { id: 'titulo-limite', tabindex: '-1' });
    const ul = nodo('ul');
    for (const a of lista) {
      const li = nodo('li');
      const etiqueta = nodo('label');
      etiqueta.append(nodo('input', '', { type: 'checkbox', value: a.id }), nodo('span', a.nombre));
      li.append(etiqueta);
      ul.append(li);
    }
    const acciones = nodo('div', '', { class: 'panel-limite__acciones' });
    const seleccionados = nodo('button', 'Borrar los seleccionados', { type: 'button', class: 'secundario' });
    const todos = nodo('button', 'Borrar todos', { type: 'button', class: 'peligro' });
    const cancelar = nodo('button', 'Cancelar', { type: 'button', class: 'secundario' });
    acciones.append(seleccionados, todos, cancelar);
    panelLimite.replaceChildren(titulo, ul, acciones);
    titulo.focus();

    const elegidos = (todosLosDeLaLista) => lista.filter((a) => todosLosDeLaLista || ul.querySelector(`input[value="${CSS.escape(a.id)}"]`).checked);
    seleccionados.addEventListener('click', () => confirmar(elegidos(false)));
    todos.addEventListener('click', () => confirmar(elegidos(true)));
    cancelar.addEventListener('click', () => { cerrarLimite(); decir('Tu avatar sigue aquí, sin guardar.'); });
  }

  // Confirmación con el número y los nombres; al aceptar, se borran y se guarda el avatar.
  function confirmar(lista) {
    if (!lista.length) {
      decir('Elige al menos un avatar para borrar.');
      return;
    }
    const cuantos = lista.length === 1 ? '1 avatar' : `${lista.length} avatares`;
    const texto = nodo('p');
    texto.append('Se borrarán para siempre ', nodo('strong', cuantos), ': ');
    texto.append(lista.map((a) => a.nombre).join(', '), '.');
    const si = nodo('button', `Sí, borrar ${cuantos} y guardar el mío`, { type: 'button', class: 'peligro' });
    const no = nodo('button', 'Volver a elegir', { type: 'button', class: 'secundario' });
    const acciones = nodo('div', '', { class: 'panel-limite__acciones' });
    acciones.append(si, no);
    panelLimite.replaceChildren(texto, acciones);
    si.focus();
    no.addEventListener('click', () => abrirLimite());
    si.addEventListener('click', async () => {
      si.disabled = true;
      const r = await guardado.borrar(lista.map((a) => a.id));
      if (r.tipo !== 'borrados') {
        decir(r.mensaje);
        si.disabled = false;
        return;
      }
      cerrarLimite();
      await guardar();
      decir(`${r.mensaje} ${estadoGuardado.textContent}`);
    });
  }

  // Salir con cambios sin guardar: el navegador pregunta (nada se guarda en este equipo).
  window.addEventListener('beforeunload', (evento) => {
    if (guardadoComo !== null && instantanea() + campoNombre.value !== guardadoComo) evento.preventDefault();
  });
}

iniciar().catch((error) => {
  console.error(error);
  $('estado').textContent = 'No se pudo cargar el editor. Recarga la página para intentarlo de nuevo.';
});

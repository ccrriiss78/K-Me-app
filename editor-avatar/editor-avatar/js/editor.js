// Editor de avatares: crea toda la ventana dentro de un contenedor de tu página.
//
//   import { crearEditor } from './js/editor.js';
//   const editor = await crearEditor(document.getElementById('editor'), {
//     catalogo: 'datos/catalogo.json',
//     avatar: avatarGuardado,                 // opcional
//     alGuardar: async (avatar, png) => {},   // opcional: guarda en tu base de datos
//   });
//
// El contenedor también emite el evento 'avatar-cambiado' (detail = avatar) en cada cambio.
import { cargarCatalogo, Catalogo } from './catalogo.js';
import { normalizarAvatar, Historial } from './estado.js';
import { cssDeColores } from './colores.js';
import { svgDelAvatar, pngDelAvatar } from './renderizador.js';
import { Lienzo2D } from './lienzo2d.js';
import { clonar, leer, escribir, escaparHTML } from './utilidades.js';

let editores = 0;

export async function crearEditor(contenedor, opciones = {}) {
  const op = {
    catalogo: 'datos/catalogo.json',
    avatar: null,
    alGuardar: null,
    con3D: true,
    pestanaInicial: 'pelo',
    nombreArchivo: 'avatar.png',
    ...opciones,
  };
  const catalogo = op.catalogo instanceof Catalogo ? op.catalogo : await cargarCatalogo(op.catalogo);
  const categorias = catalogo.categorias();
  const id = `av${++editores}`;

  let avatar = normalizarAvatar(op.avatar, catalogo.porDefecto);
  let modo = '2d';
  let categoria = categorias.some(c => c.id === op.pestanaInicial) ? op.pestanaInicial : categorias[0].id;
  let separado = false;
  let vista3d = null, cargando3d = null;
  const historial = new Historial();

  // ---------- estructura HTML ----------
  contenedor.innerHTML = `
  <div class="av-editor" data-av="${id}">
    <style class="av-estilo-colores"></style>
    <div class="av-principal">
      <section class="av-tarjeta av-escenario" aria-label="Vista previa">
        <div class="av-cabecera">
          <div class="av-modos" role="tablist" aria-label="Modo de vista">
            <button role="tab" data-modo="2d" aria-selected="true">2D por capas</button>
            ${op.con3D ? '<button role="tab" data-modo="3d" aria-selected="false">3D</button>' : ''}
          </div>
        </div>
        <div class="av-vista">
          <div class="av-vista2d"><div class="av-lienzo" role="img" aria-label="Vista previa del avatar"></div></div>
          <div class="av-vista3d" hidden><div class="av-msg3d">Cargando el motor 3D…</div></div>
        </div>
        <div class="av-herramientas">
          <button class="av-chip" data-accion="capas" aria-pressed="false">Ver capas</button>
          <button class="av-chip" data-accion="aleatorio">Aleatorio</button>
          <button class="av-chip" data-accion="deshacer" disabled>Deshacer</button>
        </div>
        <p class="av-explicacion"></p>
      </section>
      <section class="av-tarjeta av-panel" aria-label="Personalización">
        <nav class="av-pestanas" role="tablist" aria-label="Categorías">
          ${categorias.map(c => `<button class="av-pestana" role="tab" data-categoria="${c.id}">${escaparHTML(c.nombre)}</button>`).join('')}
        </nav>
        <div class="av-opciones"></div>
        <div class="av-acciones">
          <button class="av-boton" data-accion="datos">Ver datos</button>
          <button class="av-boton" data-accion="png">Descargar PNG</button>
          <button class="av-boton av-principal-btn" data-accion="guardar">Guardar</button>
        </div>
      </section>
    </div>
    <div class="av-modal" hidden>
      <div class="av-tarjeta av-hoja" role="dialog" aria-modal="true">
        <div class="av-hoja-cabecera"><h2></h2><button class="av-cerrar" aria-label="Cerrar">×</button></div>
        <div class="av-hoja-cuerpo"></div>
        <div class="av-hoja-acciones"></div>
      </div>
    </div>
    <div class="av-flotante" role="status" aria-live="polite"></div>
  </div>`;

  const raiz = contenedor.querySelector('.av-editor');
  const $ = sel => raiz.querySelector(sel);
  const estilo = $('.av-estilo-colores');
  const opcionesEl = $('.av-opciones');
  const lienzo = new Lienzo2D($('.av-lienzo'), catalogo);
  lienzo.resaltar(categoria);

  // ---------- dibujo ----------
  function dibujarTodo() {
    estilo.textContent = cssDeColores(avatar, `[data-av="${id}"]`);
    lienzo.dibujar(avatar);
    dibujarPanel();
    if (modo === '3d' && vista3d) vista3d.dibujar(avatar);
    $('[data-accion="deshacer"]').disabled = historial.vacio;
    if (!$('.av-modal').hidden && modalActual === 'datos') mostrarDatos();
    contenedor.dispatchEvent(new CustomEvent('avatar-cambiado', { detail: clonar(avatar) }));
  }

  function htmlPiezas(sec) {
    const actual = leer(avatar, sec.ruta);
    const tapada = catalogo.seccionTapada(avatar, sec.ruta);
    const aviso = tapada ? '<p class="av-aviso">Ahora mismo otra prenda tapa esta parte; al elegir una se cambia la otra.</p>' : '';
    const items = catalogo.piezas(sec.ruta).map(p => {
      const prueba = clonar(avatar);
      escribir(prueba, sec.ruta, p.id);
      catalogo.resolverConflictos(prueba, sec.ruta);
      const mini = svgDelAvatar(catalogo, prueba, {
        recorte: sec.recorte, conFondo: !!sec.conFondo, rellenar: !!sec.rellenar, estilos: false,
      });
      const fondo = sec.fondoPiel ? avatar.piel : 'var(--av-suave)';
      return `<button class="av-pieza" data-ruta="${sec.ruta}" data-valor="${p.id}" aria-pressed="${actual === p.id}" aria-label="${escaparHTML(p.nombre)}">
        <span class="av-mini" style="background:${fondo}">${mini}</span><span class="av-nombre">${escaparHTML(p.nombre)}</span></button>`;
    }).join('');
    return `<div class="av-seccion"><h3>${escaparHTML(sec.titulo)}</h3>${aviso}<div class="av-rejilla">${items}</div></div>`;
  }

  function htmlColores(sec) {
    const actual = leer(avatar, sec.ruta);
    const paleta = catalogo.paleta(sec.paleta);
    const botones = paleta.map(c => c === null
      ? `<button class="av-color av-sin" data-ruta="${sec.ruta}" data-color="" aria-pressed="${actual == null}" aria-label="Sin color">Sin</button>`
      : `<button class="av-color" style="background:${c}" data-ruta="${sec.ruta}" data-color="${c}" aria-pressed="${!!actual && actual.toLowerCase() === c}" aria-label="Color ${c}"></button>`).join('');
    const propio = !!actual && !paleta.includes(actual.toLowerCase());
    const nota = sec.nota ? `<p class="av-aviso">${escaparHTML(sec.nota)}</p>` : '';
    return `<div class="av-seccion"><h3>${escaparHTML(sec.titulo)}</h3>${nota}<div class="av-colores">${botones}
      <label class="av-color av-propio" title="Otro color" aria-pressed="${propio}"><input type="color" data-ruta="${sec.ruta}" value="${actual || '#ffffff'}" aria-label="Elegir otro color"></label></div></div>`;
  }

  function dibujarPanel() {
    const cat = categorias.find(c => c.id === categoria);
    raiz.querySelectorAll('.av-pestana').forEach(b => b.setAttribute('aria-selected', b.dataset.categoria === categoria));
    const scroll = opcionesEl.scrollTop;
    opcionesEl.innerHTML = cat.secciones.map(s => (s.tipo === 'piezas' ? htmlPiezas(s) : htmlColores(s))).join('');
    opcionesEl.scrollTop = scroll;
  }

  function cambiar(ruta, valor) {
    historial.guardar(avatar);
    escribir(avatar, ruta, valor);
    catalogo.resolverConflictos(avatar, ruta);
    dibujarTodo();
  }

  function explicar() {
    $('.av-explicacion').innerHTML = modo === '3d'
      ? '<b>Arrastra para girar.</b> Pelo, ropa y accesorios son piezas 3D; ojos, boca y maquillaje son los mismos dibujos del modo 2D pegados como textura en la cara.'
      : separado
        ? '<b>Cada pieza es una imagen transparente del mismo tamaño</b> y se dibuja de atrás hacia delante. Las capas resaltadas son las de la categoría abierta.'
        : 'Elige una categoría y toca una opción. <b>Ver capas</b> separa el avatar para mostrar cómo se apilan las piezas.';
  }

  // ---------- eventos del panel ----------
  $('.av-pestanas').addEventListener('click', e => {
    const b = e.target.closest('.av-pestana');
    if (!b) return;
    categoria = b.dataset.categoria;
    opcionesEl.scrollTop = 0;
    dibujarPanel();
    lienzo.resaltar(categoria);
  });
  opcionesEl.addEventListener('click', e => {
    const pieza = e.target.closest('[data-valor]');
    if (pieza) { cambiar(pieza.dataset.ruta, pieza.dataset.valor); return; }
    const color = e.target.closest('button[data-color]');
    if (color) cambiar(color.dataset.ruta, color.dataset.color || null);
  });
  // Selector de color libre: guarda un solo paso en el historial por cada uso
  let eligiendoColor = false;
  opcionesEl.addEventListener('input', e => {
    if (e.target.type !== 'color') return;
    if (!eligiendoColor) { historial.guardar(avatar); eligiendoColor = true; }
    escribir(avatar, e.target.dataset.ruta, e.target.value);
    estilo.textContent = cssDeColores(avatar, `[data-av="${id}"]`);
    lienzo.dibujar(avatar);
    if (modo === '3d' && vista3d) vista3d.dibujar(avatar);
    $('[data-accion="deshacer"]').disabled = false;
  });
  opcionesEl.addEventListener('change', e => {
    if (e.target.type === 'color') { eligiendoColor = false; dibujarTodo(); }
  });

  // ---------- herramientas y acciones ----------
  raiz.addEventListener('click', async e => {
    const b = e.target.closest('[data-accion]');
    if (!b) return;
    switch (b.dataset.accion) {
      case 'capas':
        separado = !separado;
        lienzo.separarCapas(separado);
        b.classList.toggle('activo', separado);
        b.setAttribute('aria-pressed', separado);
        b.textContent = separado ? 'Juntar capas' : 'Ver capas';
        explicar();
        break;
      case 'aleatorio':
        historial.guardar(avatar);
        avatar = catalogo.aleatorio();
        dibujarTodo();
        break;
      case 'deshacer': {
        const anterior = historial.deshacer();
        if (anterior) { avatar = anterior; dibujarTodo(); }
        break;
      }
      case 'datos': mostrarDatos(); break;
      case 'png': descargarPNG(); break;
      case 'guardar': guardar(); break;
    }
  });

  raiz.querySelectorAll('.av-modos button').forEach(b => b.addEventListener('click', () => cambiarModo(b.dataset.modo)));

  async function cambiarModo(nuevo) {
    modo = nuevo;
    raiz.querySelectorAll('.av-modos button').forEach(b => b.setAttribute('aria-selected', b.dataset.modo === nuevo));
    $('.av-vista2d').hidden = nuevo !== '2d';
    $('.av-vista3d').hidden = nuevo !== '3d';
    $('[data-accion="capas"]').hidden = nuevo !== '2d';
    explicar();
    if (nuevo === '3d') {
      const v = await prepararVista3D();
      if (v && modo === '3d') { v.dibujar(avatar); v.iniciar(); }
    } else if (vista3d) {
      vista3d.detener();
    }
  }

  function prepararVista3D() {
    if (vista3d) return Promise.resolve(vista3d);
    if (cargando3d) return cargando3d;
    const msg = $('.av-msg3d');
    msg.hidden = false;
    // El módulo 3D se carga solo la primera vez que se abre la pestaña 3D
    cargando3d = import('./vista3d.js')
      .then(m => m.crearVista3D($('.av-vista3d'), {
        catalogo,
        caraSVG: a => svgDelAvatar(catalogo, a, {
          recorte: '92 138 216 144', conFondo: false, soloCapas: ['maquillaje', 'ojos', 'boca'], ancho: 768, alto: 512,
        }),
      }))
      .then(v => { vista3d = v; msg.hidden = true; return v; })
      .catch(err => {
        console.error(err);
        msg.textContent = 'No se pudo iniciar la vista 3D (revisa que vendor/three.module.min.js exista y que el navegador tenga WebGL).';
        cargando3d = null;
        return null;
      });
    return cargando3d;
  }

  async function exportarPNG() {
    if (modo === '3d' && vista3d) return vista3d.capturaPNG();
    return pngDelAvatar(catalogo, avatar);
  }

  async function descargarPNG() {
    try {
      const url = await exportarPNG();
      const a = document.createElement('a');
      a.href = url;
      a.download = op.nombreArchivo;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      avisar('No se pudo generar la imagen');
    }
  }

  async function guardar() {
    const boton = $('[data-accion="guardar"]');
    boton.disabled = true;
    try {
      if (op.alGuardar) await op.alGuardar(clonar(avatar), await exportarPNG());
      avisar('Avatar guardado');
    } catch (err) {
      console.error(err);
      avisar('No se pudo guardar');
    } finally {
      boton.disabled = false;
    }
  }

  // ---------- ventana de datos y avisos ----------
  let modalActual = null;
  function abrirModal(tipo, titulo, cuerpo, acciones) {
    modalActual = tipo;
    $('.av-hoja-cabecera h2').textContent = titulo;
    $('.av-hoja-cuerpo').innerHTML = cuerpo;
    $('.av-hoja-acciones').innerHTML = acciones;
    $('.av-modal').hidden = false;
  }
  function cerrarModal() { $('.av-modal').hidden = true; modalActual = null; }
  $('.av-cerrar').addEventListener('click', cerrarModal);
  $('.av-modal').addEventListener('click', e => {
    if (e.target.classList.contains('av-modal')) cerrarModal();
    if (e.target.dataset.cerrar !== undefined) cerrarModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('.av-modal').hidden) cerrarModal(); });

  function mostrarDatos() {
    const json = JSON.stringify(avatar, null, 2);
    abrirModal('datos', 'Datos del avatar',
      `<pre>${escaparHTML(json)}</pre><p>Esto es todo lo que hay que guardar por usuario. Los modos 2D y 3D dibujan el avatar a partir de este objeto.</p>`,
      '<button class="av-boton" data-copiar>Copiar JSON</button><button class="av-boton av-principal-btn" data-cerrar>Cerrar</button>');
    $('[data-copiar]').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(json); avisar('JSON copiado'); } catch (_) { avisar('No se pudo copiar'); }
    });
  }

  let temporizadorAviso;
  function avisar(texto) {
    const el = $('.av-flotante');
    el.textContent = texto;
    el.classList.add('visible');
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => el.classList.remove('visible'), 2200);
  }

  explicar();
  dibujarTodo();

  // ---------- API pública ----------
  return {
    catalogo,
    obtenerAvatar: () => clonar(avatar),
    cambiarAvatar(nuevo) { historial.guardar(avatar); avatar = normalizarAvatar(nuevo, catalogo.porDefecto); dibujarTodo(); },
    exportarPNG,
    destruir() { lienzo.destruir(); if (vista3d) vista3d.detener(); contenedor.innerHTML = ''; },
  };
}

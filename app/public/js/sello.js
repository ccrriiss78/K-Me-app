// Solo presentación. El servidor valida, dibuja y guarda; sin JS funciona el formulario original.
(() => {
  'use strict';
  const form = document.querySelector('[data-sello-editor]');
  if (!form) return;
  // Si falta una capacidad, queda el formulario original, incluido su botón de vista previa.
  if (typeof fetch !== 'function' || typeof AbortController !== 'function'
    || typeof FormData !== 'function' || typeof URLSearchParams !== 'function' || typeof DOMParser !== 'function') return;
  const botonVista = form.querySelector('button[name="accion"][value="vista"]');
  const nodos = Object.fromEntries(['dibujo', 'avisos', 'ayuda', 'error', 'estado', 'cambios']
    .map(k => [k, document.querySelector(`[data-sello-${k}]`)]));
  if (Object.values(nodos).some(n => !n)) return;
  const campos = new Set(['palabra', 'color_palabra', 'avatar', 'encuadre', 'mostrar_alias', 'color_alias',
    'borde', 'fondo', 'motivo1', 'motivo2', 'motivo3', 'color_motivo1', 'color_motivo2', 'color_motivo3']);
  const inicialPendiente = form.dataset.selloPendiente === 'true';
  const firma = () => JSON.stringify([...new FormData(form)].filter(([k]) => campos.has(k) || k === 'nombre').sort());
  const inicial = firma();
  let pendiente = inicialPendiente, enviando = false, automatico = true, temporizador, controlador, revision = 0;

  function marcarCambios() {
    pendiente = inicialPendiente || firma() !== inicial;
    nodos.cambios.textContent = pendiente ? 'Tienes cambios sin guardar' : 'Tus cambios se guardan cuando pulses Guardar.';
    nodos.cambios.dataset.pendiente = String(pendiente);
  }
  function error(mensaje) {
    nodos.error.textContent = mensaje;
    nodos.error.hidden = !mensaje;
  }
  function enviarVistaNormal() {
    automatico = false;
    revision++;
    clearTimeout(temporizador);
    controlador?.abort();
    if (botonVista) botonVista.hidden = false;
    nodos.estado.textContent = 'Vista previa automática no disponible. Utiliza «Ver cómo queda».';
    if (botonVista && typeof form.requestSubmit === 'function') {
      // Conserva CSRF, versión, selecciones y la validación nativa. El submit de abajo
      // deja pasar este envío; accion=vista impide que se guarde accidentalmente.
      form.requestSubmit(botonVista);
    } else {
      const accion = document.createElement('input');
      accion.type = 'hidden'; accion.name = 'accion'; accion.value = 'vista';
      form.append(accion);
      enviando = true;
      form.submit();
    }
  }
  function svgSeguro(texto) {
    if (typeof texto !== 'string') throw new Error('Dibujo no válido');
    const xml = new DOMParser().parseFromString(texto, 'image/svg+xml');
    const svg = xml.documentElement;
    if (svg.localName !== 'svg' || svg.namespaceURI !== 'http://www.w3.org/2000/svg'
      || xml.querySelector('parsererror, script, foreignObject, iframe, object, embed, image, a, animate, set')) throw new Error('Dibujo no válido');
    for (const elemento of [svg, ...svg.querySelectorAll('*')]) {
      for (const atributo of elemento.attributes) {
        if (/^on/i.test(atributo.name) || (/href$/i.test(atributo.name) && !atributo.value.startsWith('#'))) throw new Error('Dibujo no válido');
      }
    }
    return document.importNode(svg, true);
  }
  function mostrarAyuda(ayuda) {
    nodos.ayuda.replaceChildren();
    nodos.ayuda.hidden = !ayuda;
    if (!ayuda) return;
    // Todo el texto, incluida la ayuda del catálogo, se inserta sin interpretar HTML.
    const hangul = document.createElement('span');
    hangul.setAttribute('lang', 'ko');
    hangul.textContent = ayuda.hangul;
    nodos.ayuda.append(hangul, ` · se lee ${ayuda.lectura} · significa «${ayuda.significado}»`);
  }
  async function actualizar() {
    if (!automatico) return;
    clearTimeout(temporizador);
    const numero = ++revision;
    controlador?.abort();
    controlador = new AbortController();
    const query = new URLSearchParams();
    for (const [k, v] of new FormData(form)) if (campos.has(k)) query.append(k, v);
    if (form.dataset.selloId) query.set('sello', form.dataset.selloId);
    nodos.dibujo.setAttribute('aria-busy', 'true');
    nodos.estado.textContent = 'Actualizando tu sello…';
    error('');
    try {
      const res = await fetch(`/studio/sellos/vista-previa?${query}`, {
        headers: { Accept: 'application/json' }, signal: controlador.signal, credentials: 'same-origin', cache: 'no-store',
      });
      // Una respuesta antigua tampoco puede provocar un envío del formulario.
      if (numero !== revision) return;
      if (res.redirected || !res.headers.get('content-type')?.includes('application/json')) {
        nodos.dibujo.removeAttribute('aria-busy');
        enviarVistaNormal();
        return;
      }
      const datos = await res.json();
      if (numero !== revision) return;
      if (!res.ok) {
        error(typeof datos.error === 'string' ? datos.error : 'Revisa las opciones del sello.');
        nodos.estado.textContent = 'No se ha podido actualizar. Se conserva la vista anterior.';
        return;
      }
      const svg = svgSeguro(datos.svg);
      svg.classList?.add('sello--editor');
      nodos.dibujo.replaceChildren(svg);
      const avisos = Array.isArray(datos.avisos) ? datos.avisos : [];
      nodos.avisos.replaceChildren(...avisos.map(texto => {
        const li = document.createElement('li'); li.textContent = String(texto); return li;
      }));
      nodos.avisos.hidden = !avisos.length;
      mostrarAyuda(datos.ayuda);
      nodos.estado.textContent = avisos.length ? 'Vista previa actualizada. Revisa los avisos de contraste.' : 'Vista previa actualizada.';
    } catch (err) {
      if (numero !== revision || err.name === 'AbortError') return;
      error('No se pudo actualizar la vista previa. Puedes volver a intentarlo o guardar mediante el formulario.');
      nodos.estado.textContent = 'Se conserva la vista anterior.';
    } finally {
      if (numero === revision) nodos.dibujo.removeAttribute('aria-busy');
    }
  }
  function actualizarMuestra(control) {
    const grupo = control.closest?.('.muestras');
    if (!grupo) return;
    const nombre = grupo.querySelector('[data-color-elegido]');
    if (nombre) nombre.textContent = control.dataset.nombre;
    const punto = grupo.querySelector('[data-color-actual]');
    if (punto && /^#[0-9a-f]{6}$/i.test(control.dataset.color || '')) punto.style.setProperty('--muestra', control.dataset.color);
  }
  function cambiar(evento) {
    marcarCambios();
    actualizarMuestra(evento.target);
    if (!automatico || !campos.has(evento.target.name)) return;
    // Invalidar ya la petición anterior: tampoco puede pintar durante el tiempo de espera.
    revision++;
    controlador?.abort();
    clearTimeout(temporizador);
    temporizador = setTimeout(actualizar, 220);
  }
  form.addEventListener('input', cambiar);
  form.addEventListener('change', cambiar);
  form.addEventListener('submit', evento => {
    if (automatico && evento.submitter?.name === 'accion' && evento.submitter.value === 'vista') {
      evento.preventDefault(); actualizar();
    } else {
      // Solo se suprime el aviso al enviar de verdad un guardado válido. Un error del servidor
      // vuelve al editor con data-sello-pendiente=true; ver una vista previa nunca marca guardado.
      enviando = true;
    }
  });
  window.addEventListener('beforeunload', evento => {
    if (!pendiente || enviando) return;
    evento.preventDefault(); evento.returnValue = '';
  });
  window.addEventListener('pageshow', () => { enviando = false; marcarCambios(); });
  marcarCambios();
  // Se oculta al final: si no se ha podido instalar la mejora, el respaldo sigue disponible.
  if (botonVista) botonVista.hidden = true;
})();

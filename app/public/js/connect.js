// Connect (D038): reaccionar y quitar reacciones sin recargar el muro, para que no parpadee.
//
// Mejora progresiva: sin este script, cada botón envía su formulario y la página se recarga, y todo
// funciona igual. Con el script, el formulario se envía por detrás pidiendo JSON, y solo cambian los
// números y los botones de esa publicación. Si algo sale mal, se envía el formulario de la forma
// normal y el servidor muestra lo que corresponda.
// Va en un archivo aparte (no dentro de la vista) por la política de seguridad de contenido (CSP).

(() => {
  const aviso = document.getElementById('connect-aviso');
  const plantilla = document.getElementById('plantilla-mis-reacciones');
  const ultimaPeticion = new WeakMap(); // por publicación: solo vale la respuesta de la última pulsación

  const esDeReacciones = (form) => /\/connect\/publicaciones\/\d+\/reacciones(\/quitar)?$/.test(new URL(form.action).pathname);

  // El desplegable nativo funciona sin JS. Esta mejora añade Escape y cierre al pulsar fuera.
  document.addEventListener('keydown', evento => {
    if (evento.key !== 'Escape') return;
    const menu = evento.target.closest?.('[data-mas-reacciones]');
    if (!menu?.open) return;
    evento.preventDefault(); menu.open = false;
    menu.querySelector('summary')?.focus();
  });
  document.addEventListener('click', evento => {
    for (const menu of document.querySelectorAll('[data-mas-reacciones][open]')) {
      if (!menu.contains(evento.target)) menu.open = false;
    }
  });

  function anunciar(texto) {
    if (!aviso) return;
    aviso.textContent = '';
    // Cambiar el texto en otro momento hace que el lector de pantalla lo vuelva a leer aunque se repita.
    requestAnimationFrame(() => { aviso.textContent = texto; });
  }

  // Envío normal (recargando), para cuando falla el envío por detrás. form.submit() no incluye el
  // botón pulsado (qué reacción, o «la última»/«todas»), así que se añade como campo oculto.
  function enviarNormal(form, boton) {
    if (boton?.name) {
      const campo = document.createElement('input');
      campo.type = 'hidden';
      campo.name = boton.name;
      campo.value = boton.value;
      form.append(campo);
    }
    form.submit();
  }

  function latido(boton) {
    boton.classList.remove('reaccion--latido');
    void boton.offsetWidth; // reinicia la animación si se pulsa seguido
    boton.classList.add('reaccion--latido');
  }

  // Pone en la publicación los números que ha devuelto el servidor.
  function aplicar(articulo, estado) {
    for (const r of estado.reacciones) {
      const boton = articulo.querySelector(`.reaccion[value="${r.id}"]`);
      if (!boton) continue;
      boton.dataset.total = String(r.total);
      boton.dataset.mias = String(r.mias);
      boton.classList.toggle('reaccion--mia', r.mias > 0);
      boton.disabled = r.completa;
      boton.setAttribute('aria-label', r.etiqueta);
      const total = boton.querySelector('.reaccion__total');
      if (total) total.textContent = String(r.total);
    }

    const mas = articulo.querySelector('[data-mas-reacciones]');
    const cuentaExtra = mas?.querySelector('[data-total-extra]');
    if (cuentaExtra) {
      const totalExtra = [...mas.querySelectorAll('.reaccion')].reduce((suma, b) => suma + Number(b.dataset.total || 0), 0);
      cuentaExtra.textContent = String(totalExtra);
      cuentaExtra.hidden = !totalExtra;
      cuentaExtra.setAttribute('aria-label', `${totalExtra} reacciones adicionales`);
    }

    const acciones = articulo.querySelector('.publicacion__acciones');
    let mis = articulo.querySelector('[data-mis-reacciones]');
    if (estado.totalMias > 0) {
      if (!mis && plantilla && acciones) {
        mis = plantilla.content.firstElementChild.cloneNode(true);
        mis.querySelector('form').action = `/connect/publicaciones/${articulo.dataset.publicacion}/reacciones/quitar`;
        acciones.prepend(mis);
      }
      const cuenta = mis?.querySelector('[data-total-mias]');
      if (cuenta) cuenta.textContent = String(estado.totalMias);
    } else if (mis) {
      // Si el foco estaba dentro de «Tus reacciones», pasa a la primera reacción para no perderlo.
      const teniaFoco = mis.contains(document.activeElement);
      mis.remove();
      if (teniaFoco) articulo.querySelector('.reaccion')?.focus();
    }
  }

  document.addEventListener('submit', async (evento) => {
    const form = evento.target;
    if (!(form instanceof HTMLFormElement) || !esDeReacciones(form)) return;
    const articulo = form.closest('article[data-publicacion]');
    if (!articulo) return;
    evento.preventDefault();

    const boton = evento.submitter;
    const datos = new URLSearchParams(new FormData(form, boton));
    const peticion = {};
    ultimaPeticion.set(articulo, peticion);
    if (boton?.classList.contains('reaccion')) latido(boton);

    try {
      const respuesta = await fetch(form.action, {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
        body: datos,
        credentials: 'same-origin',
      });
      // Sesión caducada: el servidor redirige a «Entrar».
      if (respuesta.redirected) { window.location.href = respuesta.url; return; }
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      const estado = await respuesta.json();
      if (ultimaPeticion.get(articulo) !== peticion) return; // llegó tarde: ya hay una pulsación más nueva
      aplicar(articulo, estado);
      if (boton?.classList.contains('reaccion')) {
        anunciar(estado.reacciones.find((r) => r.id === boton.value)?.etiqueta ?? '');
      } else {
        anunciar(estado.totalMias ? `Te quedan ${estado.totalMias} reacciones en esta publicación.` : 'Has quitado tus reacciones de esta publicación.');
      }
    } catch {
      // Algo ha fallado: se envía de la forma normal y el servidor responde con su página.
      enviarNormal(form, boton);
    }
  });
})();

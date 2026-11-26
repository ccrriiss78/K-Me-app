// «K-ME · TÚ DECIDES» (D080): votar sin recargar la página (E0098).
//
// La autora lo pidió porque, al votar, la página se recargaba y saltaba hasta la votación.
// Mejora progresiva: sin este script, el formulario se envía, la página se recarga y todo funciona
// igual. Con el script, el voto se envía por detrás pidiendo JSON, y el servidor devuelve el bloque
// de la votación ya actualizado (la confirmación, la tarjeta elegida y los porcentajes), que sustituye
// al de ahora sin mover la página. Si algo sale mal, se envía el formulario de la forma normal y el
// servidor responde con su página.
// Va en un archivo aparte (no dentro de la vista) por la política de seguridad de contenido (CSP).

(() => {
  const seccion = document.getElementById('tu-decides');
  if (!seccion) return;

  // Pone el bloque nuevo dentro de la sección (la sección se queda, y con ella este escuchador).
  function pintar(html) {
    const plantilla = document.createElement('template');
    plantilla.innerHTML = html;
    const nueva = plantilla.content.getElementById('tu-decides');
    if (!nueva) throw new Error('Respuesta sin el bloque');
    // El aviso entra vacío y se escribe después: así el lector de pantalla lo lee.
    const aviso = nueva.querySelector('.tu-decides__aviso');
    const textoAviso = aviso?.textContent ?? '';
    if (aviso) aviso.textContent = '';
    seccion.replaceChildren(...nueva.childNodes);
    if (aviso) requestAnimationFrame(() => { aviso.textContent = textoAviso; });
    // El foco vuelve al botón que se acaba de pulsar, sin desplazar la página.
    seccion.querySelector('.tu-decides__formulario button[type="submit"]')?.focus({ preventScroll: true });
  }

  seccion.addEventListener('submit', async (evento) => {
    const form = evento.target;
    if (!(form instanceof HTMLFormElement) || !form.classList.contains('tu-decides__formulario')) return;
    evento.preventDefault();
    const boton = form.querySelector('button[type="submit"]');
    if (boton) boton.disabled = true; // un voto cada vez
    try {
      const respuesta = await fetch(form.action, {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)),
        credentials: 'same-origin',
      });
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      pintar((await respuesta.json()).html);
    } catch {
      // Algo ha fallado (también si la sesión ha caducado): se envía de la forma normal.
      if (boton) boton.disabled = false;
      form.submit();
    }
  });
})();

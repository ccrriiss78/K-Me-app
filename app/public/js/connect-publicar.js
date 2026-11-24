// CONNECT · componer el mensaje con iconos (E0072).
// Mejora progresiva: sin JavaScript, el mensaje se compone con los 5 desplegables «Icono 1…5» del
// formulario. Con JavaScript, esos desplegables se esconden y se usa una paleta con los dibujos:
// el script solo cambia el valor de los desplegables, que son los que se envían. Así el servidor
// recibe lo mismo en los dos casos y lo comprueba igual. Sin scripts en línea (CSP).

(() => {
  const grupo = document.querySelector('[data-mensaje]');
  const contenedor = grupo?.querySelector('[data-mensaje-desplegables]');
  const desplegables = grupo ? [...grupo.querySelectorAll('select[name="iconos"]')] : [];
  if (!contenedor || !desplegables.length) return;

  const maximo = desplegables.length;
  // Los iconos se leen del primer desplegable, con sus grupos (Emociones, Reacciones, Universo K-pop).
  const grupos = [...desplegables[0].querySelectorAll('optgroup')].map((og) => ({
    texto: og.label,
    iconos: [...og.querySelectorAll('option')].map((o) => ({ id: o.value, texto: o.textContent, icono: o.dataset.icono })),
  }));
  const porId = new Map(grupos.flatMap((g) => g.iconos.map((i) => [i.id, i])));
  let elegidos = desplegables.map((s) => s.value).filter((v) => porId.has(v));

  function crear(etiqueta, atributos = {}, texto = '') {
    const nodo = document.createElement(etiqueta);
    for (const [k, v] of Object.entries(atributos)) nodo.setAttribute(k, v);
    if (texto) nodo.textContent = texto;
    return nodo;
  }
  const dibujo = (i) => crear('img', { src: i.icono, alt: '', width: '28', height: '28' });

  const borrador = crear('ol', { class: 'mensaje-iconos mensaje-iconos--borrador', 'aria-label': 'Tu mensaje' });
  const vacio = crear('p', { class: 'nota mensaje__vacio' }, 'Todavía no has elegido ningún icono. Toca uno para añadirlo; tócalo en tu mensaje para quitarlo.');
  const aviso = crear('p', { class: 'solo-lectores', 'aria-live': 'polite' });
  const paleta = crear('div', { class: 'mensaje__paleta' });
  for (const g of grupos) {
    const bloque = crear('div', { class: 'mensaje__bloque', role: 'group', 'aria-label': g.texto });
    bloque.append(crear('p', { class: 'mensaje__titulo-grupo', 'aria-hidden': 'true' }, g.texto));
    const fila = crear('div', { class: 'mensaje__iconos' });
    for (const i of g.iconos) {
      const boton = crear('button', { type: 'button', class: 'mensaje__icono', 'data-id': i.id, 'aria-label': `Añadir: ${i.texto}`, title: i.texto });
      boton.append(dibujo(i));
      fila.append(boton);
    }
    bloque.append(fila);
    paleta.append(bloque);
  }

  function pintar() {
    desplegables.forEach((s, n) => { s.value = elegidos[n] ?? ''; });
    borrador.replaceChildren(...elegidos.map((id, n) => {
      const i = porId.get(id);
      const boton = crear('button', { type: 'button', class: 'mensaje__elegido', 'data-posicion': String(n), 'aria-label': `Quitar el icono ${n + 1}: ${i.texto}`, title: `Quitar: ${i.texto}` });
      boton.append(dibujo(i));
      const li = crear('li');
      li.append(boton);
      return li;
    }));
    borrador.hidden = !elegidos.length;
    vacio.hidden = elegidos.length > 0;
    const lleno = elegidos.length >= maximo;
    // aria-disabled y no disabled: el botón con el foco no lo pierde al llenarse el mensaje.
    paleta.querySelectorAll('.mensaje__icono').forEach((b) => b.setAttribute('aria-disabled', String(lleno)));
  }

  paleta.addEventListener('click', (evento) => {
    const boton = evento.target.closest('.mensaje__icono');
    if (!boton) return;
    if (elegidos.length >= maximo) {
      aviso.textContent = `Ya tienes ${maximo} iconos. Quita uno de tu mensaje para cambiarlo.`;
      return;
    }
    elegidos.push(boton.dataset.id);
    pintar();
    aviso.textContent = `Añadido: ${porId.get(boton.dataset.id).texto}. Llevas ${elegidos.length} de ${maximo}.`;
  });

  borrador.addEventListener('click', (evento) => {
    const boton = evento.target.closest('.mensaje__elegido');
    if (!boton) return;
    const posicion = Number(boton.dataset.posicion);
    const [quitado] = elegidos.splice(posicion, 1);
    pintar();
    aviso.textContent = `Quitado: ${porId.get(quitado).texto}. Llevas ${elegidos.length} de ${maximo}.`;
    // El foco pasa al icono que ocupa ese sitio, al anterior o, si no queda ninguno, a la paleta.
    const siguiente = borrador.querySelectorAll('.mensaje__elegido')[Math.min(posicion, elegidos.length - 1)];
    (siguiente ?? paleta.querySelector('.mensaje__icono'))?.focus();
  });

  contenedor.hidden = true;
  contenedor.after(vacio, borrador, paleta, aviso);
  pintar();
})();

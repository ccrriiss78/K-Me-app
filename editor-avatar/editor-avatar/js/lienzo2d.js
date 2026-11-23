// Vista 2D: un <svg> por capa, apilados uno encima de otro.
// Tenerlos separados permite la vista "Ver capas" y resaltar las capas de una categoría.

export class Lienzo2D {
  constructor(elemento, catalogo) {
    this.el = elemento;
    this.catalogo = catalogo;
    this.separado = false;
    this.categoriaResaltada = null;
    const { ancho, alto } = catalogo.datos.lienzo;
    this.el.classList.add('av-lienzo');
    this.el.style.setProperty('--centro', (catalogo.capas.length - 1) / 2);
    this.el.style.aspectRatio = `${ancho} / ${alto}`;
    this.el.innerHTML = catalogo.capas.map((c, i) => `
      <div class="av-capa av-capa-${c.id}" data-capa="${c.id}" data-categoria="${c.categoria}" style="--i:${i}">
        <svg viewBox="0 0 ${ancho} ${alto}" aria-hidden="true"></svg>
        <span class="av-etiqueta">${i + 1} · ${c.nombre}</span>
      </div>`).join('');
    this.capasEl = [...this.el.querySelectorAll('.av-capa')];
    this._parpadear();
  }

  dibujar(avatar) {
    const contenido = this.catalogo.contenido(avatar);
    for (const div of this.capasEl) div.querySelector('svg').innerHTML = contenido[div.dataset.capa] || '';
  }

  separarCapas(activo) {
    this.separado = activo;
    this.el.classList.toggle('separado', activo);
    this._marcar();
  }

  resaltar(categoria) {
    this.categoriaResaltada = categoria;
    this._marcar();
  }

  destruir() {
    clearTimeout(this._temporizador);
  }

  _marcar() {
    for (const div of this.capasEl) {
      const activa = div.dataset.categoria === this.categoriaResaltada;
      div.classList.toggle('atenuada', this.separado && !activa);
      div.classList.toggle('resaltada', this.separado && activa);
    }
  }

  // Parpadeo: solo afecta a los ojos que tienen la clase "parpadeo" en su SVG.
  _parpadear() {
    const ojos = this.el.querySelector('.parpadeo');
    if (ojos && !this.separado && this.el.offsetParent) {
      ojos.classList.add('cerrado');
      setTimeout(() => ojos.classList.remove('cerrado'), 140);
    }
    this._temporizador = setTimeout(() => this._parpadear(), 2800 + Math.random() * 2400);
  }
}

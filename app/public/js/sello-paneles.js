// Mejora progresiva de las categorías del editor. El formulario funciona sin este archivo.
(() => {
  'use strict';
  const form = document.querySelector('[data-sello-editor]');
  const menu = form?.querySelector('[data-sello-categorias]');
  if (!menu) return;
  const enlaces = [...menu.querySelectorAll('a')];
  const paneles = enlaces.map(a => document.getElementById(a.getAttribute('href').slice(1)));
  // No ocultar nada si la estructura no está completa.
  if (enlaces.length !== 3 || paneles.some(p => !p)) return;
  function seleccionar(indice, enfocar = false) {
    enlaces.forEach((a, i) => {
      a.setAttribute('aria-selected', String(i === indice));
      a.setAttribute('tabindex', i === indice ? '0' : '-1');
      paneles[i].hidden = i !== indice;
    });
    if (enfocar) enlaces[indice].focus();
  }
  enlaces.forEach((a, i) => {
    a.setAttribute('role', 'tab');
    a.setAttribute('aria-controls', paneles[i].id);
    paneles[i].setAttribute('role', 'tabpanel');
    paneles[i].setAttribute('aria-labelledby', a.id);
    paneles[i].setAttribute('tabindex', '0');
    a.addEventListener('click', e => { e.preventDefault(); seleccionar(i); });
    a.addEventListener('keydown', e => {
      let siguiente;
      if (e.key === 'ArrowRight') siguiente = (i + 1) % enlaces.length;
      else if (e.key === 'ArrowLeft') siguiente = (i + enlaces.length - 1) % enlaces.length;
      else if (e.key === 'Home') siguiente = 0;
      else if (e.key === 'End') siguiente = enlaces.length - 1;
      else if (e.key === ' ' || e.key === 'Enter') siguiente = i;
      if (siguiente === undefined) return;
      e.preventDefault(); seleccionar(siguiente, true);
    });
  });
  menu.setAttribute('role', 'tablist');
  seleccionar(0);
})();

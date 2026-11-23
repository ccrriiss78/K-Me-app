// Página de demostración: monta el editor y guarda el avatar en este navegador.
// En la app real, cambia alGuardar para enviar el avatar a tu servidor (ejemplo abajo).
import { crearEditor } from './editor.js';

const CLAVE = 'avatar-chibi-v1';
const contenedor = document.getElementById('editor');

function cargarGuardado() {
  try { return JSON.parse(localStorage.getItem(CLAVE)); } catch (_) { return null; }
}

try {
  const editor = await crearEditor(contenedor, {
    catalogo: 'datos/catalogo.json',
    avatar: cargarGuardado(),
    async alGuardar(avatar, png) {
      localStorage.setItem(CLAVE, JSON.stringify(avatar));

      // Con servidor propio sería algo así:
      // await fetch('/api/avatar', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ config: avatar, png }),
      // });
    },
  });

  // Ejemplo: reaccionar a cada cambio (por ejemplo, para activar un botón "Continuar")
  contenedor.addEventListener('avatar-cambiado', e => {
    // console.log('Avatar actual:', e.detail);
  });

  window.editorAvatar = editor; // útil para probar desde la consola del navegador
} catch (err) {
  console.error(err);
  const archivoLocal = location.protocol === 'file:';
  contenedor.innerHTML = `<div class="error"><b>No se pudo cargar el editor.</b><br>${archivoLocal
    ? 'Has abierto el archivo con doble clic. El editor necesita un servidor local: abre una terminal en esta carpeta y ejecuta <code>npx serve .</code> (o usa Live Server en VS Code). Más detalles en el README.'
    : 'Revisa la consola del navegador (F12) para ver qué archivo falta.'}</div>`;
}

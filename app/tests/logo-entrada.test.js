// Pruebas del logo en las páginas de entrada (T014; petición de la autora del 22/11/2026, E0049):
// - en «Entrar» y «Crear cuenta» el logo va muy grande dentro de la tarjeta, antes del título: en el
//   ordenador, a la izquierda del formulario; en el móvil, encima. Debajo, el lema
//   «Sin fan no hay idol.» con el estilo del editor (fan e idol en negrita, rayitas fucsias en el CSS);
// - esas dos páginas no tienen barra de cabecera (el logo no se repite) y el lema no se repite en el pie;
// - el resto de páginas conservan el logo pequeño en la cabecera.
// Necesitan una base de datos real configurada en app/.env.local (la sesión se guarda en PostgreSQL).
// Ejecutar desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

let servidor, base, cerrarPool;

function hayConfiguracion() {
  return ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'SESSION_SECRET']
    .every((k) => process.env[k] && !process.env[k].startsWith('CAMBIAR_POR'));
}

before(async () => {
  if (!hayConfiguracion()) return;
  const { crearApp } = await import('../src/app.js');
  ({ cerrarPool } = await import('../src/config/db.js'));
  const { app } = crearApp();
  await new Promise((ok) => { servidor = app.listen(0, '127.0.0.1', ok); });
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  if (!servidor) return;
  try {
    await new Promise((ok) => servidor.close(ok));
  } finally {
    await cerrarPool();
  }
});

const pedir = async (ruta) => {
  const res = await fetch(base + ruta, { redirect: 'manual' });
  return { estado: res.status, html: await res.text() };
};

// Lo que hay en la tarjeta antes del título <h1>.
function antesDelTitulo(html) {
  const tarjeta = /<section class="tarjeta[^"]*"[^>]*>([\s\S]*?)<h1/.exec(html);
  assert.ok(tarjeta, 'hay una tarjeta con su título');
  return tarjeta[1];
}

test('logo de las páginas de entrada', { skip: !hayConfiguracion() && 'Sin app/.env.local: prueba bloqueada, no fallida.' }, async (t) => {
  for (const ruta of ['/entrar', '/registro']) {
    await t.test(`${ruta}: el logo va muy grande (al menos 180 px de alto) dentro de la tarjeta, antes del título, con el lema de la marca debajo`, async () => {
      const { estado, html } = await pedir(ruta);
      assert.equal(estado, 200);
      const cabeza = antesDelTitulo(html);
      const logo = /<img[^>]*src="\/img\/logo-kme\.svg"[^>]*>/.exec(cabeza)?.[0];
      assert.ok(logo, 'el logo está en la tarjeta, antes del título');
      assert.match(logo, /alt="K-ME"/, 'el logo tiene texto alternativo');
      const alto = Number(/\bheight="(\d+)"/.exec(logo)?.[1] ?? 0);
      assert.ok(alto >= 180, `el logo mide al menos 180 px de alto (mide ${alto})`);
      assert.match(cabeza.slice(cabeza.indexOf(logo)),
        /<p class="lema-marca">Sin <strong>fan<\/strong> no hay <strong>idol<\/strong>\.<\/p>/,
        'el lema va debajo del logo, con fan e idol en negrita y la clase de las rayitas fucsias');
    });

    await t.test(`${ruta}: no hay barra de cabecera y el lema no se repite en el pie`, async () => {
      const { html } = await pedir(ruta);
      assert.doesNotMatch(html, /<header class="cabecera"/, 'sin barra de cabecera');
      const texto = html.replace(/<[^>]+>/g, ''); // el texto de la página, sin etiquetas
      assert.equal(texto.match(/Sin fan no hay idol\./g)?.length ?? 0, 1, 'el lema aparece una sola vez');
    });
  }

  // La autora pidió quitarla el 26/11/2026 (E0098): era una raya fucsia suelta sobre el borde de arriba
  // de la tarjeta, a la derecha (`.tarjeta--entrada::before`). La de debajo del título se queda.
  await t.test('la tarjeta de entrada no lleva la raya fucsia suelta encima del borde', async () => {
    const res = await fetch(base + '/css/identidad.css');
    assert.equal(res.status, 200);
    assert.doesNotMatch(await res.text(), /\.tarjeta--entrada::before/, 'sin la raya de adorno sobre la tarjeta');
  });

  await t.test('las demás páginas (por ejemplo, la de error 404) conservan el logo pequeño en la cabecera', async () => {
    const { estado, html } = await pedir('/esta-pagina-no-existe');
    assert.equal(estado, 404);
    const cabecera = /<header class="cabecera"[\s\S]*?<\/header>/.exec(html)?.[0];
    assert.ok(cabecera, 'hay barra de cabecera');
    assert.match(cabecera, /<img[^>]*src="\/img\/logo-kme\.svg"[^>]*height="40"/, 'con el logo pequeño');
  });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const propuestas = new URL('../propuestas-studio/', import.meta.url);
const leer = nombre => readFile(new URL(nombre, propuestas), 'utf8');

test('Mi K-ME y Connect muestran el logo sobre una banda blanca de altura completa', async () => {
  for (const nombre of ['KME_MI_KME_PROPUESTA.svg', 'KME_CONNECT_PROPUESTA.svg']) {
    const svg = await leer(nombre);
    assert.match(svg, /<rect x="0" y="40" width="156" height="100" rx="0" fill="#ffffff"/i, nombre);
  }
});

test('las dos entradas conservan el logo original y centran logo, lema y frase en el mismo eje', async () => {
  const logo = await readFile(new URL('../../../app/public/img/logo-kme.svg', import.meta.url), 'utf8');
  for (const [nombre, eje] of [['KME_ENTRAR_PROPUESTA.svg', 319], ['KME_REGISTRO_PROPUESTA.svg', 264]]) {
    const svg = await leer(nombre);
    assert.ok(svg.includes(logo), 'Logo original intacto en ' + nombre);
    assert.ok(svg.includes(`data-grupo="marca-centrada" data-eje="${eje}"`));
    for (const frase of ['Sin fan no hay idol.', 'Aquí, el fan', 'tiene voz.']) {
      assert.match(svg, new RegExp(`<text x="${eje}"[^>]*text-anchor="middle"[^>]*>${frase.replaceAll('.', '\\.')}</text>`));
    }
  }
});

test('el detalle ampliado y el índice presentan el blanco elegido sin sustituir el logo', async () => {
  const svg = await leer('KME_CABECERA_CONTRASTE.svg');
  assert.ok(/width="132" height="94" rx="0" fill="#ffffff"/i.test(svg), 'Banda blanca en la comparación existente');
  const indice = await leer('ABRIR_PROPUESTAS_APP.html');
  assert.ok(indice.includes('CABECERA_BLANCA_GRANDE.svg'));
  assert.ok(indice.includes('banda blanca'));
});

// Distribución automática del sello (D041, 22/11/2026). No necesita base de datos.
// - Solo palabra: el hangul ocupa la zona principal.
// - Solo avatar: aprovecha la mayor parte del interior.
// - Palabra + avatar: la palabra arriba y el avatar debajo; una palabra corta deja más sitio al
//   avatar y una larga conserva un tamaño legible; el hangul mantiene el protagonismo.
// - Ocultar el alias redistribuye el espacio.
// - Todo queda dentro del marco con margen, nada se solapa y nada se deforma ni queda diminuto.
// - Avisos si un color se distingue poco del fondo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { distribuirSello, avisosDeContraste, prepararDibujo, CAJA_INTERIOR, TAM_MIN_HANGUL } from '../src/services/selloDibujo.js';
import { ENCUADRES, MAX_MOTIVOS, MOTIVOS, COLORES } from '../src/catalogos/sello.js';

const ROSTRO = ENCUADRES.find((e) => e.id === 'rostro').recorte;
const CUERPO = ENCUADRES.find((e) => e.id === 'cuerpo').recorte;
const ALIAS_CORTO = 'fan_luz';
const ALIAS_LARGO = 'f'.repeat(30); // el alias más largo posible

const dentro = (c, en) => c.x >= en.x - 0.01 && c.y >= en.y - 0.01
  && c.x + c.ancho <= en.x + en.ancho + 0.01 && c.y + c.alto <= en.y + en.alto + 0.01;
const seSolapan = (a, b) => a.x < b.x + b.ancho && b.x < a.x + a.ancho && a.y < b.y + b.alto && b.y < a.y + a.alto;
const cajasDe = (d) => [
  d.palabra && { nombre: 'palabra', ...d.palabra.caja },
  d.avatar && { nombre: 'avatar', ...d.avatar },
  ...d.motivos.map((m, i) => ({ nombre: `adorno ${i + 1}`, x: m.x, y: m.y, ancho: m.tam, alto: m.tam })),
  d.alias && { nombre: 'alias', ...d.alias.caja },
].filter(Boolean);

// Todas las combinaciones posibles (salvo el sello vacío, que no se puede guardar).
const combinaciones = [];
for (const silabas of [0, 1, 2, 3]) {
  for (const encuadre of [null, ROSTRO, CUERPO]) {
    if (!silabas && !encuadre) continue;
    for (const alias of [null, ALIAS_CORTO, ALIAS_LARGO]) {
      for (let motivos = 0; motivos <= MAX_MOTIVOS; motivos++) combinaciones.push({ silabas, encuadre, alias, motivos });
    }
  }
}

test('en todas las combinaciones, todo queda dentro del interior con margen y nada se solapa', () => {
  for (const c of combinaciones) {
    const d = distribuirSello(c);
    const cajas = cajasDe(d);
    for (const caja of cajas) assert.ok(dentro(caja, CAJA_INTERIOR), `${caja.nombre} se sale en ${JSON.stringify(c)}`);
    for (let i = 0; i < cajas.length; i++) {
      for (let j = i + 1; j < cajas.length; j++) {
        assert.ok(!seSolapan(cajas[i], cajas[j]), `${cajas[i].nombre} tapa ${cajas[j].nombre} en ${JSON.stringify(c)}`);
      }
    }
  }
});

test('el avatar nunca se deforma y nada queda diminuto', () => {
  for (const c of combinaciones) {
    const d = distribuirSello(c);
    if (d.avatar) {
      const proporcion = d.avatar.ancho / d.avatar.alto;
      const esperada = c.encuadre.ancho / c.encuadre.alto;
      assert.ok(Math.abs(proporcion / esperada - 1) < 0.005, `avatar deformado en ${JSON.stringify(c)}`);
      assert.ok(d.avatar.alto >= CAJA_INTERIOR.alto * 0.45, `avatar demasiado pequeño en ${JSON.stringify(c)}`);
    }
    if (d.palabra) assert.ok(d.palabra.tam >= TAM_MIN_HANGUL, `hangul demasiado pequeño en ${JSON.stringify(c)}`);
    if (d.alias) assert.ok(d.alias.tam >= 12, `alias demasiado pequeño en ${JSON.stringify(c)}`);
    for (const m of d.motivos) assert.ok(m.tam >= 24, `adorno demasiado pequeño en ${JSON.stringify(c)}`);
  }
});

test('solo palabra: el hangul ocupa la zona principal', () => {
  for (const silabas of [1, 2, 3]) {
    for (const alias of [null, ALIAS_CORTO]) {
      const d = distribuirSello({ silabas, encuadre: null, alias, motivos: 1 });
      const { caja } = d.palabra;
      const llenado = Math.max(caja.ancho / d.zonaPrincipal.ancho, caja.alto / d.zonaPrincipal.alto);
      assert.ok(llenado >= 0.85, `${silabas} sílabas: solo llena el ${Math.round(llenado * 100)} %`);
      assert.equal(d.avatar, null);
    }
  }
});

test('solo avatar: aprovecha la mayor parte del interior', () => {
  for (const encuadre of [ROSTRO, CUERPO]) {
    for (const alias of [null, ALIAS_CORTO]) {
      const d = distribuirSello({ silabas: 0, encuadre, alias, motivos: 2 });
      const llenado = Math.max(d.avatar.ancho / d.zonaPrincipal.ancho, d.avatar.alto / d.zonaPrincipal.alto);
      assert.ok(llenado >= 0.97, `llena el ${Math.round(llenado * 100)} % de la zona principal`);
      const area = (d.avatar.ancho * d.avatar.alto) / (CAJA_INTERIOR.ancho * CAJA_INTERIOR.alto);
      assert.ok(area >= 0.5, `ocupa el ${Math.round(area * 100)} % del interior`);
      assert.equal(d.palabra, null);
    }
  }
});

test('palabra + avatar: la palabra va arriba con protagonismo y el avatar debajo, reconocible', () => {
  for (const encuadre of [ROSTRO, CUERPO]) {
    for (const silabas of [1, 2, 3]) {
      const d = distribuirSello({ silabas, encuadre, alias: ALIAS_CORTO, motivos: 1 });
      assert.ok(d.palabra.caja.y + d.palabra.caja.alto <= d.avatar.y, 'la palabra queda encima del avatar');
      assert.ok(d.palabra.tam >= 60, `hangul de ${d.palabra.tam.toFixed(0)} px: pierde protagonismo`);
      assert.equal(d.palabra.modo, 'horizontal');
    }
  }
});

test('palabra + avatar: una palabra corta deja más sitio al avatar; una larga sigue cabiendo y legible', () => {
  for (const encuadre of [ROSTRO, CUERPO]) {
    const corta = distribuirSello({ silabas: 1, encuadre, alias: ALIAS_CORTO, motivos: 1 });
    const larga = distribuirSello({ silabas: 3, encuadre, alias: ALIAS_CORTO, motivos: 1 });
    assert.ok(corta.avatar.alto > larga.avatar.alto, 'con la palabra corta, el avatar es más grande');
    assert.ok(larga.palabra.caja.ancho <= larga.zonaPrincipal.ancho, 'la palabra larga cabe a lo ancho');
    assert.ok(larga.palabra.tam >= TAM_MIN_HANGUL);
  }
});

test('al ocultar el alias, la palabra y el avatar ganan el espacio que deja', () => {
  for (const [silabas, encuadre] of [[2, null], [0, CUERPO], [2, ROSTRO], [3, CUERPO]]) {
    const con = distribuirSello({ silabas, encuadre, alias: ALIAS_CORTO, motivos: 1 });
    const sin = distribuirSello({ silabas, encuadre, alias: null, motivos: 1 });
    assert.equal(sin.alias, null);
    assert.ok(sin.zonaPrincipal.alto > con.zonaPrincipal.alto);
    const tamCon = (con.palabra?.tam ?? 0) + (con.avatar?.alto ?? 0);
    const tamSin = (sin.palabra?.tam ?? 0) + (sin.avatar?.alto ?? 0);
    assert.ok(tamSin > tamCon, `sin alias no crece nada en ${JSON.stringify({ silabas, encuadre })}`);
  }
});

test('el alias más largo cabe a lo ancho sin salirse', () => {
  const d = distribuirSello({ silabas: 2, encuadre: null, alias: ALIAS_LARGO, motivos: 0 });
  assert.ok(d.alias.caja.ancho <= CAJA_INTERIOR.ancho);
  assert.ok(d.alias.tam < distribuirSello({ silabas: 2, encuadre: null, alias: ALIAS_CORTO, motivos: 0 }).alias.tam);
});

test('un sello sin palabra ni avatar no se puede distribuir', () => {
  assert.throws(() => distribuirSello({ silabas: 0, encuadre: null, alias: ALIAS_CORTO, motivos: 1 }), /palabra o un avatar/);
});

const base = {
  borde: 'negro', fondo: 'blanco', palabra: { id: 'amor', color: 'negro' }, avatar: null,
  alias: { visible: true, color: 'negro' }, motivos: [{ id: 'corazon', color: 'fucsia' }], distribucion: 'automatica',
};

test('avisos de contraste: ninguno con los colores del logo', () => {
  assert.deepEqual(avisosDeContraste(base), []);
});

test('avisos de contraste: avisa de lo que se distingue poco del fondo, sin impedir guardar', () => {
  const avisos = avisosDeContraste({
    ...base,
    borde: 'blanco',
    palabra: { id: 'amor', color: 'blanco-calido' },
    alias: { visible: true, color: 'amarillo-suave' },
    motivos: [{ id: 'corazon', color: 'menta' }, { id: 'corazon', color: 'menta' }],
  });
  assert.ok(avisos.includes('El marco casi no se distingue del fondo.'));
  assert.ok(avisos.includes('La palabra se distingue poco del fondo.'));
  assert.ok(avisos.includes('El alias se lee mal sobre este fondo.'));
  assert.ok(avisos.includes('El adorno «Corazón» se distingue poco del fondo.'));
  assert.equal(new Set(avisos).size, avisos.length, 'sin avisos repetidos');
});

test('avisos de contraste: si el alias está oculto, no avisa de su color', () => {
  const avisos = avisosDeContraste({ ...base, alias: { visible: false, color: 'blanco' } });
  assert.deepEqual(avisos, []);
});

// Medidas de ChatGPT (E0058, V066): lo más lejos que puede llegar el dibujo del editor (todos los
// rostros, peinados, accesorios, cuerpos, prendas y calzado), en el lienzo de 400 × 480.
// izquierda, arriba, derecha, abajo.
const LIMITES = { rostro: [36.75, 6.6, 348.25, 356.25], cuerpo: [36.75, 6.6, 348.25, 433.4] };

test('los dos encuadres cubren todo lo que puede dibujar el editor, con al menos 8 de margen, sin pelo ni accesorios cortados', () => {
  for (const [id, [izq, arriba, der, abajo]] of Object.entries(LIMITES)) {
    const { x, y, ancho, alto } = ENCUADRES.find((e) => e.id === id).recorte;
    assert.ok(x <= izq - 8 && y <= arriba - 8 && x + ancho >= der + 8 && y + alto >= abajo + 8, `${id}: ${x} ${y} ${ancho} ${alto}`);
    assert.equal(x + ancho / 2, 200, `${id}: el avatar queda centrado (eje en x = 200)`);
  }
});

test('«solo rostro» dibuja solo las capas de la cabeza (sin ropa ni calzado); el cuerpo entero, todas', () => {
  const rostro = ENCUADRES.find((e) => e.id === 'rostro');
  const cuerpo = ENCUADRES.find((e) => e.id === 'cuerpo');
  assert.deepEqual(rostro.capas, ['pelo_atras', 'cabeza', 'maquillaje', 'ojos', 'maquillaje_detalles', 'cejas', 'boca', 'pelo_frente', 'accesorio']);
  assert.equal(cuerpo.capas, null);
});

test('cada adorno tiene su dibujo de una tinta (24 × 24) y se pinta del color elegido, también estrella, nota y rayitas', () => {
  for (const id of ['estrella', 'nota', 'rayitas']) assert.ok(MOTIVOS.some((m) => m.id === id), `falta el adorno «${id}»`);
  const fucsia = COLORES.find((c) => c.id === 'fucsia').valor;
  for (const m of MOTIVOS) {
    const archivo = readFileSync(new URL(`../public${m.icono}`, import.meta.url), 'utf8');
    assert.match(archivo, /viewBox="0 0 24 24"/, `${m.id}: viewBox`);
    const d = prepararDibujo({ ...base, motivos: [{ id: m.id, color: 'fucsia' }] }, { alias: 'fan_luz' });
    const [adorno] = d.motivos;
    assert.ok(adorno.contenido.length > 20, `${m.id}: dibujo vacío`);
    assert.doesNotMatch(adorno.contenido, /#000\b|#000000|black/i, `${m.id}: le queda tinta negra fija`);
    assert.equal(adorno.color, fucsia);
  }
});

// Catálogo de palabras en hangul del sello (TECH_SPEC §4.2, P008).
// Regla de la autora (22/11/2026, D043): «usa solo lo que esté bien comprobado como correcto».
// Solo entra una palabra si tiene su entrada en un diccionario del Instituto Nacional de la Lengua
// Coreana (NIKL). No necesita base de datos: comprueba el archivo del catálogo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PALABRAS_HANGUL, GRUPOS_HANGUL, buscarPalabra } from '../src/catalogos/hangul.js';

const SOLO_HANGUL = /^[가-힣]+$/; // sílabas completas, sin letras latinas ni espacios
const FUENTES_OFICIALES = ['https://krdict.korean.go.kr/', 'https://opendict.korean.go.kr/'];

test('el catálogo tiene palabras y cada una trae hangul, lectura, significado y grupo', () => {
  assert.ok(PALABRAS_HANGUL.length >= 30, `solo hay ${PALABRAS_HANGUL.length} palabras`);
  for (const p of PALABRAS_HANGUL) {
    assert.match(p.id, /^[a-z]+(-[a-z]+)*$/, `id no válido: ${p.id}`);
    assert.match(p.hangul, SOLO_HANGUL, `${p.id}: el hangul lleva otros caracteres`);
    assert.match(p.lectura, /^[a-z]+$/, `${p.id}: la lectura no es romanización en minúsculas`);
    assert.ok(p.significado.length > 0, `${p.id}: sin significado`);
    assert.ok(GRUPOS_HANGUL.some((g) => g.id === p.grupo), `${p.id}: grupo desconocido ${p.grupo}`);
  }
});

test('solo palabras comprobadas: cada una tiene su entrada en un diccionario oficial del NIKL', () => {
  for (const p of PALABRAS_HANGUL) {
    assert.ok(p.fuente?.entrada, `${p.id}: falta la entrada del diccionario`);
    assert.ok(FUENTES_OFICIALES.some((f) => p.fuente.enlace?.startsWith(f)), `${p.id}: la fuente no es del NIKL`);
    assert.equal(p.fuente.comprobadaEn, '2026-11-22', `${p.id}: falta la fecha de comprobación`);
    assert.equal(p.validadaPor, 'autora', `${p.id}: no consta la validación de la autora`);
  }
});

test('ni los ids ni el hangul se repiten', () => {
  const ids = PALABRAS_HANGUL.map((p) => p.id);
  const hangul = PALABRAS_HANGUL.map((p) => p.hangul);
  assert.equal(new Set(ids).size, ids.length, 'hay ids repetidos');
  assert.equal(new Set(hangul).size, hangul.length, 'hay hangul repetido');
});

test('quedan fuera las que no se pudieron comprobar con una entrada del diccionario', () => {
  // 응원봉 (lightstick) no está en ningún diccionario; 화이팅 no es la forma oficial (lo es 파이팅);
  // 사랑해, 고마워 y 보고 싶어 son formas conjugadas, sin entrada propia.
  for (const fuera of ['응원봉', '화이팅', '사랑해', '고마워', '보고싶어']) {
    assert.ok(!PALABRAS_HANGUL.some((p) => p.hangul === fuera), `${fuera} no debería estar`);
  }
});

test('buscarPalabra devuelve la palabra por su id, y nada si el id no existe', () => {
  assert.equal(buscarPalabra('amistad')?.hangul, '우정');
  assert.equal(buscarPalabra('no-existe'), undefined);
  assert.equal(buscarPalabra(undefined), undefined);
});

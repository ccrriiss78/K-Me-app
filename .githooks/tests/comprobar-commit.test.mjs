// Tests de la comprobación antes de cada commit (punto 4 de T021, D026).
// Ejecutar desde la raíz de k-me:  node --test ".githooks/tests/*.test.mjs"
//
// Los textos «peligrosos» (contraseñas, claves, tokens, correos) se construyen por trozos al
// ejecutar los tests. Así este archivo no los contiene y la propia comprobación no lo bloquea.
// Las pruebas con Git crean repositorios temporales fuera de k-me y los borran al terminar.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { revisarArchivos, formatearInforme } from '../comprobar-commit.mjs';

const carpetaHooks = join(dirname(fileURLToPath(import.meta.url)), '..');
const raizKme = join(carpetaHooks, '..');

// Trozos para construir los textos al ejecutar.
const PG = 'PGPASS' + 'WORD';
const SS = 'SESSION_' + 'SECRET';
const GUIONES = '-'.repeat(5);
const CLAVE_PRIVADA = `${GUIONES}BEGIN PRIVATE KEY${GUIONES}\n${'MIIEvQ'.padEnd(64, 'A')}\n${GUIONES}END PRIVATE KEY${GUIONES}\n`;
const TOKEN_GHP = 'gh' + 'p_' + 'A1b2C3d4'.repeat(4) + 'E5f6'; // prefijo + 36 caracteres
const TOKEN_PAT = 'github' + '_pat_' + '11ABCDEFG0' + 'x'.repeat(12) + '_' + 'Y'.repeat(59);
const VALOR = 'Valor' + 'Real' + '-9137';
const correo = (usuario, dominio) => usuario + '@' + dominio;

const revisar = (ruta, contenido, opciones) => revisarArchivos([{ ruta, contenido }], opciones);

// ---------- Archivos .env ----------

test('bloquea un archivo .env en la raíz', () => {
  const r = revisar('.env', 'NODE_ENV=development\n');
  assert.equal(r.bloqueos.length, 1);
  assert.match(r.bloqueos[0].motivo, /\.env/);
});

test('bloquea un .env.local dentro de una carpeta (app/.env.local)', () => {
  const r = revisar('app/.env.local', 'PORT=3001\n');
  assert.equal(r.bloqueos.length, 1);
  assert.equal(r.bloqueos[0].ruta, 'app/.env.local');
});

test('deja pasar .env.example con los valores de ejemplo CAMBIAR_POR', () => {
  const r = revisar('app/.env.example', `${PG}=CAMBIAR_POR_TU_CONTRASENA\n${SS}=CAMBIAR_POR_UNA_CADENA_LARGA_Y_ALEATORIA\n`);
  assert.deepEqual(r.bloqueos, []);
});

// ---------- Contraseñas y secretos con un valor real ----------

test('bloquea PGPASSWORD con un valor real (formato .env), en cualquier archivo', () => {
  const r = revisar('docs/notas.md', `Configuración:\n${PG}=${VALOR}\n`);
  assert.equal(r.bloqueos.length, 1);
  assert.equal(r.bloqueos[0].linea, 2);
});

test('bloquea SESSION_SECRET con un valor real (formato JSON)', () => {
  const r = revisar('app/config.json', `{\n  "${SS}": "${VALOR}"\n}\n`);
  assert.equal(r.bloqueos.length, 1);
});

test('bloquea un .env.example si alguien pone un valor real en vez de CAMBIAR_POR', () => {
  const r = revisar('app/.env.example', `${PG}=${VALOR}\n`);
  assert.equal(r.bloqueos.length, 1);
});

test('deja pasar PGPASSWORD vacío y el código que solo nombra la variable', () => {
  const r = revisar('app/src/config/env.js', `// ${PG}=\nconst clave = process.env.${PG};\n`);
  assert.deepEqual(r.bloqueos, []);
});

test('bloquea una clave privada (BEGIN con guiones seguido del contenido de la clave)', () => {
  const r = revisar('claves/servidor.txt', CLAVE_PRIVADA);
  assert.equal(r.bloqueos.length, 1);
  assert.equal(r.bloqueos[0].linea, 1);
});

test('deja pasar la palabra BEGIN con guiones en un texto que no lleva ninguna clave', () => {
  const r = revisar('README.md', `La comprobación busca «${GUIONES}BEGIN» en los archivos.\n`);
  assert.deepEqual(r.bloqueos, []);
});

test('bloquea un token de GitHub ghp_ real', () => {
  const r = revisar('app/scripts/subir.js', `const token = '${TOKEN_GHP}';\n`);
  assert.equal(r.bloqueos.length, 1);
});

test('bloquea un token de GitHub github_pat_ real', () => {
  const r = revisar('notas.txt', `token: ${TOKEN_PAT}\n`);
  assert.equal(r.bloqueos.length, 1);
});

test('deja pasar ghp_ y github_pat_ en un texto que los explica, sin token', () => {
  const r = revisar('CLAUDE.md', 'La comprobación busca tokens que empiezan por ghp_ o github_pat_.\n');
  assert.deepEqual(r.bloqueos, []);
});

test('busca también en archivos binarios (por ejemplo, una copia de la base de datos)', () => {
  const binario = Buffer.concat([Buffer.from([0, 1, 2, 0]), Buffer.from(`${PG}=${VALOR}`), Buffer.from([0, 0])]);
  const r = revisar('app/db/copia.sqlite', binario);
  assert.equal(r.bloqueos.length, 1);
});

// ---------- El informe ----------

test('el informe indica el archivo y la línea, y no muestra el valor del secreto', () => {
  const r = revisar('docs/notas.md', `hola\n${PG}=${VALOR}\n`);
  const informe = formatearInforme(r);
  assert.match(informe, /docs\/notas\.md/);
  assert.match(informe, /línea 2/);
  assert.doesNotMatch(informe, new RegExp(VALOR));
});

// ---------- Correos: avisan y piden permiso, no son un bloqueo ----------

test('un correo da un aviso (pide permiso a la autora), no un bloqueo', () => {
  const r = revisar('docs/contacto.md', `Escribe a ${correo('ana.prueba', 'example.com')}\n`);
  assert.equal(r.avisos.length, 1);
  assert.deepEqual(r.bloqueos, []);
});

test('el aviso del correo no muestra la dirección completa', () => {
  const direccion = correo('ana.prueba', 'example.com');
  const informe = formatearInforme(revisar('docs/contacto.md', `Escribe a ${direccion}\n`));
  assert.match(informe, /docs\/contacto\.md/);
  assert.doesNotMatch(informe, new RegExp(direccion.replace('.', '\\.')));
});

test('un correo de la lista de permitidos no da aviso', () => {
  const permitido = correo('noreply', 'users.noreply.github.com');
  const r = revisar('README.md', `Autor: ${permitido}\n`, { correosPermitidos: [permitido] });
  assert.deepEqual(r.avisos, []);
});

// ---------- Con Git de verdad (repositorios temporales) ----------

const temporales = [];
after(() => { for (const d of temporales) rmSync(d, { recursive: true, force: true }); });

function crearRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'kme-hook-'));
  temporales.push(dir);
  const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
  git('init', '-q');
  git('config', 'user.name', 'Prueba');
  git('config', 'user.email', correo('prueba', 'example.com'));
  git('config', 'core.autocrlf', 'false');
  git('config', 'core.hooksPath', carpetaHooks.replaceAll('\\', '/'));
  return dir;
}

function prepararYConfirmar(dir, archivos) {
  for (const [ruta, contenido] of Object.entries(archivos)) {
    mkdirSync(dirname(join(dir, ruta)), { recursive: true });
    writeFileSync(join(dir, ruta), contenido);
    execFileSync('git', ['add', '-f', ruta], { cwd: dir, stdio: 'pipe' });
  }
  return confirmar(dir);
}

function confirmar(dir) {
  const r = spawnSync('git', ['commit', '-m', 'prueba'], { cwd: dir, encoding: 'utf8' });
  return { estado: r.status, salida: (r.stdout ?? '') + (r.stderr ?? '') };
}

const hayCommit = (dir) => spawnSync('git', ['rev-parse', '--verify', '-q', 'HEAD'], { cwd: dir }).status === 0;

test('con el hook activado, un commit limpio se crea', () => {
  const dir = crearRepo();
  const r = prepararYConfirmar(dir, { 'README.md': '# Prueba\n' });
  assert.equal(r.estado, 0, r.salida);
  assert.ok(hayCommit(dir));
});

test('con el hook activado, un commit con una contraseña real no se crea y se explica el motivo', () => {
  const dir = crearRepo();
  const r = prepararYConfirmar(dir, { 'config.txt': `${PG}=${VALOR}\n` });
  assert.notEqual(r.estado, 0);
  assert.ok(!hayCommit(dir), 'no se ha creado ningún commit');
  assert.match(r.salida, /config\.txt/);
  assert.doesNotMatch(r.salida, new RegExp(VALOR));
});

test('con el hook activado, un .env añadido a la fuerza (git add -f) no entra', () => {
  const dir = crearRepo();
  const r = prepararYConfirmar(dir, { 'app/.env.local': 'PORT=3001\n' });
  assert.notEqual(r.estado, 0);
  assert.ok(!hayCommit(dir));
});

test('revisa lo preparado para el commit, no lo que hay en la carpeta', () => {
  const dir = crearRepo();
  writeFileSync(join(dir, 'config.txt'), `${PG}=${VALOR}\n`);
  execFileSync('git', ['add', 'config.txt'], { cwd: dir, stdio: 'pipe' });
  writeFileSync(join(dir, 'config.txt'), 'ya no hay secreto en la carpeta\n'); // sin volver a prepararlo
  const r = confirmar(dir);
  assert.notEqual(r.estado, 0, 'lo preparado sigue teniendo la contraseña');
  assert.ok(!hayCommit(dir));
});

test('con el hook activado, un correo detiene el commit con un aviso que pide permiso', () => {
  const dir = crearRepo();
  const r = prepararYConfirmar(dir, { 'contacto.md': `Escribe a ${correo('ana.prueba', 'example.com')}\n` });
  assert.notEqual(r.estado, 0);
  assert.match(r.salida, /AVISO/);
  assert.ok(!hayCommit(dir));
});

// ---------- Lo que ya hay en k-me ----------

test('los archivos que ya están en el último commit de k-me no dan ningún bloqueo ni aviso', () => {
  const rutas = execFileSync('git', ['ls-tree', '-r', '-z', '--name-only', 'HEAD'], { cwd: raizKme, encoding: 'utf8' }).split('\0').filter(Boolean);
  const archivos = rutas.map((ruta) => ({ ruta, contenido: execFileSync('git', ['show', `HEAD:${ruta}`], { cwd: raizKme, maxBuffer: 64 * 1024 * 1024 }) }));
  const r = revisarArchivos(archivos);
  assert.deepEqual(r.bloqueos, [], formatearInforme(r));
  assert.deepEqual(r.avisos, [], formatearInforme(r));
});

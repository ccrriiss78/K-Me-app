// Comprobación antes de cada commit (hook pre-commit de K-ME; D026, punto 4 de T021).
//
// Revisa lo PREPARADO para el commit (lo que se ha añadido con git add), no la carpeta.
// - BLOQUEA el commit si entra un archivo .env (salvo .env.example), o si algún archivo
//   lleva PGPASSWORD o SESSION_SECRET con un valor real, una clave privada o un token de GitHub.
// - AVISA y para el commit si hay un correo que no está en correos-permitidos.txt:
//   la autora decide si se puede guardar.
// Nunca muestra el valor de un secreto: solo el archivo, la línea y el tipo de problema.
// Tests: node --test ".githooks/tests/*.test.mjs"   (desde la raíz de k-me)

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const carpetaHooks = dirname(fileURLToPath(import.meta.url));
const ARCHIVO_PERMITIDOS = join(carpetaHooks, 'correos-permitidos.txt');

// Valores de ejemplo que no son secretos: CAMBIAR_POR…, <tu-valor>, ${VARIABLE}, xxx, ***, …
const ES_MARCADOR = /^(CAMBIAR_POR\w*|<[^>]*>|\$\{[^}]*\}|\$[A-Z_]+|x+|\*+|\.{3}|…)$/i;

// Cada regla: nombre que se enseña, expresión que busca y, si hace falta, cómo sacar el valor.
// Las expresiones se escriben de forma que este archivo no se encuentre a sí mismo.
const REGLAS_SECRETOS = [
  { que: 'variable con un valor real', re: /\b(PGPASSWORD|SESSION_SECRET)=(['"]?)([^\s'"#]*)/gi, valor: (m) => m[3], nombre: (m) => m[1] },
  { que: 'variable con un valor real', re: /["']\b(PGPASSWORD|SESSION_SECRET)["']\s*:\s*["']([^"'\r\n]*)["']/gi, valor: (m) => m[2], nombre: (m) => m[1] },
  { que: 'clave privada o certificado (bloque BEGIN)', re: /-{5}BEGIN ([A-Z0-9 ]+)-{5}\r?\n(?:[A-Za-z-]+:.*\r?\n)*\r?\n?[A-Za-z0-9+/=]{16,}/g },
  { que: 'token de GitHub', re: /\bgh[pousr]_[A-Za-z0-9]{36}\b/g },
  { que: 'token de GitHub', re: /\bgithub_pat_[A-Za-z0-9_]{40,}/g },
];
const RE_CORREO = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

const esBinario = (buf) => buf.subarray(0, 8000).includes(0);
const lineaDe = (texto, indice) => texto.slice(0, indice).split('\n').length;
const taparCorreo = (c) => c[0] + '…@' + c.split('@')[1];

function esArchivoEnv(ruta) {
  const nombre = basename(ruta);
  return (nombre === '.env' || nombre.startsWith('.env.')) && nombre !== '.env.example';
}

// Lee la lista de correos permitidos: una dirección por línea; lo que va tras # es un comentario.
export function leerCorreosPermitidos(archivo = ARCHIVO_PERMITIDOS) {
  if (!existsSync(archivo)) return [];
  return readFileSync(archivo, 'utf8').split(/\r?\n/).map((l) => l.replace(/#.*/, '').trim().toLowerCase()).filter(Boolean);
}

// Revisa una lista de archivos { ruta, contenido } (contenido: texto o Buffer) y devuelve
// { bloqueos, avisos }, cada uno con { ruta, linea, motivo }. linea es null en los binarios.
export function revisarArchivos(archivos, { correosPermitidos = leerCorreosPermitidos() } = {}) {
  const permitidos = new Set(correosPermitidos.map((c) => c.toLowerCase()));
  const bloqueos = [];
  const avisos = [];

  for (const { ruta, contenido } of archivos) {
    const buf = Buffer.isBuffer(contenido) ? contenido : Buffer.from(contenido, 'utf8');
    const binario = esBinario(buf);
    const texto = buf.toString(binario ? 'latin1' : 'utf8');

    if (esArchivoEnv(ruta)) {
      bloqueos.push({ ruta, linea: null, motivo: 'archivo .env: la configuración privada nunca entra en Git (solo .env.example)' });
    }

    for (const regla of REGLAS_SECRETOS) {
      for (const m of texto.matchAll(regla.re)) {
        if (regla.valor) {
          const valor = regla.valor(m);
          if (!valor || ES_MARCADOR.test(valor)) continue; // vacío o valor de ejemplo: no es un secreto
        }
        const que = regla.nombre ? `${regla.nombre(m).toUpperCase()} con un valor real` : regla.que;
        bloqueos.push({ ruta, linea: binario ? null : lineaDe(texto, m.index), motivo: `${que} (el valor no se muestra)` });
      }
    }

    if (!binario) {
      for (const m of texto.matchAll(RE_CORREO)) {
        if (permitidos.has(m[0].toLowerCase())) continue;
        avisos.push({ ruta, linea: lineaDe(texto, m.index), motivo: `correo ${taparCorreo(m[0])}` });
      }
    }
  }
  return { bloqueos, avisos };
}

const donde = ({ ruta, linea }) => (linea ? `${ruta}, línea ${linea}` : `${ruta} (archivo entero o binario)`);

// Texto que se enseña en la terminal. Vacío si no hay nada.
export function formatearInforme({ bloqueos, avisos }) {
  const partes = [];
  if (bloqueos.length) {
    partes.push(
      'BLOQUEADO: el commit no se ha hecho. Hay datos que no pueden entrar en Git:',
      ...bloqueos.map((b) => `  - ${donde(b)}: ${b.motivo}.`),
      'Quita el dato del archivo, o saca el archivo del commit con: git restore --staged <archivo>',
    );
  }
  if (avisos.length) {
    if (partes.length) partes.push('');
    partes.push(
      'AVISO: el commit se ha parado para preguntar a la autora. Hay correos en lo que se va a guardar:',
      ...avisos.map((a) => `  - ${donde(a)}: ${a.motivo}.`),
      'Si la autora da permiso, apunta cada dirección en .githooks/correos-permitidos.txt y repite el commit.',
    );
  }
  return partes.join('\n');
}

// Lo que ejecuta el hook. Devuelve 0 (el commit sigue) o 1 (Git lo cancela).
export async function main({ cwd = process.cwd(), escribir = (t) => process.stderr.write(t) } = {}) {
  const git = (args, encoding) => execFileSync('git', args, { cwd, encoding, maxBuffer: 256 * 1024 * 1024 });
  const raiz = git(['rev-parse', '--show-toplevel'], 'utf8').trim();
  const rutas = execFileSync('git', ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR'], { cwd: raiz, encoding: 'utf8' }).split('\0').filter(Boolean);
  const archivos = rutas.map((ruta) => ({ ruta, contenido: execFileSync('git', ['show', `:${ruta}`], { cwd: raiz, maxBuffer: 256 * 1024 * 1024 }) }));
  const resultado = revisarArchivos(archivos);
  if (!resultado.bloqueos.length && !resultado.avisos.length) return 0;
  escribir(formatearInforme(resultado) + '\n');
  return 1;
}

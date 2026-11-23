// Herramienta LOCAL para crear cuentas ficticias: usuario (privado, para entrar) y alias (público). D020.
// La contraseña se escribe oculta en la terminal: no va en argumentos, ni en el historial, ni en registros.
// Ejecutar desde app/:  npm run crear-cuenta

import readline from 'node:readline';
import { stdin, stdout } from 'node:process';
import { crearCuenta, validarUsuario, validarAlias, validarPassword } from '../src/services/authService.js';
import { cerrarPool } from '../src/config/db.js';

function preguntar(texto) {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  return new Promise((resolve) => rl.question(texto, (r) => { rl.close(); resolve(r.trim()); }));
}

// Lee una línea sin mostrar lo que se teclea (modo "raw" de la terminal).
function preguntarOculto(texto) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY) return reject(new Error('Hace falta una terminal interactiva para introducir la contraseña oculta.'));
    stdout.write(texto);
    let valor = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const onData = (ch) => {
      if (ch === '\r' || ch === '\n') {
        stdin.setRawMode(false); stdin.pause(); stdin.removeListener('data', onData);
        stdout.write('\n');
        resolve(valor);
      } else if (ch === '\u0003') { // Ctrl+C
        stdin.setRawMode(false); stdout.write('\n'); process.exit(130);
      } else if (ch === '\u007f' || ch === '\b') {
        valor = valor.slice(0, -1);
      } else {
        valor += ch;
      }
    };
    stdin.on('data', onData);
  });
}

async function main() {
  if (!stdin.isTTY) throw new Error('Ejecuta esta herramienta en una terminal interactiva (la contraseña se teclea oculta).');
  console.log('K-ME · crear cuenta ficticia (fase 1)\n');
  const usuario = await preguntar('Usuario, privado, para entrar (3-30 caracteres, letras/números/_): ');
  const errorUsuario = validarUsuario(usuario);
  if (errorUsuario) throw new Error(errorUsuario);
  const alias = await preguntar('Alias, público, distinto del usuario (3-30 caracteres, letras/números/_): ');
  const errorAlias = validarAlias(alias, usuario);
  if (errorAlias) throw new Error(errorAlias);

  const password = await preguntarOculto('Contraseña (oculta, mínimo 12): ');
  const errorPass = validarPassword(password);
  if (errorPass) throw new Error(errorPass);
  const repetida = await preguntarOculto('Repite la contraseña: ');
  if (password !== repetida) throw new Error('Las contraseñas no coinciden.');

  const cuenta = await crearCuenta({ usuario, alias, password });
  console.log(`\nCuenta creada: usuario "${cuenta.usuario}", alias "${cuenta.alias}" (id interno ${cuenta.id}).`);
}

main()
  .catch((err) => { console.error('\nNo se creó la cuenta:', err.message); process.exitCode = 1; })
  .finally(cerrarPool);

// SERVICIO de autenticación: reglas de negocio sobre cuentas, contraseñas y acceso.
// Lo usan los controladores web (entrar y registro) y la herramienta local de cuentas.
// Cada cuenta tiene un usuario (privado, para entrar) y un alias (público). D020.

import argon2 from 'argon2';
import * as Usuario from '../models/usuarioModel.js';
import { aliasNoPermitido } from '../catalogos/palabras-no-permitidas.js';

// Parámetros recomendados por OWASP para Argon2id (memoria 64 MiB, 3 iteraciones, 4 hilos).
const OPCIONES_ARGON = { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 };

// Longitud de la contraseña: de 12 a 128 caracteres, sin reglas de composición
// (no se exigen mayúsculas, números ni símbolos). Decisión de la autora, D016.
const PASSWORD_MIN = 12;
const PASSWORD_MAX = 128;

// Hash de "relleno" para que un usuario inexistente tarde lo mismo que uno real
// (evita adivinar qué usuarios existen midiendo el tiempo de respuesta).
let hashRelleno;

// Error de datos con un código, para que el controlador decida qué mensaje enseña (D021).
function errorDatos(mensaje, codigo = 'DATOS_NO_VALIDOS') {
  const e = new Error(mensaje);
  e.codigo = codigo;
  return e;
}

export function validarUsuario(usuario) {
  if (typeof usuario !== 'string' || !Usuario.NOMBRE_REGEX.test(usuario)) {
    return 'El usuario debe tener entre 3 y 30 caracteres: letras, números o guion bajo.';
  }
  return null;
}

// Si se pasa el usuario, comprueba además que el alias sea distinto: si fueran iguales,
// el usuario dejaría de ser secreto.
export function validarAlias(alias, usuario) {
  if (typeof alias !== 'string' || !Usuario.NOMBRE_REGEX.test(alias)) {
    return 'El alias debe tener entre 3 y 30 caracteres: letras, números o guion bajo.';
  }
  if (typeof usuario === 'string' && alias.toLowerCase() === usuario.toLowerCase()) {
    return 'El alias tiene que ser distinto de tu usuario.';
  }
  return null;
}

export function validarPassword(password) {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`;
  }
  if (password.length > PASSWORD_MAX) return `La contraseña no puede superar ${PASSWORD_MAX} caracteres.`;
  return null;
}

// Crea la cuenta y la devuelve ({ id, usuario, alias, creado_en }).
// Si algo falla, lanza un error con codigo: DATOS_NO_VALIDOS, ALIAS_IGUAL_USUARIO,
// ALIAS_NO_PERMITIDO, USUARIO_DUPLICADO o ALIAS_DUPLICADO.
export async function crearCuenta({ usuario, alias, password }) {
  const errorUsuario = validarUsuario(usuario);
  if (errorUsuario) throw errorDatos(errorUsuario);
  const errorAlias = validarAlias(alias);
  if (errorAlias) throw errorDatos(errorAlias);
  const errorDistinto = validarAlias(alias, usuario);
  if (errorDistinto) throw errorDatos(errorDistinto, 'ALIAS_IGUAL_USUARIO');
  // El alias es público (cabecera, Connect y, si se quiere, el sello): sin palabras no permitidas (D042).
  if (aliasNoPermitido(alias)) throw errorDatos('Ese alias no está permitido.', 'ALIAS_NO_PERMITIDO');
  const errorPass = validarPassword(password);
  if (errorPass) throw errorDatos(errorPass);
  const hashPassword = await argon2.hash(password, OPCIONES_ARGON);
  return Usuario.crear({ usuario, alias, hashPassword });
}

// Devuelve la cuenta ({ id, alias, creado_en }) si el usuario y la contraseña son correctos; si no, null.
// No devuelve el usuario: lo que se guarda en la sesión y se muestra es el alias.
export async function comprobarCredenciales({ usuario, password }) {
  if (typeof usuario !== 'string' || typeof password !== 'string') return null;
  // Más de 128 caracteres nunca es una contraseña válida: se rechaza ANTES de calcular
  // ningún hash. Así nadie puede hacer trabajar al servidor enviando textos enormes.
  // Devuelve null, igual que una contraseña incorrecta: se ve el mismo mensaje.
  if (password.length > PASSWORD_MAX) return null;
  const cuenta = await Usuario.buscarPorUsuario(usuario);
  if (!cuenta) {
    hashRelleno ??= await argon2.hash('relleno', OPCIONES_ARGON);
    await argon2.verify(hashRelleno, password); // mismo coste de tiempo, resultado ignorado
    return null;
  }
  const correcta = await argon2.verify(cuenta.hash_password, password);
  if (!correcta) return null;
  return { id: cuenta.id, alias: cuenta.alias, creado_en: cuenta.creado_en };
}

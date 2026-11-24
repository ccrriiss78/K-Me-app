// BORRAR VARIOS O TODOS (D058): reglas comunes de «Mis avatares» y «Mis sellos».
// - Primero se pide confirmación con el número y los nombres; luego se borran los ids confirmados.
// - Solo cuentan los ids con forma de id (número positivo), sin repetir y como mucho «maximo».
//   Los de otra cuenta no se encuentran: el modelo filtra siempre por la cuenta de la sesión.

const ID_VALIDO = /^[1-9]\d{0,17}$/;

// Los ids del formulario (una casilla: texto; varias: lista) o del JSON del editor (lista).
export function leerIds(valor, maximo) {
  const lista = Array.isArray(valor) ? valor : valor === undefined ? [] : [valor];
  const ids = lista
    .map((v) => (typeof v === 'number' ? String(v) : v))
    .filter((v) => typeof v === 'string' && ID_VALIDO.test(v));
  return [...new Set(ids)].slice(0, maximo);
}

export const pideTodos = (cuerpo) => cuerpo?.todos === 'si' || cuerpo?.todos === true;
export const estaConfirmado = (cuerpo) => cuerpo?.confirmar === 'si' || cuerpo?.confirmar === true;

// «borrados» de la dirección (?borrados=2), para el aviso de la lista: solo un número razonable.
export function leerBorrados(valor, maximo) {
  const n = Number(valor);
  return Number.isInteger(n) && n >= 1 && n <= maximo ? n : 0;
}

// Palabras no permitidas en el alias público (D042, 22/11/2026). El alias se ve en la cabecera,
// en Connect y, si el fan quiere, en su sello; por eso se comprueba al crear la cuenta.
//
// Cómo se compara (aliasNoPermitido):
// - sin mayúsculas ni tildes, y también cambiando los números que suelen sustituir letras
//   (0→o, 1→i, 3→e, 4→a, 5→s, 7→t, 8→b): «1d10ta» cuenta como «idiota»;
// - cada trozo separado por guion bajo o números («fan_idiota»), y el alias entero sin ellos;
// - las palabras de 5 letras o más, también al principio o al final («fanidiota»);
// - las de 7 o más, en cualquier sitio («fangilipollasx»).
// Las palabras cortas solo cuentan solas, para no rechazar alias corrientes como «computo» o
// «disputa». Un filtro no detecta todos los insultos: es una primera protección, no una moderación
// completa (si K-ME se publica, harán falta también revisión y denuncias).
// Lista corta propuesta por el asistente, pendiente de que la revise la autora.

export const PALABRAS_NO_PERMITIDAS = [
  'idiota', 'imbecil', 'estupido', 'estupida', 'tonto', 'tonta', 'gilipollas', 'gilipolla',
  'capullo', 'capulla', 'cabron', 'cabrona', 'puta', 'puto', 'mierda', 'zorra', 'subnormal',
  'retrasado', 'retrasada', 'maricon', 'polla', 'joder', 'asqueroso', 'asquerosa', 'pringado',
  'pringada', 'mongolo', 'mongola', 'bastardo', 'bastarda', 'cretino', 'cretina', 'nazi', 'hitler',
];

const LETRA_DE_NUMERO = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b' };

function variantes(texto) {
  const base = texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return [base, base.replace(/[0134578]/g, (d) => LETRA_DE_NUMERO[d])];
}

export function aliasNoPermitido(alias) {
  if (typeof alias !== 'string') return false;
  for (const v of variantes(alias)) {
    const trozos = v.split(/[^a-z]+/).filter(Boolean);
    const junto = v.replace(/[^a-z]/g, '');
    for (const p of PALABRAS_NO_PERMITIDAS) {
      if (trozos.includes(p) || junto === p) return true;
      if (p.length >= 5 && (junto.startsWith(p) || junto.endsWith(p))) return true;
      if (p.length >= 7 && junto.includes(p)) return true;
    }
  }
  return false;
}

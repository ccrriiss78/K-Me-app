// «K-ME · TÚ DECIDES» (D080, E0093): las propuestas FUTURAS que los fans pueden votar en «Mi K-ME».
// No son funcionalidades disponibles: la vista las marca como «Propuesta futura». Textos del encargo
// de la autora. En la base de datos solo se guarda el id (votos_tu_decides.propuesta).
// icono: la ruta del dibujo, dibujado por ChatGPT (T052, E0094; en public/img/tu-decides/). Es decorativo:
// la vista lo pinta con alt vacío, porque el título ya nombra la propuesta. Sin dibujo, sale sin icono.
// Las propuestas originales de cada una siguen en la bitácora: P030 (intercambios, a partir de P017 y
// P018), P027 (MY STAGE) y P015–P016 (eventos).
export const PROPUESTAS = [
  { id: 'exchange', titulo: 'K-ME EXCHANGE', texto: 'Intercambia prendas y accesorios de tu colección con otros fans.', icono: '/img/tu-decides/tu-decides-exchange.svg' },
  { id: 'my-stage', titulo: 'MY STAGE', texto: 'Crea pequeñas actuaciones musicales con tu avatar y compártelas dentro de K-ME.', icono: '/img/tu-decides/tu-decides-my-stage.svg' },
  { id: 'fan-events', titulo: 'FAN EVENTS', texto: 'Participa en eventos colectivos, aporta energía al escenario y consigue recuerdos exclusivos.', icono: '/img/tu-decides/tu-decides-fan-events.svg' },
];

export const esPropuesta = (id) => PROPUESTAS.some((p) => p.id === id);

// Porcentaje de cada propuesta a partir del recuento real ({ id: votos }). Se redondea por el método
// del mayor resto, para que siempre sumen 100 (con 1, 1 y 1: 34, 33 y 33). Sin votos, todo a 0.
export function porcentajes(recuento) {
  const total = PROPUESTAS.reduce((suma, p) => suma + (recuento[p.id] ?? 0), 0);
  const resultado = Object.fromEntries(PROPUESTAS.map((p) => [p.id, 0]));
  if (!total) return resultado;
  const partes = PROPUESTAS.map((p) => {
    const exacto = ((recuento[p.id] ?? 0) * 100) / total;
    resultado[p.id] = Math.floor(exacto);
    return { id: p.id, resto: exacto - Math.floor(exacto) };
  });
  let falta = 100 - Object.values(resultado).reduce((a, b) => a + b, 0);
  for (const { id } of partes.sort((a, b) => b.resto - a.resto)) {
    if (falta <= 0) break;
    resultado[id] += 1;
    falta -= 1;
  }
  return resultado;
}

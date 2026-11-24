// CATÁLOGO de las recompensas: la moneda de K-ME y los tesoros (D063, D064).
// - Kpopis: «Kpopi» en singular y «Kpopis» en plural, «de momento» (la autora, 24/11/2026), con su
//   icono propio. Antes de congelar el código solo los da HANGUL LIVE 001, una vez. El canje queda
//   para después: todavía no se pueden gastar.
// - Tesoros («Mis tesoros», «Mi álbum vivo»): objetos que se ganan, nunca se compran (P016).
//   En la base de datos solo se guarda su id: el nombre y el dibujo se pueden cambiar aquí.
// - Los dibujos (Kpopi y Luz Hangul 001) son del asistente; la autora los acepta «de momento»
//   (E0073).

export const KPOPI = { singular: 'Kpopi', plural: 'Kpopis', icono: '/img/kpopi.svg' };

// «1 Kpopi», «0 Kpopis», «20 Kpopis».
export const textoKpopis = (cantidad) => `${cantidad} ${cantidad === 1 ? KPOPI.singular : KPOPI.plural}`;

export const TESOROS = [
  {
    id: 'luz-hangul-001',
    nombre: 'Luz Hangul 001',
    clase: 'Lightstick',
    imagen: '/img/tesoros/luz-hangul-001.svg',
  },
];

export const buscarTesoro = (id) => TESOROS.find((t) => t.id === id) ?? null;

// Acabado E: pigmento en el borde y centro transparente.
// Todos los lavados usan f-ojos: el color sigue siendo el que elija el fan.
// Son trazos SVG estables, sin filtros, imágenes ni IDs que choquen entre miniaturas.
export function aplicarIrisAcuarela(contenido) {
  let indice = 0;
  const numero = n => Number(n.toFixed(3));
  const serie = /<ellipse\b[^>]*data-parte="iris"[^>]*\/>\s*<ellipse\b[^>]*\/>\s*<ellipse\b[^>]*\/>/g;
  return contenido.replace(serie, bloque => {
    const base = bloque.match(/^<ellipse\b[^>]*\/>/)[0];
    const atributo = nombre => Number(base.match(new RegExp('\\b' + nombre + '="([^"]+)"'))?.[1] || 0);
    const rx = atributo('rx'), ry = atributo('ry'), cy = atributo('cy');
    if (!(rx > 0 && ry > 0)) return bloque;
    const fase = .6 + indice++ * 1.7;
    const punto = (angulo, radio) => [rx * Math.cos(angulo) * radio, cy + ry * Math.sin(angulo) * radio];
    const borde = angulo => .965 + .018 * Math.sin(angulo * 7 + fase) + .012 * Math.cos(angulo * 13 - fase);
    const interior = angulo => .78 + .045 * Math.sin(angulo * 5 - fase) + .025 * Math.cos(angulo * 11 + fase);
    // Curvas cuadráticas entre puntos medios: irregularidad suave, sin picos geométricos.
    const curva = puntos => {
      const medio = (a, b) => a.map((n, i) => numero((n + b[i]) / 2));
      let d = 'M' + medio(puntos.at(-1), puntos[0]).join(' ');
      puntos.forEach((p, i) => { d += 'Q' + p.map(numero).join(' ') + ' ' + medio(p, puntos[(i + 1) % puntos.length]).join(' '); });
      return d + 'Z';
    };
    const vuelta = radio => curva(Array.from({length: 72}, (_, i) => {
      const angulo = i * Math.PI * 2 / 72;
      return punto(angulo, radio(angulo));
    }));
    const trazo = (tipo, d, opacidad, extra = '') => '<path data-textura="' + tipo + '" class="f-ojos" fill="#775d43" opacity="' + opacidad + '" d="' + d + '"' + extra + '/>';
    let pintura = base.replace(/opacity="[^"]+"/, 'opacity=".04"');
    pintura += trazo('lavado', vuelta(borde), .24);
    pintura += trazo('veladura', vuelta(a => .87 + .035 * Math.sin(4 * a + fase)), .17);
    pintura += trazo('borde-pigmentado', vuelta(borde) + vuelta(interior), .14, ' fill-rule="evenodd"');
    // Depósitos parciales: el contorno no se convierte en un aro oscuro uniforme.
    for (let i = 0; i < 8; i++) {
      const inicio = i * Math.PI / 4 + fase * .15, amplitud = .24 + .1 * Math.sin(i * 2.3 + fase);
      const exterior = [], dentro = [];
      for (let j = 0; j <= 8; j++) {
        const a = inicio + amplitud * j / 8;
        exterior.push(punto(a, borde(a) - .012));
        dentro.unshift(punto(a, .76 + .08 * Math.sin(a * 9 + fase)));
      }
      pintura += trazo('deposito', curva([...exterior, ...dentro]), numero(.10 + .08 * (1 + Math.sin(i + fase)) / 2));
    }
    // Grano fino, escaso y de opacidad baja; no invade la pupila ni el brillo.
    for (let i = 0; i < 42; i++) {
      const a = i * 2.39996 + fase, radio = .3 + .6 * ((i * .618034) % 1);
      const [x, y] = punto(a, radio);
      pintura += '<circle data-textura="grano" class="f-ojos" fill="#775d43" cx="' + numero(x) + '" cy="' + numero(y) + '" r="' + numero(.12 + .13 * ((i * .41421) % 1)) + '" opacity=".12"/>';
    }
    return '<g data-acabado="acuarela-e">' + pintura + '</g>';
  });
}

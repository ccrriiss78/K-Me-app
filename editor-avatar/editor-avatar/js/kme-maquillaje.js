// Piezas de escenario independientes; reutilizan la paleta de ropa, sin añadir tonos.
export const opcionesMaquillaje = [
  {titulo:'Sombra', campo:'sombraEstilo', color:'colorSombra', marca:'sombra', inicial:'#9673b7'},
  {titulo:'Delineado', campo:'delineado', color:'colorDelineado', marca:'delineado', inicial:'#282126'},
  {titulo:'Brillo', campo:'brillo', color:'colorBrillo', marca:'brillo', inicial:'#ede0cb'},
  {titulo:'Gemas', campo:'gemas', color:'colorGemas', marca:'gemas', inicial:'#cc7797'},
  {titulo:'Mejillas', campo:'mejillas', color:'colorRubor', marca:'rubor', inicial:'#cc7797'},
  {titulo:'Labios', campo:'labios', color:'colorLabios', marca:'labios', inicial:'#cc7797'},
];

export function coloresMaquillaje(catalogo) {
  return [...new Set([...catalogo.paleta('arriba'), ...catalogo.datos.gruposPaleta.ojos.fantasia])];
}

/** Ajusta solo los grupos propios de sombra/delineado. Nunca modifica los ojos. */
export function adaptarMaquillaje(svg, avatar, ojos = '') {
  svg = svg.replace(/<g data-boca="([a-z]+)"(?: display="none")?>[\s\S]*?<\/g>/g,
    (parte, boca) => boca === avatar.boca ? parte.replace(' display="none"', '') : '');
  const grosor = avatar.maquillaje.grosorLabios || 'fino';
  const anchos = {fino:[4.5,3.8,4.2], medio:[6.8,5.3,6.2], grueso:[9,7.2,8]}[grosor] || [4.5,3.8,4.2];
  svg = svg.replace('data-grosor="fino"', `data-grosor="${grosor}"`)
    .replace(/data-trazo="(velo|pigmento|grano)" stroke-width="[\d.]+"/g,
      (_, trazo) => `data-trazo="${trazo}" stroke-width="${anchos[['velo','pigmento','grano'].indexOf(trazo)]}"`);
  const estilo = avatar.ojos.estilo;
  const nuevo = estilo.startsWith('kme-');
  const familia = estilo.replace(/^kme-/, '').split('-')[0];
  const escalas = nuevo
    ? {redondos:[1,1], almendrados:[1.24,.79], alargados:[1.35,.54], dulces:[1.2,1.5], felinos:[1.35,1.15], escenario:[1.25,1.5]}
    : {redondos:[.85,1], almendrados:[1.16,1.05], alargados:[1.37,.79]};
  const letraTristeza=estilo.match(/^kme-tristeza-([a-f])-/)?.[1];
  const ajustesTristeza={a:[1.2,1.2], b:[1.3,.38], c:[1.3,.2], d:[1.3,1.5], e:[1.2,1.2], f:[1.2,1]};
  const [sx, sy] = ajustesTristeza[letraTristeza] || escalas[familia] || [1,1];
  const trazosOjos = [...ojos.matchAll(/<path\b[^>]*>/g)];
  const parpados = trazosOjos.filter(([trazo])=>trazo.includes('data-parte="linea-ojo"'));
  const lineas = (parpados.length ? parpados : trazosOjos.filter(([trazo])=>trazo.includes('fill="none"')&&!trazo.includes('data-')))
    .map(([trazo]) => trazo.match(/\bd="([^"]+)"/)?.[1]).filter(Boolean);
  return svg.replace(/<g data-anclaje="ojo-(izquierdo|derecho)" transform="[^"]*">([\s\S]*?)(?=<g data-anclaje="ojo-|$)/g,
    (grupo, lado, interior) => {
      const cerrado = estilo.includes('cerrados') || estilo.includes('guino-' + lado);
      const gesto = cerrado ? 'cerrado' : 'abierto';
      // Cada ojo del guiño conserva su estado; el párpado cerrado no lleva la sombra del abierto.
      let elegido = interior.replace(/<g data-gesto="(abierto|cerrado)"(?: display="none")?>[\s\S]*?<\/g>/g,
        (parte, estado) => estado === gesto ? parte.replace(' display="none"', '') : '');
      const x = lado === 'izquierdo' ? 152 : 248;
      if (svg.includes('data-maquillaje="delineado"') && lineas.length === 2) {
        // El delineado copia la curva real de este ojo, también en los guiños.
        const linea = lineas[lado === 'izquierdo' ? 0 : 1];
        const coordenadas = linea.match(/-?\d*\.?\d+/g).map(Number);
        const extremos=[coordenadas.slice(0,2),coordenadas.slice(-2)];
        const [puntaX,puntaY]=extremos.sort((a,b)=>lado==='izquierdo'?a[0]-b[0]:b[0]-a[0])[0];
        const direccion = lado === 'izquierdo' ? -1 : 1;
        elegido = elegido.replace(/<g data-gesto="(?:abierto|cerrado)">[\s\S]*?<\/g>/,
          `<g data-gesto="${gesto}" transform="translate(0 -1.4)"><path d="${linea}"/><path d="M${puntaX} ${puntaY}q${direccion * 4} 0 ${direccion * 6} -4" stroke-width="1.6"/></g>`);
        return `<g data-anclaje="ojo-${lado}" data-estado-ojo="${gesto}" transform="translate(${x} 205)">${elegido}`;
      }
      return `<g data-anclaje="ojo-${lado}" data-estado-ojo="${gesto}" transform="translate(${x} 205) scale(${lado === 'izquierdo' ? sx : -sx} ${cerrado ? 1 : sy})">${elegido}`;
    });
}

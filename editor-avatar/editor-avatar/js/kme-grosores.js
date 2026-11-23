export const grosoresKme = ['fino', 'medio', 'grueso'];

// El grosor medio conserva exactamente el dibujo original de cada ceja.
export function ajustarGrosorCejas(svg, grosor = 'medio') {
  const factor = {fino:.6, medio:1, grueso:1.65}[grosor] || 1;
  if (factor === 1) return svg;
  return svg.replace(/<path\b[^>]*>/g, trazo =>
    trazo.replace(/stroke-width="([\d.]+)"/, (_, ancho) =>
      `stroke-width="${Number((Number(ancho) * factor).toFixed(3))}"`));
}

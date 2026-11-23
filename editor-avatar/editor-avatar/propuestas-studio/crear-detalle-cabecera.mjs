// Ampliación de detalle para comparar fondos; logo original intacto.
import { readFile, writeFile } from 'node:fs/promises';
const logo = await readFile(new URL('../../../app/public/img/logo-kme.svg', import.meta.url), 'utf8');
for (const [nombre, fondo, archivo] of [
  ['BLANCA', '#ffffff', 'CABECERA_BLANCA_GRANDE.svg'],
  ['MARFIL', '#fffdf9', 'CABECERA_MARFIL_GRANDE.svg'],
  ['MAGENTA K-ME', '#e83475', 'CABECERA_MAGENTA_GRANDE.svg']
]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 600" role="img" aria-labelledby="titulo"><title id="titulo">Banda ${nombre}: detalle ampliado con el logo original</title><rect width="1400" height="600" fill="#f7f3ef"/><g font-family="Segoe UI,Arial,sans-serif"><text x="32" y="63" font-size="44" font-weight="800">${nombre}</text><rect x="0" y="100" width="1400" height="420" fill="#000"/><rect x="0" y="100" width="660" height="420" fill="${fondo}"/><svg x="204" y="130" width="252" height="360">${logo}</svg><text x="728" y="288" fill="#fffdf9" font-size="78" font-weight="900">K-ME</text><text x="728" y="382" fill="#fffdf9" font-size="64" font-weight="800">STUDIO</text><text x="32" y="568" font-size="24">Detalle ampliado · mismo sello y mismas proporciones · solo cambia el fondo de la banda</text></g></svg>`;
  await writeFile(new URL(archivo, import.meta.url), svg, 'utf8');
  if (!svg.includes(logo)) throw new Error('El logo ha cambiado');
  console.log(archivo);
}

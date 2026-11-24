// Genera una copia autónoma para abrir con doble clic. No cambia el editor.
import { readFile, writeFile } from 'node:fs/promises';
const raiz = new URL('../', import.meta.url);
const leerArchivo = ruta => readFile(new URL(ruta, raiz), 'utf8');
const datos = JSON.parse(await leerArchivo('datos/kme.json'));
const archivos = new Map();
for (const lista of Object.values(datos.piezas)) for (const pieza of lista) {
  for (const capa in pieza.capas) {
    const rutas = [pieza.capas[capa]].flat();
    pieza.capas[capa] = [];
    for (const ruta of rutas) {
      const svg = await readFile(new URL(ruta, new URL('datos/kme.json', raiz)), 'utf8');
      const enlace = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
      archivos.set(enlace, svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>')));
      pieza.capas[capa].push(enlace);
    }
  }
}
const modulos = ['utilidades','kme-ajuste-ropa','catalogo','kme-maquillaje','kme-grosores','colores','estado','kme-iris-acuarela','kme-cabello-acuarela','kme-cabello-pinceladas','renderizador','kme-ropa','kme-opciones-ojos','../assets/kme/marcos','kme-marcos','kme-impresion','kme-receta','kme-editor-visual','kme-vista-visual','kme-ambiente-visual'];
let codigo = '';
for (const modulo of modulos) {
  codigo += '\n' + (await leerArchivo(`js/${modulo}.js`))
    .replace(/^import .+;\r?\n/gm, '')
    .replace(/^export /gm, '');
}
const jsonSeguro = valor => JSON.stringify(valor).replaceAll('<', '\\u003c');
codigo += `\nconst KME_CATALOGO_LOCAL = new Catalogo(${jsonSeguro(datos)},new Map(${jsonSeguro([...archivos])}));\n`;
codigo += (await leerArchivo('js/kme-muestras.js'))
  .replace(/^import .+;\r?\n/gm, '')
  .replace("const catalogo=await cargarCatalogo('datos/kme.json');", 'const catalogo=KME_CATALOGO_LOCAL;');
const css = await leerArchivo('css/kme-muestras.css');
const logo = await readFile(new URL('../../K-ME-logos-revisados-v1.1/K-ME-logos-revisados-v1.1/03-web/K-ME-Studio.svg', raiz), 'utf8');
let html = await leerArchivo('kme-muestras.html');
html = html.replace('<link rel="stylesheet" href="css/kme-muestras.css">', `<style>${css}</style>`)
  .replace('  <script type="module" src="js/kme-muestras.js"></script>\n', '')
  .replace('../../K-ME-logos-revisados-v1.1/K-ME-logos-revisados-v1.1/03-web/K-ME-Studio.svg', 'data:image/svg+xml;base64,' + Buffer.from(logo).toString('base64'))
  .replace('</body>', `<script>\n(async () => {\n${codigo}\n})();\n</script>\n</body>`);
await writeFile(new URL('KME_ABRIR_MUESTRA.html', raiz), html, 'utf8');
console.log('Preparado: KME_ABRIR_MUESTRA.html (sin servidor ni conexión)');

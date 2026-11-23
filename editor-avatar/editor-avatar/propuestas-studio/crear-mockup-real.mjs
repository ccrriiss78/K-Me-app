// Maqueta estática: no se importa desde la app ni desde el editor.
// Avatar, miniaturas, iconos y logo proceden de los archivos vigentes.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Catalogo } from '../js/catalogo.js';
import { svgDelAvatar } from '../js/renderizador.js';

const base = new URL('../', import.meta.url);
const destino = new URL('./', import.meta.url);
const url = new URL('datos/kme.json', base);
const datos = JSON.parse(await readFile(url, 'utf8'));
const archivos = new Map();
const huellas = [];
for (const lista of Object.values(datos.piezas)) for (const pieza of lista) {
  for (const capa of Object.keys(pieza.capas)) {
    pieza.capas[capa] = [pieza.capas[capa]].flat();
    for (const ruta of pieza.capas[capa]) {
      if (archivos.has(ruta)) continue;
      const svg = await readFile(new URL(ruta, url), 'utf8');
      archivos.set(ruta, svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>')));
      huellas.push([ruta, createHash('sha256').update(svg).digest('hex')]);
    }
  }
}
const catalogo = new Catalogo(datos, archivos);
const avatar = structuredClone(catalogo.porDefecto);
const svgReal = svgDelAvatar(catalogo, avatar, { id: 'avatar-real-studio' });
const logo = await readFile(new URL('../../../app/public/img/logo-kme.svg', import.meta.url), 'utf8');
const vistaActual = await readFile(new URL('js/kme-vista-visual.js', base), 'utf8');
const bloqueIconos = vistaActual.split('const trazosIconos={')[1]?.split('\n  };')[0];
if (!bloqueIconos) throw new Error('No se encuentra el bloque de iconos vigente');
const iconos = new Map([...bloqueIconos.matchAll(/^\s*(\w+):'([^']+)'/gm)].map(m => [m[1], m[2]]));
const categorias = [['cara','Cara'], ['ojos','Ojos'], ['expresion','Boca y mejillas'], ['maquillaje','Maquillaje'], ['cabello','Cabello'], ['cuerpo','Cuerpo'], ['ropa','Ropa'], ['accesorios','Accesorios'], ['marcos','Marcos']];
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const icono = id => `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${iconos.get(id) || ''}</svg>`;
const tabs = categorias.map(([id, nombre]) => `<div class="categoria ${id === 'cabello' ? 'elegida' : ''}">${icono(id)}<span>${esc(nombre)}</span>${id === 'cabello' ? '<b aria-label="Seleccionado">✓</b>' : ''}</div>`).join('');
const pelos = ['mono', 'bob', 'corto', 'cortinas-textura', 'doble-mono-lazos', 'trenza-lateral'];
const miniaturas = pelos.map((id, i) => {
  const pieza = catalogo.pieza('pelo.estilo', id);
  if (!pieza) throw new Error('Falta peinado real: ' + id);
  const a = structuredClone(avatar);
  a.pelo.estilo = id;
  const svg = svgDelAvatar(catalogo, a, {
    id: `miniatura-real-${i}`,
    soloCapas: ['pelo_atras', 'cabeza', 'maquillaje', 'ojos', 'maquillaje_detalles', 'cejas', 'boca', 'pelo_frente'],
    recorte: '30 5 340 295'
  });
  return `<figure class="miniatura ${id === avatar.pelo.estilo ? 'elegida' : ''}">${id === avatar.pelo.estilo ? '<b class="marca-seleccion">✓</b>' : ''}${svg}<figcaption>${esc(pieza.nombre)}</figcaption></figure>`;
}).join('');
const swatches = catalogo.paleta('pelo').map(c => `<span class="color ${c === avatar.pelo.color ? 'activo' : ''}" style="--muestra:${c}" title="${esc(datos.nombresColor[c] || c)}">${c === avatar.pelo.color ? '<b>✓</b>' : ''}</span>`).join('');
const pincelada = `<svg class="pincelada" aria-hidden="true" viewBox="0 0 600 540" preserveAspectRatio="none"><g fill="#e83475"><path d="M13 381L539 77L523 112L575 86L558 125L585 115L542 159L562 153L487 215L536 191L80 478L91 446L29 471L42 429L8 440L68 391Z"/><path d="M38 363L485 97L472 116L59 376Z" opacity=".45"/><path d="M115 473L526 225L512 248L137 480Z" opacity=".38"/></g><g stroke="#fffdf9" stroke-width="2" opacity=".36"><path d="M22 403L566 105M40 423L539 126M87 453L532 184M151 453L490 237"/></g></svg>`;
const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>K-ME Studio · Mockup con avatar real</title>
<style>
:root{--papel:#f7f3ef;--panel:#fffdf9;--rosa:#e83475;--lavanda:#c8b0f0;--tinta:#000;--linea:#d8cfd1;color:var(--tinta);font:16px/1.4 'Segoe UI',Arial,sans-serif;background:var(--papel)}
*{box-sizing:border-box}body{margin:0}.nota-maqueta{padding:8px 28px;background:var(--panel);font-size:12px;border-bottom:1px solid var(--linea);display:flex;gap:18px;justify-content:space-between}.nota-maqueta strong{font-weight:800}header{height:76px;background:var(--tinta);color:var(--panel);display:flex;align-items:center;padding:10px 36px;gap:26px}.marca{display:flex;gap:12px;align-items:center}.marca>svg{width:34px;height:49px;display:block}.marca span{font-size:22px;letter-spacing:-.04em;font-weight:800}.nav{display:flex;gap:24px;align-items:center;margin-left:auto}.nav span{padding:8px 2px;font-size:15px;font-weight:650}.nav .actual{border-bottom:4px solid var(--rosa)}.ambiente{margin-left:24px;font-size:13px;border:1px solid var(--panel);padding:8px 14px;border-radius:22px}
main{max-width:1380px;margin:0 auto;padding:24px 36px 14px}.intro{display:flex;justify-content:space-between;align-items:center;gap:30px;margin-bottom:20px}.intro h1{font-family:Impact,'Arial Narrow','Arial Black',sans-serif;font-weight:900;letter-spacing:-.025em;font-size:clamp(36px,4.2vw,62px);line-height:1.05;margin:0;position:relative;isolation:isolate}.intro h1:after{content:'';position:absolute;z-index:-1;left:1%;right:0;bottom:-6px;height:6px;background:var(--rosa);transform:rotate(-1deg);clip-path:polygon(0 32%,97% 0,100% 50%,4% 100%)}.lema{font-size:14px;white-space:nowrap;margin:0}.lema:before,.lema:after{content:'//';color:var(--rosa);font-size:27px;font-weight:900;padding:0 10px}
.estudio{display:grid;grid-template-columns:minmax(340px,1fr) minmax(430px,1.1fr);gap:32px;align-items:start}.escena{position:relative;min-width:0;isolation:isolate}.encuadre{height:475px;position:relative;display:grid;place-items:center;isolation:isolate}.pincelada{position:absolute;width:100%;height:100%;inset:0;z-index:-2;pointer-events:none}.pigmento{position:absolute;width:43%;height:64%;left:0;top:6%;background:var(--lavanda);opacity:.22;z-index:-3;clip-path:polygon(13% 1%,86% 7%,96% 20%,82% 32%,99% 44%,81% 65%,90% 88%,65% 94%,43% 88%,20% 99%,9% 76%,18% 63%,0 44%,11% 21%)}.esquina{position:absolute;width:84px;height:76px;pointer-events:none}.esquina.uno{top:22px;left:12px;border-top:8px solid #000;border-left:8px solid #000}.esquina.dos{bottom:18px;right:8px;border-bottom:8px solid #000;border-right:8px solid #000}.trama{position:absolute;bottom:35px;left:8px;width:72px;height:80px;background-image:radial-gradient(#000 1.1px,transparent 1.4px);background-size:7px 7px;z-index:-1;clip-path:polygon(0 0,100% 100%,0 100%)}.avatar{width:min(100%,400px);height:470px;display:grid;place-items:center}.avatar>svg{display:block;width:100%;height:100%;max-height:470px;overflow:visible}.pie-escena{display:flex;justify-content:space-between;align-items:center;font-size:12px;border-top:1px solid #000;padding:10px 4px;margin-top:3px}.pie-escena strong{font-size:13px;font-weight:800}.acciones{display:flex;gap:10px;justify-content:center;margin:13px 0 12px}.boton{border:1.5px solid #000;border-radius:9px;background:var(--panel);font:600 13px 'Segoe UI',Arial,sans-serif;padding:10px 16px;min-height:40px;color:#000;display:inline-flex;gap:8px;align-items:center;justify-content:center}.impresion{border-top:1px solid var(--linea);padding-top:11px;display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:8px}.impresion .boton{font-size:11px;padding:9px 6px}
.herramientas{border:2px solid #000;background:var(--panel);box-shadow:6px 6px 0 #000;min-width:0}.categorias{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;border-bottom:2px solid #000}.categoria{display:flex;align-items:center;justify-content:center;gap:7px;padding:10px 5px;min-height:49px;border:1px solid var(--linea);font-size:12px;font-weight:650;position:relative}.categoria>svg{width:19px;height:19px;flex-shrink:0}.categoria.elegida{background:var(--rosa);border:2px solid #000;padding:9px 4px;font-weight:800}.categoria>b{font-size:15px}.panel{padding:18px 22px 17px}.titulo-panel{display:flex;align-items:center;gap:16px;margin:0 0 15px;font-family:Impact,'Arial Narrow',sans-serif;font-size:34px;font-weight:800;letter-spacing:-.015em}.titulo-panel:after{content:'';height:1px;flex:1;background:#000}.miniaturas{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.miniatura{margin:0;position:relative;border:1px solid var(--linea);border-radius:10px;overflow:hidden;min-width:0;padding:4px 3px 6px;background:var(--panel)}.miniatura>svg{display:block;width:100%;height:106px;overflow:hidden}.miniatura figcaption{font-size:11px;line-height:1.25;min-height:28px;display:flex;align-items:center;justify-content:center;padding:3px 4px 0;text-align:center}.miniatura.elegida{border:2px solid #000;padding:3px 2px 5px}.marca-seleccion{position:absolute;right:0;top:0;background:var(--rosa);padding:0 5px;z-index:1;font-size:15px}.fila-opciones{display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid var(--linea);margin-top:3px;flex-wrap:wrap}.etiqueta{font-size:12px;font-weight:800;min-width:75px}.color{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--muestra);border:1px solid #000}.color.activo{outline:2px solid #000;outline-offset:3px;margin-inline:3px}.color b{font-size:12px;background:var(--panel);color:#000;border-radius:50%;width:17px;height:17px;display:grid;place-items:center}.tratamiento{font-size:12px;border:1px solid #000;border-radius:8px;padding:7px 14px}.tratamiento.actual{background:#000;color:var(--panel)}.guardar{display:block;width:100%;font:800 20px 'Segoe UI',Arial,sans-serif;min-height:46px;background:#000;color:var(--panel);border:0;border-radius:5px;margin-top:16px}.nota-guardado{margin:7px 0 0;font-size:10px;text-align:center}.pie-pagina{display:flex;justify-content:space-between;gap:20px;font-size:11px;margin-top:20px;border-top:1px solid #000;padding-top:12px}.pie-pagina span:first-child{font-weight:800}.nota-inferior{max-width:1380px;margin:0 auto;padding:0 36px 18px;font-size:12px;color:#000}
@media(min-width:1500px){.encuadre{height:530px}.avatar{height:520px}.avatar>svg{max-height:520px}.miniatura>svg{height:124px}.panel{padding:20px 26px}.categoria{min-height:55px;font-size:13px}.titulo-panel{font-size:40px}.fila-opciones{padding:16px 0}.guardar{min-height:52px}}
@media(max-width:850px){main{padding:22px 20px}.estudio{grid-template-columns:1fr}.intro{align-items:flex-start;flex-direction:column;gap:18px}.intro h1{font-size:42px}.encuadre{height:470px}.herramientas{max-width:650px;width:100%;margin:0 auto}header{padding:10px 20px;gap:12px}.marca span{font-size:18px}.nav{gap:12px}.nav span{font-size:12px}.ambiente{margin-left:0;padding:7px;font-size:11px}.lema{font-size:12px}.nota-maqueta{padding-inline:20px}.nota-maqueta span:last-child{display:none}.nota-inferior{padding-inline:20px}}
</style></head><body>
<div class="nota-maqueta"><span><strong>MOCKUP B+C · RECURSOS REALES DEL EDITOR</strong></span><span>Propuesta de entorno · maqueta estática</span></div>
<header><div class="marca">${logo}<span>K-ME STUDIO</span></div><nav class="nav" aria-label="Navegación representada"><span>Mi K-ME</span><span class="actual">Studio</span><span>Connect</span></nav><span class="ambiente">Mi ambiente</span></header>
<main><section class="intro"><h1>Aquí, el fan tiene voz.</h1><p class="lema">Sin <strong>fan</strong> no hay <strong>idol</strong>.</p></section>
<div class="estudio"><section class="escena" aria-label="Avatar actual sin redibujar"><div class="encuadre">${pincelada}<div class="pigmento"></div><i class="esquina uno"></i><i class="esquina dos"></i><i class="trama"></i><div class="avatar">${svgReal}</div></div><div class="pie-escena"><strong>TU AVATAR</strong><span>Composición actual del catálogo</span></div><div class="acciones"><span class="boton">↶ Deshacer</span><span class="boton">↻ Restaurar</span></div><div class="impresion"><span class="boton">Imprimir avatar</span><span class="boton">Photocard 55 × 85 mm</span><span class="boton">Photocard 54 × 86 mm</span></div></section>
<section class="herramientas" aria-label="Panel representado con opciones actuales"><div class="categorias">${tabs}</div><div class="panel"><h2 class="titulo-panel">Cabello</h2><div class="miniaturas">${miniaturas}</div><div class="fila-opciones"><span class="etiqueta">Color</span>${swatches}</div><div class="fila-opciones"><span class="etiqueta">Acabado</span><span class="tratamiento actual">Tinta</span><span class="tratamiento">Acuarela</span><span class="tratamiento">Pinceladas</span></div><button class="guardar" type="button" disabled>Guardar avatar</button><p class="nota-guardado">Acción de integración representada; guardado por cuenta pendiente.</p></div></section></div>
<footer class="pie-pagina"><span>K-ME STUDIO · FUERZA GRÁFICA + GESTO ARTÍSTICO</span><span>Avatar, miniaturas, iconos y logo del proyecto actual.</span></footer></main>
<p class="nota-inferior">Este mockup cambia únicamente la presentación. Los avatares actuales siguen siendo provisionales; no se han retocado ni sustituido por ilustraciones generadas.</p>
</body></html>`;

await writeFile(new URL('KME_STUDIO_MOCKUP_REAL.html', destino), html, 'utf8');
await writeFile(new URL('avatar-real-studio.svg', destino), svgReal, 'utf8');
await writeFile(new URL('MOCKUP_REAL_FUENTES.json', destino), JSON.stringify({
  estado: 'Maqueta estática; no modifica el editor',
  composicion: avatar,
  svgAvatarSha256: createHash('sha256').update(svgReal).digest('hex'),
  recursos: huellas.map(([ruta, sha256]) => ({ ruta, sha256 })),
  miniaturas: pelos,
  nota: 'Se conserva exactamente la salida de svgDelAvatar con la composición por defecto vigente.'
}, null, 2) + '\n', 'utf8');
// Lámina SVG precisa para revisión, sin redibujar el personaje o sus miniaturas.
const t = (x,y,s,n=18,p=400,c='#000',extra='') => `<text x="${x}" y="${y}" font-size="${n}" font-weight="${p}" fill="${c}" ${extra}>${esc(s)}</text>`;
const r = (x,y,w,h,c='#fffdf9',b='#000',radio=0,g=1.5) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radio}" fill="${c}" stroke="${b}" stroke-width="${g}"/>`;
const en = (s,x,y,w,h) => `<svg x="${x}" y="${y}" width="${w}" height="${h}">${s}</svg>`;
let lamina = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 990" role="img" aria-labelledby="titulo-lamina"><title id="titulo-lamina">K-ME Studio: mockup B+C con el avatar real y las piezas actuales</title>${r(0,0,1400,990,'#f7f3ef','none')}<g font-family="Segoe UI,Arial,sans-serif">${t(36,23,'PROPUESTA DE ENTORNO · AVATAR Y OPCIONES DEL EDITOR ACTUAL',13,700)}${t(1364,23,'MAQUETA ESTÁTICA',13,600,'#000','text-anchor="end"')}${r(0,36,1400,78,'#000','none')}${en(logo,36,49,35,50)}${t(85,82,'K-ME STUDIO',23,800,'#fffdf9')}${t(760,82,'Mi K-ME',18,600,'#fffdf9')}${t(910,82,'Studio',18,750,'#fffdf9')}${r(910,96,64,4,'#e83475','none')}${t(1035,82,'Connect',18,600,'#fffdf9')}${t(1255,82,'Mi ambiente',15,600,'#fffdf9')}${t(36,181,'Aquí, el fan tiene voz.',61,900,'#000','font-family="Impact,Arial,sans-serif"')}<path d="M42 198Q270 179 647 191L620 198Q280 188 45 204Z" fill="#e83475"/>${t(1070,180,'Sin fan no hay idol.',19,750)}<path d="M1045 164L1035 180M1058 164L1048 180M1315 164L1305 180M1328 164L1318 180" stroke="#e83475" stroke-width="5" stroke-linecap="round"/>`;
lamina += `<g transform="translate(36 229) scale(1.02)">${pincelada.replace('<svg class="pincelada"','<svg width="600" height="540"') }<path d="M12 80L95 45L180 76L168 154L210 205L170 276L182 386L85 422L15 390L31 278L6 197Z" fill="#c8b0f0" opacity=".2"/><path d="M18 91V12H101M499 453V518H576" fill="none" stroke="#000" stroke-width="8"/></g>`;
lamina += en(svgReal,112,235,440,528);
lamina += `<path d="M40 781H650" stroke="#000"/>${t(42,809,'TU AVATAR',18,800)}${t(650,809,'Composición actual, sin redibujar',14,400,'#000','text-anchor="end"')}${r(124,832,155,43,'#fffdf9','#000',8)}${t(143,860,'↶ Deshacer',16,650)}${r(296,832,155,43,'#fffdf9','#000',8)}${t(313,860,'↻ Restaurar',16,650)}${t(55,910,'Imprimir avatar',14,700)}${t(240,910,'Photocard 55 × 85 mm',14,600)}${t(455,910,'Photocard 54 × 86 mm',14,600)}`;
lamina += r(700,228,664,675,'#fffdf9','#000',0,2.5);
for (let i=0;i<categorias.length;i++) {
  const [id,nombre]=categorias[i],x=700+(i%3)*221.33,y=228+Math.floor(i/3)*48;
  lamina += r(x,y,221.33,48,id==='cabello'?'#e83475':'#fffdf9','#d8cfd1');
  lamina += en(icono(id),x+17,y+13,22,22)+t(x+49,y+30,nombre,16,id==='cabello'?800:600)+(id==='cabello'?t(x+193,y+30,'✓',18,800):'');
}
lamina += `<path d="M700 372H1364" stroke="#000" stroke-width="2"/>${t(724,415,'Cabello',39,850,'#000','font-family="Impact,Arial,sans-serif"')}<path d="M875 403H1340" stroke="#000"/>`;
for (let i=0;i<pelos.length;i++) {
  const id=pelos[i],pieza=catalogo.pieza('pelo.estilo',id),a=structuredClone(avatar);
  a.pelo.estilo=id;
  const mini=svgDelAvatar(catalogo,a,{id:`lamina-mini-${i}`,soloCapas:['pelo_atras','cabeza','maquillaje','ojos','maquillaje_detalles','cejas','boca','pelo_frente'],recorte:'30 5 340 295'});
  const x=724+(i%3)*208,y=433+Math.floor(i/3)*138;
  lamina += r(x,y,196,127,'#fffdf9',id===avatar.pelo.estilo?'#000':'#d8cfd1',9,id===avatar.pelo.estilo?2.5:1);
  lamina += en(mini,x+9,y+3,178,95)+t(x+98,y+116,pieza.nombre.length>24?pieza.nombre.slice(0,23)+'…':pieza.nombre,12,550,'#000','text-anchor="middle"');
  if(id===avatar.pelo.estilo)lamina += r(x+172,y,24,23,'#e83475','none')+t(x+178,y+17,'✓',15,800);
}
lamina += `<path d="M724 721H1340" stroke="#d8cfd1"/>${t(724,755,'Color',17,800)}`;
catalogo.paleta('pelo').forEach((c,i)=>{
  const x=870+i*70;
  lamina += `<circle cx="${x}" cy="749" r="18" fill="${c}" stroke="#000"/>`;
  if(c===avatar.pelo.color)lamina += `<circle cx="${x}" cy="749" r="9" fill="#fffdf9"/>${t(x,754,'✓',13,800,'#000','text-anchor="middle"')}`;
});
lamina += `${t(724,803,'Acabado',17,800)}${r(843,777,116,36,'#000','#000',7)}${t(878,802,'Tinta',15,700,'#fffdf9')}${r(975,777,140,36,'#fffdf9','#000',7)}${t(1001,802,'Acuarela',15,600)}${r(1131,777,192,36,'#fffdf9','#000',7)}${t(1171,802,'Pinceladas',15,600)}${r(724,831,616,43,'#000','none',4)}${t(1032,861,'Guardar avatar',23,800,'#fffdf9','text-anchor="middle"')}${t(1032,890,'Acción representada · guardado por cuenta pendiente',12,400,'#000','text-anchor="middle"')}<path d="M36 937H1364" stroke="#000"/>${t(36,964,'B+C · FUERZA GRÁFICA + GESTO ARTÍSTICO',13,800)}${t(1364,964,'Personaje y miniaturas reales. Diseño de avatar todavía provisional.',13,400,'#000','text-anchor="end"')}</g></svg>`;
await writeFile(new URL('KME_STUDIO_MOCKUP_REAL.svg', destino),lamina,'utf8');
console.log(JSON.stringify({ archivos: ['KME_STUDIO_MOCKUP_REAL.html', 'KME_STUDIO_MOCKUP_REAL.svg', 'avatar-real-studio.svg', 'MOCKUP_REAL_FUENTES.json'], avatar: 'Salida exacta del renderizador vigente, composición por defecto', peinadosReales: pelos.length, recursosLeidos: archivos.size }, null, 2));

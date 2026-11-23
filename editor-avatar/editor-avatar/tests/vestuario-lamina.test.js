import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { EditorVisual } from '../js/kme-editor-visual.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { montarEditorVisual } from '../js/kme-vista-visual.js';
import { documentoVisual } from './helpers/dom-visual.js';
const url = new URL('../datos/kme.json', import.meta.url);
const modelos = ['cargo-beat','denim-layer','school-remix','racing-pop','pocket-pop','ribbon-punk','denim-star','stage-noir'];
const pelos = ['cortinas-textura','coleta-ondas','doble-mono-lazos','trenza-lateral','media-melena-ondas'];
async function cargar() {
  const d=JSON.parse(await readFile(url,'utf8')), archivos=new Map();
  for(const lista of Object.values(d.piezas))for(const p of lista)for(const capa in p.capas){
    p.capas[capa]=[p.capas[capa]].flat();
    for(const ruta of p.capas[capa]){const s=await readFile(new URL(ruta,url),'utf8');archivos.set(ruta,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}
  }
  return new Catalogo(d,archivos);
}
test('Los ocho looks de la lámina ofrecen parte superior e inferior en tres anchuras sin retirar prendas anteriores',async()=>{
  const c=await cargar();
  for(const ruta of ['ropa.arriba','ropa.abajo'])for(const modelo of modelos){
    const variantes=c.piezas(ruta).filter(p=>p.familia===modelo);
    assert.equal(variantes.length,3,`${ruta}: falta ${modelo}`);
    assert.deepEqual(new Set(variantes.map(p=>p.cuerpoCompatible)),new Set(['relajado','recto','amplio']));
    assert.equal(new Set(variantes.map(p=>c.archivos.get(p.capas[ruta==='ropa.arriba'?'ropa_arriba':'ropa_abajo'][0]))).size,3);
  }
  for(const id of ['camiseta','chaqueta','sudadera'])assert.ok(c.pieza('ropa.arriba',id));
  for(const id of ['cargo','falda','bermudas'])assert.ok(c.pieza('ropa.abajo',id));
});
test('Combinar los ocho looks y cambiar anchura conserva ambas prendas, un solo par de piernas y permite deshacer',async()=>{
  const c=await cargar();
  for(const superior of modelos)for(const inferior of modelos){
    const e=new EditorVisual(c);
    e.elegirPieza('ropa.arriba',`${superior}-arriba-medio`);
    e.elegirPieza('ropa.abajo',`${inferior}-abajo-medio`);
    for(const [cuerpo,talla] of [['relajado','delgado'],['recto','medio'],['amplio','grueso']]){
      e.elegirPieza('cuerpo',cuerpo);
      assert.equal(e.avatar.ropa.arriba,`${superior}-arriba-${talla}`);
      assert.equal(e.avatar.ropa.abajo,`${inferior}-abajo-${talla}`);
      const svg=svgDelAvatar(c,e.avatar);
      assert.equal((svg.match(/data-parte="piernas"/g)||[]).length,1);
      assert.equal((svg.match(/data-parte="calzado"/g)||[]).length,1);
    }
    e.deshacer();assert.equal(e.avatar.cuerpo,'recto');
  }
});
test('El ombligo se sugiere en la piel visible con top corto y cintura alta o baja; se oculta con prenda larga y los colores son independientes',async()=>{
  const c=await cargar(), e=new EditorVisual(c);
  e.elegirPieza('ropa.arriba','denim-star-arriba-medio');
  e.elegirPieza('ropa.abajo','denim-star-abajo-medio');
  let svg=svgDelAvatar(c,e.avatar);
  assert.match(svg,/data-parte="ombligo"/);
  assert.match(svg,/data-parte="abdomen"/);
  assert.match(svg,/class="f-arriba"/);assert.match(svg,/class="f-abajo"/);
  e.elegirPieza('ropa.abajo','ribbon-punk-abajo-medio');
  svg=svgDelAvatar(c,e.avatar);
  const ombligo=svg.match(/<circle data-parte="ombligo"[^>]*>/)?.[0];
  assert.ok(ombligo,'El top deja abdomen visible incluso con cintura alta');
  const y=Number(ombligo.match(/cy="([^"]+)"/)[1]);
  const radio=Number(ombligo.match(/r="([^"]+)"/)[1]);
  assert.ok(y+radio<c.pieza('ropa.abajo',e.avatar.ropa.abajo).cinturaY,'El ombligo queda entero por encima de la cintura');
  e.elegirPieza('ropa.abajo','denim-star-abajo-medio');
  e.elegirPieza('ropa.arriba','stage-noir-arriba-medio');
  assert.doesNotMatch(svgDelAvatar(c,e.avatar),/data-parte="ombligo"/);
});
test('Cinco peinados inspirados en la lámina tienen capas trasera y frontal distintas, recoloreables, conservando los tres anteriores',async()=>{
  const c=await cargar();
  for(const id of pelos){
    const p=c.pieza('pelo.estilo',id);assert.ok(p,`Falta ${id}`);
    for(const capa of ['pelo_atras','pelo_frente']){
      const svg=c.archivos.get(p.capas[capa][0]);assert.ok(svg);assert.match(svg,/class="f-pelo(?:-trasero)?"/);
      assert.doesNotMatch(svg,/<image|<script|https?:\/\//);
    }
  }
  for(const id of ['mono','bob','corto'])assert.ok(c.pieza('pelo.estilo',id));
});
test('Las nuevas prendas y el cabello se eligen con los botones del editor, conservan el color y se deshacen',async()=>{
  const c=await cargar(),doc=documentoVisual(),vista=montarEditorVisual(doc,c);
  doc.buscar('Categoría: Ropa').click();
  const prenda=c.piezas('ropa.arriba').find(p=>p.familia==='cargo-beat'&&p.cuerpoCompatible===vista.estado.avatar.cuerpo);
  assert.ok(prenda,'Falta Cargo Beat para el cuerpo actual');
  doc.buscar('Parte superior: '+prenda.nombre).click();
  assert.equal(vista.estado.avatar.ropa.arriba,prenda.id);
  doc.buscar('Categoría: Cabello').click();
  const color=vista.estado.avatar.pelo.color,antes=vista.estado.avatar.pelo.estilo;
  doc.buscar('Peinado: Trenza lateral').click();
  assert.equal(vista.estado.avatar.pelo.estilo,'trenza-lateral');assert.equal(vista.estado.avatar.pelo.color,color);
  vista.estado.deshacer();assert.equal(vista.estado.avatar.pelo.estilo,antes);
});

// Muestreo del contorno real para detectar huecos entre torso y cintura.
function poligono(d,escala){
  const t=d.match(/[MLQCZ]|-?\d*\.?\d+/g),puntos=[];let i=0,p=[0,0],inicio;
  const n=()=>Number(t[i++]),sumar=q=>puntos.push([200+(q[0]-200)*escala,q[1]]);
  while(i<t.length){
    const cmd=t[i++];
    if(cmd==='M'||cmd==='L'){p=[n(),n()];sumar(p);if(cmd==='M')inicio=p;}
    else if(cmd==='C'||cmd==='Q'){
      const s=p,a=[n(),n()],b=[n(),n()],e=cmd==='C'?[n(),n()]:b;
      for(let k=1;k<=30;k++){
        const v=k/30,u=1-v;
        sumar(cmd==='C'?[u**3*s[0]+3*u*u*v*a[0]+3*u*v*v*b[0]+v**3*e[0],u**3*s[1]+3*u*u*v*a[1]+3*u*v*v*b[1]+v**3*e[1]]:[u*u*s[0]+2*u*v*a[0]+v*v*b[0],u*u*s[1]+2*u*v*a[1]+v*v*b[1]]);
      }p=e;
    }else if(cmd==='Z'){p=inicio;sumar(p);}else assert.fail('Contorno no compatible: '+cmd);
  }return puntos;
}
function dentro(p,x,y){let r=false;for(let i=0,j=p.length-1;i<p.length;j=i++){
  const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])r=!r;
}return r;}
test('Las 192 combinaciones nuevas de prendas y anchura unen torso y cintura sin huecos, incluido el abdomen de los tops',async()=>{
  const c=await cargar();let casos=0;
  for(const superior of modelos)for(const inferior of modelos)for(const [talla,escala] of [['delgado',.88],['medio',1],['grueso',1.15]]){
    const e=new EditorVisual(c);e.elegirPieza('ropa.arriba',`${superior}-arriba-${talla}`);e.elegirPieza('ropa.abajo',`${inferior}-abajo-${talla}`);
    const capas=c.contenido(e.avatar),cintura=c.pieza('ropa.abajo',e.avatar.ropa.abajo).cinturaY;
    const contorno=(svg,parte)=>{const d=svg.match(new RegExp('<path[^>]*data-parte="'+parte+'"[^>]*d="([^"]+)"'))?.[1];return d?poligono(d,escala):[];};
    const top=contorno(capas.ropa_arriba,'prenda-superior'),piel=contorno(capas.ropa_arriba,'abdomen'),abajo=contorno(capas.ropa_abajo,'prenda');
    for(let x=185;x<=215;x+=3)for(let y=cintura-3;y<=cintura+3;y++)assert.ok(dentro(top,x,y)||(y<cintura&&dentro(piel,x,y))||dentro(abajo,x,y),`${superior}/${inferior}/${talla}: hueco en ${x},${y}`);
    casos++;
  }assert.equal(casos,192);
});

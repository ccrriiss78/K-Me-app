import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Calcula el contorno del dibujo; no se limita a buscar coordenadas esperadas.
function puntos(d) {
  const t=d.match(/[MLQCZ]|-?\d*\.?\d+/g),r=[];let i=0,p=[0,0],inicio;
  while(i<t.length){const c=t[i++],n=()=>Number(t[i++]);
    if(c==='M'||c==='L'){p=[n(),n()];r.push(p);if(c==='M')inicio=p;}
    else if(c==='Q'){const a=[n(),n()],b=[n(),n()],s=p;for(let k=1;k<=100;k++){const q=k/100,u=1-q;r.push([u*u*s[0]+2*u*q*a[0]+q*q*b[0],u*u*s[1]+2*u*q*a[1]+q*q*b[1]]);}p=b;}
    else if(c==='C'){const a=[n(),n()],b=[n(),n()],e=[n(),n()],s=p;for(let k=1;k<=100;k++){const q=k/100,u=1-q;r.push([u**3*s[0]+3*u*u*q*a[0]+3*u*q*q*b[0]+q**3*e[0],u**3*s[1]+3*u*u*q*a[1]+3*u*q*q*b[1]+q**3*e[1]]);}p=e;}
    else if(c==='Z'){r.push(inicio);p=inicio;}else assert.fail('Contorno no compatible');
  }return r;
}
function intervalo(p,y){
  const xs=[];for(let i=0,j=p.length-1;i<p.length;j=i++){
    const a=p[j],b=p[i];if((a[1]>y)!==(b[1]>y))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));
  }assert.ok(xs.length>=2);return [Math.min(...xs),Math.max(...xs)];
}
test('Ambas orejas se solapan con cada rostro y conservan una parte visible, sin huecos en la unión',async()=>{
  for(const forma of ['redondo','ovalado','cuadrado']){
    const svg=await readFile(new URL(`../assets/kme/cabeza/${forma}.svg`,import.meta.url),'utf8');
    const paths=[...svg.matchAll(/<path\b[^>]*>/g)].map(x=>x[0]);
    const atributo=s=>s.match(/\bd="([^"]+)"/)[1];
    const nuevos=paths.filter(p=>/data-parte="oreja-/.test(p));
    const orejas=nuevos.length?nuevos.map(atributo):atributo(paths[0]).match(/M[^M]+/g);
    const cara=paths.find(p=>/data-parte="cara"/.test(p))||paths[1];
    const contorno=puntos(atributo(cara));
    assert.equal(orejas.length,2);
    for(const [lado,d]of orejas.entries())for(const y of [192,200,210]){
      const o=intervalo(puntos(d),y),c=intervalo(contorno,y);
      const union=Math.min(o[1],c[1])-Math.max(o[0],c[0]);
      assert.ok(union>=2,`${forma}, oreja ${lado}, altura ${y}: queda separada o apenas toca el rostro`);
      const visible=lado===0?c[0]-o[0]:o[1]-c[1];
      assert.ok(visible>=2 && visible<=22,`${forma}: oreja oculta o excesivamente separada`);
    }
    for(const p of nuevos)assert.match(p,/class="f-piel"/);
    assert.ok(svg.indexOf('data-parte="oreja-')<svg.indexOf('data-parte="cara"'),'El rostro debe tapar la raíz de las orejas');
  }
});

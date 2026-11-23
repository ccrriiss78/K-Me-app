import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
// Muestrea el contorno para detectar estrechamientos y entrantes de muñeca.
function contorno(d){
  const t=d.match(/[MCZ]|-?\d*\.?\d+/g),p=[];let i=0,actual;
  while(i<t.length){
    const comando=t[i++],num=()=>Number(t[i++]);
    if(comando==='M'){actual=[num(),num()];p.push(actual);}
    else if(comando==='C'){
      const a=[num(),num()],b=[num(),num()],e=[num(),num()],s=actual;
      for(let k=1;k<=20;k++){const u=k/20,v=1-u;p.push([v**3*s[0]+3*v*v*u*a[0]+3*v*u*u*b[0]+u**3*e[0],v**3*s[1]+3*v*v*u*a[1]+3*v*u*u*b[1]+u**3*e[1]]);}actual=e;
    }
  }return p.slice(0,-1);
}
test('La opción de brazo 1 tiene un contorno simple convexo sin dedos ni estrechamientos de muñeca en todas las prendas',async()=>{
  const url=new URL('../datos/kme.json',import.meta.url),d=JSON.parse(await readFile(url,'utf8'));
  const rutas=new Set(d.piezas['ropa.arriba'].flatMap(p=>[p.capas.ropa_arriba].flat()));
  for(const ruta of rutas){
    const svg=await readFile(new URL(ruta,url),'utf8');
    for(const lado of ['izquierdo','derecho']){
      const tag=svg.match(new RegExp('<path[^>]*data-parte="brazo-'+lado+'"[^>]*>'))?.[0];assert.ok(tag);
      const brazo=tag.match(/\bd="([^"]+)"/)[1],p=contorno(brazo),giros=[];
      for(let i=0;i<p.length;i++){
        const a=p[i],b=p[(i+1)%p.length],c=p[(i+2)%p.length],z=(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);
        if(Math.abs(z)>.01)giros.push(Math.sign(z));
      }
      assert.ok(giros.length>0);assert.equal(new Set(giros).size,1,ruta+': brazo cilíndrico sin entrantes');
    }
  }
});

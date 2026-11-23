// Ráster de las superficies SVG para comprobar conexiones reales entre piezas.
// Muestrea curvas, aplica los transforms y rellena por líneas horizontales.
const N=400,H=480;
function matriz(texto=''){
  let sx=1,sy=1,tx=0,ty=0;
  for(const m of texto.matchAll(/(translate|scale)\(([^)]+)\)/g)){
    const v=m[2].trim().split(/[ ,]+/).map(Number);
    if(m[1]==='translate'){tx+=sx*v[0];ty+=sy*(v[1]||0);}else {sx*=v[0];sy*=v[1]??v[0];}
  }return {sx,sy,tx,ty};
}
function multiplicar(a,b){return {sx:a.sx*b.sx,sy:a.sy*b.sy,tx:a.tx+a.sx*b.tx,ty:a.ty+a.sy*b.ty};}
function contornos(d){
  const t=d.match(/[MLCQZHV]|-?\d*\.?\d+/g)||[],r=[];let i=0,p=[0,0],s,pol;
  const n=()=>Number(t[i++]);
  while(i<t.length){const cmd=t[i++];
    if(cmd==='M'){p=[n(),n()];s=p;pol=[p];r.push(pol);}
    else if(cmd==='L'){p=[n(),n()];pol.push(p);}
    else if(cmd==='H'){p=[n(),p[1]];pol.push(p);}
    else if(cmd==='V'){p=[p[0],n()];pol.push(p);}
    else if(cmd==='C'||cmd==='Q'){
      const antes=p,a=[n(),n()],b=[n(),n()],e=cmd==='C'?[n(),n()]:b;
      for(let k=1;k<=24;k++){const v=k/24,u=1-v;pol.push(cmd==='C'?[u**3*antes[0]+3*u*u*v*a[0]+3*u*v*v*b[0]+v**3*e[0],u**3*antes[1]+3*u*u*v*a[1]+3*u*v*v*b[1]+v**3*e[1]]:[u*u*antes[0]+2*u*v*a[0]+v*v*b[0],u*u*antes[1]+2*u*v*a[1]+v*v*b[1]]);}p=e;
    }else if(cmd==='Z'){pol.push(s);p=s;}else throw new Error('Comando no soportado: '+cmd);
  }return r;
}
export function mascara(svg){
  const datos=new Uint8Array(N*H),pila=[matriz()];
  const attr=(s,k)=>s.match(new RegExp('\\b'+k+'="([^"]*)"'))?.[1];
  for(const tag of svg.match(/<\/?(?:g|path)\b[^>]*>/g)||[]){
    if(tag.startsWith('</g')){pila.pop();continue;}
    const m=multiplicar(pila.at(-1),matriz(attr(tag,'transform')));
    if(tag.startsWith('<g')){pila.push(m);continue;}
    if(attr(tag,'fill')==='none'||!attr(tag,'d'))continue;
    for(const p of contornos(attr(tag,'d'))){
      const q=p.map(([x,y])=>[x*m.sx+m.tx,y*m.sy+m.ty]);
      const min=Math.max(0,Math.floor(Math.min(...q.map(p=>p[1])))),max=Math.min(H-1,Math.ceil(Math.max(...q.map(p=>p[1]))));
      for(let y=min;y<=max;y++){
        const cruces=[];for(let i=0,j=q.length-1;i<q.length;j=i++){
          const a=q[i],b=q[j];if((a[1]>y+.5)!==(b[1]>y+.5))cruces.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));
        }cruces.sort((a,b)=>a-b);
        for(let k=0;k+1<cruces.length;k+=2)for(let x=Math.max(0,Math.ceil(cruces[k]-.5));x<Math.min(N,cruces[k+1]-.5);x++)datos[y*N+x]=1;
      }
    }
  }return datos;
}
export function unir(...mascaras){const m=new Uint8Array(N*H);for(const a of mascaras)for(let i=0;i<m.length;i++)if(a[i])m[i]=1;return m;}
export function conectados(m,x=200,y=320){
  const visitados=new Uint8Array(m.length),cola=new Int32Array(m.length);let fin=0;
  const inicio=y*N+x;if(m[inicio]){cola[fin++]=inicio;visitados[inicio]=1;}
  for(let i=0;i<fin;i++){const n=cola[i],x=n%N;
    for(const v of [x>0?n-1:-1,x<N-1?n+1:-1,n-N,n+N])if(v>=0&&v<m.length&&m[v]&&!visitados[v]){visitados[v]=1;cola[fin++]=v;}
  }return {contiene:(x,y)=>Boolean(visitados[Math.round(y)*N+Math.round(x)]),sueltos:m.reduce((n,v,i)=>n+(v&&!visitados[i]?1:0),0)};
}

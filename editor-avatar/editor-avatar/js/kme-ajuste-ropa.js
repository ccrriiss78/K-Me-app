// Adapta el bajo de una prenda a la cintura escogida sin mover hombros/sisas.
export function ajustarBajoPrendaKme(svg,cintura,origen=350){
  if(cintura===origen)return svg;
  const y=v=>Number((v<=330?v:330+(v-330)*(cintura-330)/(origen-330)).toFixed(3));
  return svg.replace(/<(path|rect|circle)\b[^>]*\/?\s*>/g,(tag,tipo)=>{
    if(tipo==='path')return tag.replace(/\bd="([^"]+)"/,(_,d)=>{
      const t=d.match(/[MLCQHVZ]|-?\d*\.?\d+/g);let i=0,s='';
      while(i<t.length){const cmd=t[i++];s+=cmd;
        if(cmd==='Z')continue;
        if(cmd==='H'){s+=t[i++]+' ';continue;}
        if(cmd==='V'){s+=y(Number(t[i++]))+' ';continue;}
        const pares=cmd==='C'?3:cmd==='Q'?2:1;
        for(let k=0;k<pares;k++)s+=t[i++]+' '+y(Number(t[i++]))+' ';
      }return `d="${s.trim()}"`;
    });
    if(tipo==='circle')return tag.replace(/\bcy="([^"]+)"/,(_,v)=>`cy="${y(Number(v))}"`);
    const antes=Number(tag.match(/\by="([^"]+)"/)?.[1]||0),alto=Number(tag.match(/\bheight="([^"]+)"/)?.[1]||0);
    return tag.replace(/\by="([^"]+)"/,`y="${y(antes)}"`).replace(/\bheight="([^"]+)"/,`height="${y(antes+alto)-y(antes)}"`);
  });
}

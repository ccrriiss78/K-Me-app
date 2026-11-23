// DOM mínimo para probar los clics del editor sin instalar bibliotecas.
export function documentoVisual(){
  const doc={activeElement:null};
  class Nodo{
    constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.style={};this.attrs={};this.listeners={};this.textContent='';this.innerHTML='';this.disabled=false;}
    append(...n){this.children.push(...n);}replaceChildren(...n){this.children=[...n];this.innerHTML='';}
    setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k];}
    addEventListener(k,f){this.listeners[k]=f;}click(){if(!this.disabled)this.listeners.click?.({currentTarget:this});}
    focus(){doc.activeElement=this;}
  }
  doc.createElement=t=>new Nodo(t);doc.createTextNode=t=>({textContent:t,children:[]});
  const ids=['avatar-grande','selector-bases','categorias','panel-editor','deshacer','restaurar','descargar','estado'];
  const nodos=Object.fromEntries(ids.map(id=>[id,new Nodo('div')]));
  doc.getElementById=id=>nodos[id];
  doc.buscar=label=>{
    const recorrer=n=>n?.getAttribute?.('aria-label')===label?n:(n.children||[]).map(recorrer).find(Boolean);
    return Object.values(nodos).map(recorrer).find(Boolean);
  };
  return doc;
}

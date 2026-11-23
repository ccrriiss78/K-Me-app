// Vista previa de apariencia. La persistencia por cuenta corresponde al backend.
export class AmbienteVisual {
  constructor(doc){
    this.doc=doc;
    this.original={fondo:'#f7f3ef',acento:'#e83475',paneles:'#fffdf9'};
    this.valores={...this.original};
    this.opciones={
      fondo:[{color:'#f7f3ef',nombre:'Papel cálido'},{color:'#f7a9cf',nombre:'Rosa chicle'},{color:'#c8b0f0',nombre:'Lila'},{color:'#afd6f4',nombre:'Cielo'},{color:'#afe0bf',nombre:'Menta'},{color:'#ffc799',nombre:'Melocotón'},{color:'#eef1a2',nombre:'Limón suave'},{color:'#d5d5d5',nombre:'Gris nube'}],
      acento:[{color:'#e83475',nombre:'Fucsia K-ME'},{color:'#8e4cd3',nombre:'Orquídea'},{color:'#2457d6',nombre:'Azul eléctrico'},{color:'#007c91',nombre:'Turquesa'},{color:'#18844a',nombre:'Verde'},{color:'#d0eb39',nombre:'Lima'},{color:'#f6ad19',nombre:'Amarillo pop'},{color:'#e65725',nombre:'Mandarina'},{color:'#ba2741',nombre:'Cereza'},{color:'#30364b',nombre:'Tinta noche'}],
      paneles:[{color:'#fffdf9',nombre:'Marfil'},{color:'#f7a9cf',nombre:'Rosa'},{color:'#c8b0f0',nombre:'Lavanda'},{color:'#afd6f4',nombre:'Azul'},{color:'#afe0bf',nombre:'Menta'},{color:'#f9e3a7',nombre:'Vainilla'},{color:'#d5d5d5',nombre:'Perla'}]
    };this.aplicar();
  }
  elegir(campo,color){
    // Compatibilidad con la primera muestra: se aceptan sin repetirlos en la paleta visible.
    const anteriores={fondo:['#f5edf3','#eef1f7','#edf4f0'],paneles:['#ffffff','#fff4f7','#f4f1fa'],acento:['#296f98','#2e806d','#c15b2b','#3d526b']};
    if(!this.opciones[campo]?.some(o=>o.color===color)&&!anteriores[campo]?.includes(color))throw new Error('Apariencia no disponible');
    this.valores[campo]=color;this.aplicar();
  }
  restaurar(){this.valores={...this.original};this.aplicar();}
  aplicar(){
    const set=(k,v)=>this.doc.documentElement.style.setProperty(k,v),a=this.valores.acento;
    const canal=[1,3,5].map(i=>parseInt(a.slice(i,i+2),16));
    const lineal=canal.map(n=>n/255<=.04045?n/255/12.92:((n/255+.055)/1.055)**2.4);
    const luminancia=.2126*lineal[0]+.7152*lineal[1]+.0722*lineal[2];
    const tinta=(luminancia+.05)/.05>=1.05/(luminancia+.05)?'#000000':'#ffffff';
    const mezcla=(destino,proporcion)=>'#'+canal.map((n,i)=>Math.round(n*(1-proporcion)+destino[i]*proporcion).toString(16).padStart(2,'0')).join('');
    const luminanciaColor=c=>{
      const rgb=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);
      return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
    };
    const suave=mezcla([255,255,255],.9),superficies=[this.valores.fondo,this.valores.paneles,suave];
    const contraste=(x,y)=>(Math.max(x,y)+.05)/(Math.min(x,y)+.05);
    let texto=mezcla([0,0,0],.32);
    for(let p=.32;p<=1.001;p+=.04){
      texto=mezcla([0,0,0],Math.min(p,1));
      if(superficies.every(c=>contraste(luminanciaColor(texto),luminanciaColor(c))>=4.5))break;
    }
    set('--ui-background',this.valores.fondo);set('--ui-panel',this.valores.paneles);set('--ui-accent',a);
    set('--ui-ink','#000000');set('--ui-muted','#000000');
    set('--ui-accent-ink',tinta);set('--ui-accent-soft',suave);set('--ui-accent-text',texto);
  }
}

export function montarAmbienteVisual(doc){
  const ambiente=new AmbienteVisual(doc),panel=doc.getElementById('opciones-ambiente');
  const contenedor=doc.getElementById('mi-ambiente'),abrir=doc.getElementById('abrir-ambiente');
  function cerrar(devolverFoco=true){contenedor.open=false;if(devolverFoco)abrir.focus({preventScroll:true});}
  doc.getElementById('cerrar-ambiente')?.addEventListener('click',()=>cerrar());
  doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&contenedor.open){e.preventDefault();cerrar();}});
  doc.addEventListener('click',e=>{
    if(contenedor.open&&!contenedor.contains(e.target)&&!e.composedPath?.().includes(contenedor))cerrar(false);
  });
  const nombres={fondo:'Fondo general',acento:'Color de acento',paneles:'Tarjetas y paneles'};
  function pintar(){
    const foco=doc.activeElement?.getAttribute('aria-label');panel.replaceChildren();let recuperar;
    const ayuda=doc.createElement('p');ayuda.className='ayuda-ambiente';ayuda.textContent='Los cambios se aplican al instante. Pulsa «Listo» para volver al editor.';panel.append(ayuda);
    for(const campo of Object.keys(nombres)){
      const grupo=doc.createElement('fieldset'),leyenda=doc.createElement('legend');leyenda.textContent=nombres[campo];grupo.append(leyenda);
      const muestras=doc.createElement('div');muestras.className='muestras-ambiente';
      for(const o of ambiente.opciones[campo]){
        const b=doc.createElement('button');b.type='button';b.className='muestra-ambiente';b.title=o.nombre;b.style.backgroundColor=o.color;
        const label=nombres[campo]+': '+o.nombre;b.setAttribute('aria-label',label);b.setAttribute('aria-pressed',String(ambiente.valores[campo]===o.color));
        if(ambiente.valores[campo]===o.color){const marca=doc.createElement('span');marca.textContent='✓';marca.className='marca-color';b.append(marca);}
        b.addEventListener('click',()=>{ambiente.elegir(campo,o.color);pintar();});muestras.append(b);if(label===foco)recuperar=b;
      }grupo.append(muestras);
      const nombreActual=doc.createElement('p');nombreActual.className='nombre-color-ambiente';nombreActual.textContent=ambiente.opciones[campo].find(o=>o.color===ambiente.valores[campo])?.nombre||'Color anterior';grupo.append(nombreActual);panel.append(grupo);
    }
    const reset=doc.createElement('button');reset.type='button';reset.className='restaurar-ambiente';reset.textContent='Restaurar estilo K-ME';
    reset.addEventListener('click',()=>{ambiente.restaurar();pintar();});panel.append(reset);
    const pie=doc.createElement('div');pie.className='pie-ambiente';
    const listo=doc.createElement('button');listo.type='button';listo.className='listo-ambiente';listo.textContent='Listo';listo.setAttribute('aria-label','Listo');listo.addEventListener('click',()=>cerrar());
    pie.append(listo);panel.append(pie);recuperar?.focus({preventScroll:true});
  }pintar();return ambiente;
}

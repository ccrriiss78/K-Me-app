import { leer, escribir } from './utilidades.js';
import { seleccionarPiezaKme } from './kme-ropa.js';
import { marcosDisponibles } from './kme-marcos.js';
import { opcionesMaquillaje, coloresMaquillaje } from './kme-maquillaje.js';
import { grosoresKme } from './kme-grosores.js';
import { estilosMechonesKme, coloresMechonesKme } from './kme-cabello-pinceladas.js';
import { acabadosPeloKme } from './kme-receta.js';
import { normalizarAvatar } from './estado.js';

export class EditorVisual {
  constructor(catalogo){
    this.catalogo=catalogo;this.base=0;this.categoria='ojos';
    this.inicios=catalogo.datos.bases.map(b=>{
      const a=structuredClone(b.avatar),partes=a.ojos.estilo.replace(/^kme-/,'').replace(/-(estrella|punto|sin-brillo)$/,'');
      a.ojos.estilo='kme-'+partes+(partes.endsWith('cerrados')?'-sin-brillo':'-estrella');return a;
    });
    this.avatares=structuredClone(this.inicios);this.historiales=this.inicios.map(()=>[]);
    this.marcos=this.inicios.map(()=>'sin-marco');
  }
  get avatar(){return this.avatares[this.base];}
  get marco(){return this.marcos[this.base];}
  get puedeDeshacer(){return this.historiales[this.base].length>0;}
  get ojos(){
    const pieza=this.catalogo.pieza('ojos.estilo',this.avatar.ojos.estilo);
    if(pieza?.expresionEspecial)return {familia:'redondos',expresion:pieza.expresionEspecial};
    const s=this.avatar.ojos.estilo.replace(/^kme-/,'').replace(/-(estrella|punto|sin-brillo)$/,'');
    const familia=['redondos','almendrados','alargados','dulces','felinos','escenario'].find(f=>s.startsWith(f+'-'))||'redondos';
    const expresion=s.startsWith(familia+'-')?s.slice(familia.length+1):'abiertos';
    return {familia,expresion};
  }
  guardar(){const h=this.historiales[this.base];h.push({avatar:structuredClone(this.avatar),marco:this.marco});if(h.length>60)h.shift();}
  elegirMarco(id){
    if(!marcosDisponibles.some(m=>m.id===id))throw new Error('Marco no disponible');
    if(this.marco===id)return;this.guardar();this.marcos[this.base]=id;
  }
  // Abre un avatar guardado (por ejemplo, el de la cuenta en la app) en la base actual: se completa
  // con los valores por defecto, se trabaja sobre una copia y empieza sin historial.
  cargarAvatar(receta){
    this.avatares[this.base]=normalizarAvatar(structuredClone(receta),this.catalogo.datos.porDefecto);
    this.historiales[this.base]=[];
  }
  cambiarBase(indice){if(!Number.isInteger(indice)||!this.avatares[indice])throw new Error('Base no válida');this.base=indice;}
  elegirPieza(ruta,id){
    if(!this.catalogo.pieza(ruta,id))throw new Error('Pieza no válida');
    if(leer(this.avatar,ruta)===id&&(ruta!=='accesorio'||!this.avatar.accesoriosExtra?.length))return;
    this.guardar();seleccionarPiezaKme(this.catalogo,this.avatar,ruta,id);
    // Elegir un accesorio así lo deja solo, como antes de D071.
    if(ruta==='accesorio')this.avatar.accesoriosExtra=[];
  }
  // VARIOS ACCESORIOS A LA VEZ (D071). Los puestos, del más antiguo al último elegido.
  get accesoriosPuestos(){
    const a=this.avatar,extra=Array.isArray(a.accesoriosExtra)?a.accesoriosExtra:[];
    return [...extra,a.accesorio].filter(id=>id&&id!=='ninguno');
  }
  // Pulsar un accesorio lo pone o lo quita sin tocar los demás; uno de la misma ranura sustituye al
  // que había y «ninguno» los quita todos. El último elegido queda en «accesorio» y los demás, en
  // «accesoriosExtra»: así un avatar con uno solo se guarda igual que antes.
  alternarAccesorio(id){
    const pieza=this.catalogo.pieza('accesorio',id);
    if(!pieza)throw new Error('Accesorio no válido');
    const puestos=this.accesoriosPuestos;
    let nuevos;
    if(id==='ninguno')nuevos=[];
    else if(puestos.includes(id))nuevos=puestos.filter(x=>x!==id);
    else nuevos=[...puestos.filter(x=>this.catalogo.pieza('accesorio',x)?.ranura!==pieza.ranura),id];
    if(id==='ninguno'&&!puestos.length)return;
    this.guardar();
    this.avatar.accesorio=nuevos.at(-1)??'ninguno';
    this.avatar.accesoriosExtra=nuevos.slice(0,-1);
  }
  elegirForma(familia){
    const especial=this.catalogo.pieza('ojos.estilo',this.avatar.ojos.estilo)?.expresionEspecial;
    this.elegirOjos(familia,especial?'abiertos':this.ojos.expresion);
  }
  elegirExpresion(expresion){this.elegirOjos(this.ojos.familia,expresion);}
  elegirGrosorLabios(grosor){this.elegirGrosor('maquillaje.grosorLabios',grosor);}
  elegirAcabadoPelo(acabado){
    if(!acabadosPeloKme.includes(acabado))throw new Error('Acabado no válido');
    if((this.avatar.pelo.acabado||'tinta')===acabado)return;
    this.guardar();this.avatar.pelo.acabado=acabado;
  }
  elegirMechones(estilo){
    if(!estilosMechonesKme.some(([id])=>id===estilo))throw new Error('Mechones no válidos');
    if((this.avatar.pelo.mechones||'sin')===estilo)return;
    this.guardar();this.avatar.pelo.mechones=estilo;
    if(estilo!=='sin')this.avatar.pelo.acabado='pinceladas';
  }
  elegirGrosorCejas(grosor){this.elegirGrosor('grosorCejas',grosor);}
  elegirGrosor(ruta,grosor){
    if(!['maquillaje.grosorLabios','grosorCejas'].includes(ruta)||!grosoresKme.includes(grosor))throw new Error('Grosor no válido');
    if(leer(this.avatar,ruta)===grosor)return;
    this.guardar();escribir(this.avatar,ruta,grosor);
  }
  elegirOjos(familia,expresion){
    const brillo=expresion==='cerrados'?'sin-brillo':'estrella';
    this.elegirPieza('ojos.estilo',`kme-${familia}-${expresion}-${brillo}`);
  }
  elegirColor(ruta,color){
    if(/^pelo\.mechon[123]$/.test(ruta)){
      if(!coloresMechonesKme(this.catalogo).includes(color))throw new Error('Color no válido');
      if(leer(this.avatar,ruta)===color)return;
      this.guardar();escribir(this.avatar,ruta,color);return;
    }
    // colorGorro (lote collage 02): la paleta de la ropa, como el resto de prendas.
    const paletas={'piel':'piel','ojos.color':'ojos','pelo.color':'pelo','ropa.colorArriba':'arriba','ropa.colorAbajo':'abajo','colorGorro':'arriba'};
    if(opcionesMaquillaje.some(opcion=>'maquillaje.'+opcion.color===ruta)){
      if(!coloresMaquillaje(this.catalogo).includes(color))throw new Error('Color no válido');
      if(leer(this.avatar,ruta)===color)return;
      this.guardar();escribir(this.avatar,ruta,color);return;
    }
    if(!paletas[ruta]||!this.catalogo.paleta(paletas[ruta]).includes(color))throw new Error('Color no válido');
    if(leer(this.avatar,ruta)===color)return;
    this.guardar();escribir(this.avatar,ruta,color);
  }
  deshacer(){const previo=this.historiales[this.base].pop();if(previo){this.avatares[this.base]=previo.avatar;this.marcos[this.base]=previo.marco;}}
  restaurar(){this.guardar();this.avatares[this.base]=structuredClone(this.inicios[this.base]);this.marcos[this.base]='sin-marco';}
}

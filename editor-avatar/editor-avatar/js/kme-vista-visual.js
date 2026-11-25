import { EditorVisual } from './kme-editor-visual.js';
import { svgDelAvatar } from './renderizador.js';
import { leer } from './utilidades.js';
import { seleccionarPiezaKme } from './kme-ropa.js';
import { marcosDisponibles, svgConMarco } from './kme-marcos.js';
import { svgPhotocard } from './kme-impresion.js';
import { opcionesMaquillaje, coloresMaquillaje } from './kme-maquillaje.js';
import { estilosMechonesKme, coloresMechonesKme } from './kme-cabello-pinceladas.js';

export function montarEditorVisual(doc,catalogo){
  const estado=new EditorVisual(catalogo),el=id=>doc.getElementById(id);
  const categorias=[['cara','Cara'],['ojos','Ojos'],['expresion','Boca y mejillas'],['maquillaje','Maquillaje'],['cabello','Cabello'],['cuerpo','Cuerpo'],['ropa','Ropa'],['accesorios','Accesorios'],['marcos','Marcos']];
  const trazosIconos={
    cara:'<path d="M6 8Q6 3 12 3T18 8V14Q18 21 12 21T6 14Z"/><path d="M9 11H9.1M15 11H15.1M9 16Q12 19 15 16"/>',
    ojos:'<path d="M2 12Q12 1 22 12Q12 23 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    expresion:'<path d="M3 10Q12 15 21 10Q20 21 12 21Q4 21 3 10Z"/><path d="M5 11Q12 3 19 11"/>',
    maquillaje:'<path d="M3 14Q10 4 20 10M4 14L1 10M16 5L18 2M20 8L23 6"/><path d="M17 17L19 14L21 17L19 20Z"/>',
    cabello:'<path d="M5 20Q1 6 9 3Q22-1 20 20M5 12Q12 10 14 5Q15 12 20 13"/>',
    cuerpo:'<circle cx="12" cy="5" r="3"/><path d="M8 10H16L19 17M8 10L5 17M9 11V20M15 11V20M9 16H15"/>',
    ropa:'<path d="M8 3L3 6L1 11L6 13L7 10V22H17V10L18 13L23 11L21 6L16 3Q12 8 8 3Z"/>',
    accesorios:'<path d="M12 2L15 8L22 9L17 14L18 22L12 18L6 22L7 14L2 9L9 8Z"/>',
    marcos:'<rect x="4" y="5" width="16" height="17" rx="3"/><path d="M9 5V3Q12 0 15 3V5M7 9H17V18H7Z"/>'
  };
  let claves=new Map();
  let maquillajeActivo='sombraEstilo';
  let mechonActivo=1;
  let categoriaPintada=null;
  function nodo(tag,texto,clase){const n=doc.createElement(tag);if(texto)n.textContent=texto;if(clase)n.className=clase;return n;}
  function boton(label,seleccionado,accion,clase='miniatura'){
    const b=nodo('button',null,clase);b.type='button';b.setAttribute('aria-label',label);b.setAttribute('aria-pressed',String(seleccionado));b.title=label;b.dataset.clave=label;claves.set(label,b);
    b.addEventListener('click',()=>{accion();pintar();});return b;
  }
  function miniatura(label,seleccionado,avatar,capas,recorte,accion){
    const b=boton(label,seleccionado,accion);b.innerHTML=svgDelAvatar(catalogo,avatar,{soloCapas:capas,recorte,soloPrendaSuperior:label.startsWith('Parte superior: ')});
    b.append(nodo('span',label.replace(/^[^:]+: /,'')));return b;
  }
  function seccion(titulo){const s=nodo('section',null,'grupo-opciones');s.append(nodo('h3',titulo));el('panel-editor').append(s);return s;}
  function grilla(seccion){const g=nodo('div',null,'miniaturas');seccion.append(g);return g;}
  function colorear(titulo,ruta,colores,tituloVisual=titulo){
    const s=seccion(tituloVisual),g=nodo('div',null,'muestras-color');s.append(g);
    for(const c of colores){
      const nombre=catalogo.datos.nombresColor[c]||'Color de cabello';
      const b=boton(titulo+': '+nombre,leer(estado.avatar,ruta)===c,()=>estado.elegirColor(ruta,c),'muestra-color');
      b.style.backgroundColor=c;
      if(leer(estado.avatar,ruta)===c)b.append(nodo('span','✓','marca-color'));
      g.append(b);
    }
    const elegido=catalogo.datos.nombresColor[leer(estado.avatar,ruta)];if(elegido)s.append(nodo('p',elegido,'color-elegido'));
  }
  function grosor(titulo,ruta,accion){
    const g=nodo('div',null,'selector-maquillaje');
    for(const valor of ['fino','medio','grueso']){
      const nombre=valor[0].toUpperCase()+valor.slice(1);
      const b=boton(titulo+': '+nombre,leer(estado.avatar,ruta)===valor,()=>accion(valor),'opcion-maquillaje');
      b.append(nodo('span',nombre));g.append(b);
    }
    seccion(titulo).append(g);
  }
  function piezas(titulo,ruta,capas,recorte,opciones=catalogo.piezas(ruta)){
    const g=grilla(seccion(titulo));
    for(const p of opciones){
      const a=structuredClone(estado.avatar);seleccionarPiezaKme(catalogo,a,ruta,p.id);
      const label=titulo+': '+p.nombre;
      const actual=leer(estado.avatar,ruta);
      const seleccionada=actual===p.id||(ruta==='ropa.abajo'&&p.anterior===actual);
      // Las opciones de ropa muestran el mismo dibujo en ambos montajes.
      // Elegir la parte inferior no debe sustituir una sudadera o chaqueta.
      const idEleccion=ruta==='ropa.abajo'&&p.anterior&&!catalogo.pieza('ropa.arriba',estado.avatar.ropa.arriba)?.cuerpoCompatible?p.anterior:p.id;
      // Una pieza puede traer su propio encuadre de miniatura (el lightstick está en la mano, no en la cabeza).
      g.append(miniatura(label,seleccionada,a,p.miniatura?.capas||capas,p.miniatura?.recorte||recorte,()=>estado.elegirPieza(ruta,idEleccion)));
    }
  }
  function ojos(){
    const {familia,expresion}=estado.ojos,g=grilla(seccion('Forma'));
    const especial=catalogo.pieza('ojos.estilo',estado.avatar.ojos.estilo)?.expresionEspecial;
    for(const [id,nombre]of [['redondos','Redondos'],['almendrados','Almendrados'],['alargados','Alargados']]){
      const a=structuredClone(estado.avatar);a.ojos.estilo=`kme-${id}-abiertos-estrella`;
      g.append(miniatura('Forma: '+nombre,!especial&&estado.avatar.ojos.estilo.startsWith('kme-')&&familia===id,a,['ojos'],'112 176 176 58',()=>estado.elegirForma(id)));
    }
    const bloqueOjos=nodo('div',null,'grupo-opciones');el('panel-editor').append(bloqueOjos);
    const pruebas=grilla(bloqueOjos);
    for(const [id,nombre]of [['dulces','Dulces'],['felinos','Felinos'],['escenario','Escenario']]){
      const a=structuredClone(estado.avatar);a.ojos.estilo=`kme-${id}-abiertos-estrella`;
      pruebas.append(miniatura('Probar ojos del mockup: '+nombre,familia===id,a,['ojos'],'112 175 176 60',()=>estado.elegirForma(id)));
    }
    const gestos=grilla(seccion('Expresión'));
    for(const [id,nombre]of [['abiertos','Abiertos'],['cerrados','Cerrados'],['guino-izquierdo','Guiño izquierdo'],['guino-derecho','Guiño derecho']]){
      const a=structuredClone(estado.avatar);a.ojos.estilo=`kme-${familia}-${id}-${id==='cerrados'?'sin-brillo':'estrella'}`;
      gestos.append(miniatura('Expresión: '+nombre,estado.avatar.ojos.estilo.startsWith('kme-')&&expresion===id,a,['ojos'],'112 176 176 58',()=>estado.elegirExpresion(id)));
    }
    piezas('Tristeza','ojos.estilo',['ojos','cejas'],'108 152 184 96',catalogo.piezas('ojos.estilo').filter(p=>p.subcoleccion==='tristeza'));
    const grupos=catalogo.datos.gruposPaleta.ojos;
    // Una sola acción de color, con las dos gamas separadas visualmente.
    colorear('Color del iris','ojos.color',grupos.naturales,'Iris · Naturales');
    colorear('Color del iris','ojos.color',grupos.fantasia,'Iris · Fantasía');
    piezas('Cejas','cejas',['cejas'],'110 152 180 38');
    grosor('Grosor de cejas','grosorCejas',valor=>estado.elegirGrosorCejas(valor));
    const antiguos=nodo('details',null,'anteriores');antiguos.append(nodo('summary','Ver ojos anteriores'));
    const rejilla=grilla(antiguos);el('panel-editor').append(antiguos);
    for(const p of catalogo.piezas('ojos.estilo').filter(p=>!['kme-sugeridos','kme-mockup'].includes(p.coleccion))){
      const a=structuredClone(estado.avatar);a.ojos.estilo=p.id;
      rejilla.append(miniatura('Ojos anteriores: '+p.nombre,estado.avatar.ojos.estilo===p.id,a,['ojos'],'112 176 176 58',()=>estado.elegirPieza('ojos.estilo',p.id)));
    }
  }
  function panel(){
    el('panel-editor').replaceChildren();
    el('panel-editor').append(nodo('h2',categorias.find(c=>c[0]===estado.categoria)[1]));
    if(estado.categoria==='marcos'){
      const g=grilla(seccion('Elige tu portaphotocard'));
      for(const m of marcosDisponibles){
        const b=boton('Marco: '+m.nombre,estado.marco===m.id,()=>estado.elegirMarco(m.id),'miniatura miniatura-marco');
        b.innerHTML=svgConMarco(svgDelAvatar(catalogo,estado.avatar),m.id);
        b.append(nodo('span',m.nombre));g.append(b);
      }
      el('panel-editor').append(nodo('p','El marco presenta tu avatar en pantalla. Al imprimir, se utiliza solo la tarjeta con tu personaje.','ayuda-marcos'));
      return;
    }
    if(estado.categoria==='ojos'){ojos();return;}
    if(estado.categoria==='cara'){
      piezas('Rostro','rostro',['cabeza'],'65 65 270 235');colorear('Tono de piel','piel',catalogo.paleta('piel'));
    }else if(estado.categoria==='expresion'){
      piezas('Boca','boca',['boca'],'166 225 68 50');piezas('Mejillas','maquillaje.mejillas',['cabeza','maquillaje'],'80 180 240 95');
    }else if(estado.categoria==='maquillaje'){
      const selector=nodo('div',null,'selector-maquillaje');
      for(const opcion of opcionesMaquillaje){
        const b=boton('Maquillaje: '+opcion.titulo,maquillajeActivo===opcion.campo,()=>{maquillajeActivo=opcion.campo;},'opcion-maquillaje');
        b.append(nodo('span',opcion.titulo));selector.append(b);
      }
      el('panel-editor').append(selector);
      const opcion=opcionesMaquillaje.find(opcion=>opcion.campo===maquillajeActivo);
      const ruta='maquillaje.'+opcion.campo;
      piezas(opcion.titulo,ruta,['cabeza','maquillaje','ojos','maquillaje_detalles','cejas'],'98 168 204 92');
      const seleccion=catalogo.pieza(ruta,leer(estado.avatar,ruta));
      if(seleccion&&Object.keys(seleccion.capas).length&&(opcion.campo!=='mejillas'||seleccion.id==='difuminado')){
        if(opcion.campo==='labios')grosor('Grosor de labios','maquillaje.grosorLabios',valor=>estado.elegirGrosorLabios(valor));
        colorear('Color de '+opcion.titulo.toLowerCase(),'maquillaje.'+opcion.color,coloresMaquillaje(catalogo));
      }
    }else if(estado.categoria==='cabello'){
      piezas('Peinado','pelo.estilo',['pelo_atras','cabeza','pelo_frente'],'35 10 330 360');
      const acabados=grilla(seccion('Acabado del cabello'));
      for(const [id,nombre] of [['pinceladas','Pinceladas B'],['acuarela','Acuarela'],['tinta','Tinta']]){
        const b=boton('Acabado del cabello: '+nombre,(estado.avatar.pelo.acabado||'tinta')===id,()=>estado.elegirAcabadoPelo(id),'opcion-maquillaje');b.append(nodo('span',nombre));acabados.append(b);
      }
      colorear('Color del cabello','pelo.color',catalogo.paleta('pelo'));
      const opciones=grilla(seccion('Mechones'));
      for(const [id,nombre] of estilosMechonesKme){
        const a=structuredClone(estado.avatar);a.pelo.mechones=id;if(id!=='sin')a.pelo.acabado='pinceladas';
        opciones.append(miniatura('Mechones: '+nombre,(estado.avatar.pelo.mechones||'sin')===id,a,['pelo_atras','cabeza','pelo_frente'],'35 10 330 360',()=>estado.elegirMechones(id)));
      }
      if(estado.avatar.pelo.mechones&&estado.avatar.pelo.mechones!=='sin'){
        const cantidad=estado.avatar.pelo.mechones==='frontales'?2:3;if(mechonActivo>cantidad)mechonActivo=1;
        const selector=grilla(seccion('Elige el mechón'));
        for(let i=1;i<=cantidad;i++){
          const b=boton('Editar mechón '+i,mechonActivo===i,()=>{mechonActivo=i;},'opcion-maquillaje');b.append(nodo('span','Mechón '+i));selector.append(b);
        }
        colorear('Color del mechón '+mechonActivo,'pelo.mechon'+mechonActivo,coloresMechonesKme(catalogo));
      }
    }else if(estado.categoria==='cuerpo'){
      piezas('Tamaño','cuerpo',['cuerpo','torso','piernas','ropa_abajo','ropa_arriba'],'90 254 220 190');
    }else if(estado.categoria==='ropa'){
      const compatibles=catalogo.piezas('ropa.arriba').filter(p=>p.cuerpoCompatible===estado.avatar.cuerpo||(!p.cuerpoCompatible&&p.id!=='camiseta'));
      piezas('Parte superior','ropa.arriba',['ropa_arriba'],'100 282 200 100',compatibles);
      colorear('Color de arriba','ropa.colorArriba',catalogo.paleta('arriba'));
      piezas('Parte inferior','ropa.abajo',['piernas','ropa_abajo'],'130 338 140 110',catalogo.piezas('ropa.abajo').filter(p=>p.cuerpoCompatible===estado.avatar.cuerpo));
      colorear('Color de abajo','ropa.colorAbajo',catalogo.paleta('abajo'));
    }else{
      piezas('Accesorio','accesorio',['cabeza','ojos','accesorio'],'65 60 270 215');
      // Un accesorio con color propio (el gorro, lote collage 02) lo elige con la paleta de la ropa.
      const puesto=catalogo.pieza('accesorio',estado.avatar.accesorio);
      if(puesto?.rutaColor)colorear(puesto.tituloColor||'Color del accesorio',puesto.rutaColor,catalogo.paleta('arriba'));
    }
  }
  function pintar(){
    // Vaciar las opciones puede reducir momentáneamente su altura y reiniciar la barra.
    // Guardamos la posición antes de tocar el DOM y la recuperamos al terminar.
    const panelOpciones=el('panel-editor');
    const posicionPanel=categoriaPintada===estado.categoria?(panelOpciones.scrollTop||0):0;
    const pagina=doc.scrollingElement;
    const posicionPagina=pagina?.scrollTop;
    const foco=doc.activeElement?.dataset?.clave;claves=new Map();
    const dibujo=svgDelAvatar(catalogo,estado.avatar,{id:'avatar-principal'});
    const tarjeta=estado.marco==='sin-marco'?svgPhotocard(dibujo,'55x85'):dibujo;
    el('avatar-grande').innerHTML=svgConMarco(tarjeta,estado.marco);
    el('avatar-grande').dataset.marco=estado.marco;
    el('avatar-grande').setAttribute('aria-label','Tu avatar'+(estado.marco==='sin-marco'?' sin marco':' · Marco '+marcosDisponibles.find(m=>m.id===estado.marco).nombre));
    el('selector-bases').replaceChildren();
    catalogo.datos.bases.forEach((b,i)=>{
      const mini=miniatura('Base: '+(i+1),estado.base===i,estado.avatares[i],null,'0 0 400 480',()=>estado.cambiarBase(i));
      el('selector-bases').append(mini);
    });
    el('categorias').replaceChildren();
    for(const [id,nombre]of categorias){
      const b=boton('Categoría: '+nombre,estado.categoria===id,()=>{estado.categoria=id;},'categoria');
      b.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+trazosIconos[id]+'</svg>';
      b.append(nodo('span',nombre));el('categorias').append(b);
    }
    const numero=el('numero-photocard');if(numero)numero.textContent=String(estado.base+1).padStart(2,'0');
    panel();el('deshacer').disabled=!estado.puedeDeshacer;
    el('estado').textContent='';
    claves.get(foco)?.focus({preventScroll:true});
    panelOpciones.scrollTop=posicionPanel;
    if(pagina&&posicionPagina!=null)pagina.scrollTop=posicionPagina;
    categoriaPintada=estado.categoria;
  }
  el('deshacer').addEventListener('click',()=>{estado.deshacer();pintar();});
  el('restaurar').addEventListener('click',()=>{estado.restaurar();pintar();});
  pintar();return {estado,actualizar:pintar};
}

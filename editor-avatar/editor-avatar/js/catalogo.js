// Carga datos/catalogo.json y todas las piezas SVG que menciona.
import { clonar, leer, escribir } from './utilidades.js';
import { ajustarBajoPrendaKme } from './kme-ajuste-ropa.js';

/**
 * Carga el catálogo y precarga las piezas (son archivos pequeños).
 * Las rutas de las piezas se interpretan relativas al archivo del catálogo.
 */
export async function cargarCatalogo(url = 'datos/catalogo.json') {
  const base = new URL(url, document.baseURI);
  const resp = await fetch(base);
  if (!resp.ok) throw new Error(`No se pudo cargar el catálogo (${resp.status}): ${base}`);
  const datos = await resp.json();

  const resolver = ruta => new URL(ruta, base).href;
  const todos = new Set();
  for (const f of datos.fijas) {
    f.archivo = resolver(f.archivo);
    todos.add(f.archivo);
  }
  for (const ruta in datos.piezas) {
    for (const pieza of datos.piezas[ruta]) {
      for (const capa in pieza.capas) {
        const valor = pieza.capas[capa];
        pieza.capas[capa] = (Array.isArray(valor) ? valor : [valor]).map(resolver);
        pieza.capas[capa].forEach(a => todos.add(a));
      }
    }
  }

  const archivos = new Map();
  await Promise.all([...todos].map(async archivo => {
    const r = await fetch(archivo);
    if (!r.ok) throw new Error('Falta la pieza: ' + archivo);
    archivos.set(archivo, interiorSVG(await r.text()));
  }));
  return new Catalogo(datos, archivos);
}

/** Quita la etiqueta <svg> exterior para poder apilar el contenido en otra capa. */
function interiorSVG(texto) {
  const inicio = texto.search(/<svg[\s>]/);
  const finEtiqueta = texto.indexOf('>', inicio);
  const cierre = texto.lastIndexOf('</svg>');
  return texto.slice(finEtiqueta + 1, cierre).trim();
}

// Extrae grupos propios del catálogo y admite grupos interiores.
function extraerGrupo(svg, nombre) {
  if (!/^[a-z_]+$/.test(nombre)) throw new Error('Grupo SVG no válido.');
  const inicio = new RegExp('<g\\b[^>]*data-capa="' + nombre + '"[^>]*>').exec(svg);
  if (!inicio) throw new Error('Falta el grupo SVG: ' + nombre);
  const etiquetas = /<\/?g\b[^>]*>/g;
  etiquetas.lastIndex = inicio.index;
  let profundidad = 0, etiqueta;
  while ((etiqueta = etiquetas.exec(svg))) {
    profundidad += etiqueta[0].startsWith('</') ? -1 : etiqueta[0].endsWith('/>') ? 0 : 1;
    if (profundidad === 0) return svg.slice(inicio.index, etiquetas.lastIndex);
  }
  throw new Error('Grupo SVG sin cerrar: ' + nombre);
}

export class Catalogo {
  constructor(datos, archivos) {
    this.datos = datos;
    this.archivos = archivos;      // url -> contenido SVG
    this.capas = datos.capas;      // orden de dibujo, de atrás hacia delante
    this.porDefecto = datos.porDefecto;
  }

  /** Rutas del avatar que se eligen con piezas: 'pelo.estilo', 'boca'... */
  rutas() { return Object.keys(this.datos.piezas); }
  piezas(ruta) { return this.datos.piezas[ruta] || []; }
  pieza(ruta, id) { return this.piezas(ruta).find(p => p.id === id); }
  paleta(nombre) { return this.datos.paletas[nombre] || []; }
  categorias() { return this.datos.categorias; }

  /** Capas que alguna pieza elegida oculta (por ejemplo, el vestido oculta 'ropa_abajo'). */
  capasOcultas(avatar) {
    const ocultas = new Set();
    for (const ruta of this.rutas()) {
      const p = this.pieza(ruta, leer(avatar, ruta));
      (p?.ocultaCapas || []).forEach(c => ocultas.add(c));
    }
    return ocultas;
  }

  /**
   * Los accesorios puestos (D071): el principal («accesorio») y los demás («accesoriosExtra»), sin
   * repetir y en el orden de sus ranuras (ranurasAccesorio: gorro, auriculares, gafas, pin, mano),
   * de atrás hacia delante. Así el dibujo no depende del orden en que se eligieron.
   */
  accesoriosPuestos(avatar) {
    const orden = this.datos.ranurasAccesorio || [];
    const extra = Array.isArray(avatar.accesoriosExtra) ? avatar.accesoriosExtra : [];
    const vistos = new Set();
    return [avatar.accesorio, ...extra]
      .map(id => this.pieza('accesorio', id))
      .filter(p => p && !vistos.has(p.id) && vistos.add(p.id))
      .sort((a, b) => orden.indexOf(a.ranura) - orden.indexOf(b.ranura));
  }

  /**
   * Qué archivo de la pieza se dibuja, si trae varios (null = todos):
   * - indicePorRostro: según el rostro (los pendientes de Encore cuelgan de la oreja de cada uno);
   * - indiceSinPerfilIntegrado: según el cuerpo, si la prenda de arriba NO es de perfil integrado
   *   (el brazalete de Encore se ancla sobre la camiseta integrada);
   * - indicePorCuerpo: según el cuerpo.
   */
  indiceVariante(p, avatar) {
    if (p.indicePorRostro) return p.indicePorRostro[avatar.rostro] ?? 0;
    const sinPerfil = p.indiceSinPerfilIntegrado && !this.pieza('ropa.arriba', avatar.ropa?.arriba)?.perfilIntegrado;
    return (sinPerfil ? p.indiceSinPerfilIntegrado : p.indicePorCuerpo)?.[avatar.cuerpo];
  }

  /** Devuelve { idCapa: 'contenido SVG' } con las piezas fijas y las elegidas. */
  contenido(avatar) {
    const salida = {};
    const reemplazos = {};
    this.capas.forEach(c => { salida[c.id] = []; });
    for (const f of this.datos.fijas) salida[f.capa]?.push(this.archivos.get(f.archivo));
    const elegidas = this.rutas().filter(ruta => ruta !== 'accesorio').map(ruta => this.pieza(ruta, leer(avatar, ruta)));
    for (const p of [...elegidas, ...this.accesoriosPuestos(avatar)]) {
      if (!p) continue;
      // Un SVG puede reunir ropa y piel, manteniendo la ropa delante de las piernas.
      for (const capa in p.capas) {
        if (!salida[capa]) continue;
        const indice = this.indiceVariante(p, avatar);
        const elegidos = indice == null ? p.capas[capa] : [p.capas[capa][indice]];
        const partes = elegidos.map(a => {
          const svg = this.archivos.get(a);
          return p.gruposPorCapa?.[capa] ? extraerGrupo(svg, p.gruposPorCapa[capa]) : svg;
        });
        if (p.reemplazaCapas?.includes(capa)) reemplazos[capa] = partes;
        else salida[capa].push(...partes);
      }
    }
    // Una sustitución no depende de qué categoría aparezca antes en el catálogo.
    for (const capa in reemplazos) salida[capa] = reemplazos[capa];
    for (const capa of this.capasOcultas(avatar)) salida[capa] = [];
    for (const k in salida) salida[k] = salida[k].join('\n');
    const superior=this.pieza('ropa.arriba',avatar.ropa.arriba);
    if(superior?.perfilIntegrado&&!superior.topCorto){
      salida.ropa_arriba=ajustarBajoPrendaKme(salida.ropa_arriba,this.pieza('ropa.abajo',avatar.ropa.abajo)?.cinturaY||350);
    }
    return salida;
  }

  /**
   * Si la pieza recién elegida en `ruta` quedaría oculta por otra pieza,
   * cambia esa otra por la primera de su lista que sea compatible.
   * Ejemplo: con vestido puesto, elegir una falda cambia el vestido por camiseta.
   */
  resolverConflictos(avatar, ruta) {
    const elegida = this.pieza(ruta, leer(avatar, ruta));
    if (!elegida) return avatar;
    const capas = Object.keys(elegida.capas);
    for (const otra of this.rutas()) {
      if (otra === ruta) continue;
      const p = this.pieza(otra, leer(avatar, otra));
      if (p?.ocultaCapas?.some(c => capas.includes(c))) {
        const alternativa = this.piezas(otra).find(x => !x.ocultaCapas?.some(c => capas.includes(c)));
        if (alternativa) escribir(avatar, otra, alternativa.id);
      }
    }
    return avatar;
  }

  /** true si las piezas de `ruta` están tapadas ahora mismo por otra elección. */
  seccionTapada(avatar, ruta) {
    const ocultas = this.capasOcultas(avatar);
    return this.piezas(ruta).some(p => Object.keys(p.capas).some(c => ocultas.has(c)));
  }

  /** Avatar al azar con las piezas y paletas del catálogo. */
  aleatorio() {
    const azar = lista => lista[Math.floor(Math.random() * lista.length)];
    const a = clonar(this.porDefecto);
    for (const ruta of this.rutas()) escribir(a, ruta, azar(this.piezas(ruta)).id);
    for (const cat of this.categorias()) {
      for (const s of cat.secciones) if (s.tipo === 'colores') escribir(a, s.ruta, azar(this.paleta(s.paleta)));
    }
    return a;
  }
}

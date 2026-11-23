// Vista 3D con Three.js (incluido en vendor/, funciona sin internet).
//
// Cómo está hecho:
//  - El cuerpo, el pelo, la ropa y los accesorios son formas básicas (esferas, cápsulas,
//    cilindros, conos) creadas en código. Cada pieza del catálogo se identifica por su id.
//  - La cara NO se modela: se reutilizan los SVG de maquillaje, ojos y boca del modo 2D
//    y se pegan como textura en la parte delantera de la cabeza.
//  - Aspecto de dibujo: MeshToonMaterial (sombreado por tonos) + contorno oscuro
//    con la técnica del "casco invertido".
//
// Si una pieza nueva del catálogo no tiene versión 3D aquí, simplemente no aparece en 3D.
// Para pasar a modelos de Blender (.glb), mira la sección 3D del README.
import { tono, svgAImagen } from './utilidades.js';

const URL_THREE = new URL('../vendor/three.module.min.js', import.meta.url).href;

/**
 * Crea la vista 3D dentro de `contenedor`.
 * opciones.catalogo  el Catalogo cargado
 * opciones.caraSVG   función (avatar) => SVG de la cara (maquillaje + ojos + boca)
 */
export async function crearVista3D(contenedor, { catalogo, caraSVG }) {
  const T = await import(URL_THREE);

  const canvas = document.createElement('canvas');
  contenedor.appendChild(canvas);
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = T.SRGBColorSpace;

  const escena = new T.Scene();
  const camara = new T.PerspectiveCamera(27, 1, 0.1, 100);
  escena.add(new T.HemisphereLight(0xffffff, 0xcfc4f2, 1.25));
  const sol = new T.DirectionalLight(0xffffff, 1.9);
  sol.position.set(1.6, 3.2, 6);
  escena.add(sol);

  // Degradado de 3 tonos para el sombreado tipo dibujo animado
  const degradado = new T.DataTexture(new Uint8Array([150, 210, 255]), 3, 1, T.RedFormat);
  degradado.minFilter = degradado.magFilter = T.NearestFilter;
  degradado.needsUpdate = true;

  // Contorno: copia de cada malla, un poco hinchada y vista por dentro
  const matContorno = new T.ShaderMaterial({
    uniforms: { grosor: { value: 0.026 }, color: { value: new T.Color(0x3d2f45) } },
    vertexShader: 'uniform float grosor; void main(){ vec3 p = position + normal * grosor; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
    fragmentShader: 'uniform vec3 color; void main(){ gl_FragColor = vec4(color, 1.0); }',
    side: T.BackSide,
  });

  const giro = new T.Group();
  escena.add(giro);
  let avatar3d = null;

  // Textura de la cara: el SVG de la zona 92..308 × 138..282 del lienzo 2D
  const lienzoCara = document.createElement('canvas');
  lienzoCara.width = 768;
  lienzoCara.height = 512;
  const texturaCara = new T.CanvasTexture(lienzoCara);
  texturaCara.colorSpace = T.SRGBColorSpace;
  texturaCara.anisotropy = 4;

  const F = Math.PI / 2;                        // dirección "hacia delante"
  const CARA = { phi0: F - 0.95, phiL: 1.9, theta0: F - 0.44, thetaL: 1.15 };

  // ---------- ayudantes ----------
  const toon = (color, extra = {}) => new T.MeshToonMaterial({ color: new T.Color(color), gradientMap: degradado, ...extra });

  function malla(padre, geometria, material, pos, rot, conContorno = true) {
    const m = new T.Mesh(geometria, material);
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    padre.add(m);
    if (conContorno) m.add(new T.Mesh(geometria, matContorno));
    return m;
  }
  const esfera = (r, sx = 1, sy = 1, sz = 1, seg = 32, anillos = 20) => {
    const g = new T.SphereGeometry(r, seg, anillos);
    if (sx !== 1 || sy !== 1 || sz !== 1) g.scale(sx, sy, sz);
    return g;
  };
  const capsula = (r, largo) => new T.CapsuleGeometry(r, largo, 8, 20);
  const cilindro = (rArriba, rAbajo, alto, abierto = false, seg = 32) => new T.CylinderGeometry(rArriba, rAbajo, alto, seg, 1, abierto);
  const casquete = (r, phi0, phiL, theta0, thetaL) => new T.SphereGeometry(r, 48, 32, phi0, phiL, theta0, thetaL);
  // Punto sobre una esfera de radio r (theta: 0 arriba; phi: F = delante)
  const sobreEsfera = (r, theta, phi) => new T.Vector3(
    -r * Math.cos(phi) * Math.sin(theta), r * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta));

  function rayas(a, b) {
    const c = document.createElement('canvas');
    c.width = 4; c.height = 64;
    const x = c.getContext('2d');
    for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? b : a; x.fillRect(0, i * 8, 4, 8); }
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    t.magFilter = T.NearestFilter;
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(1, 1.4);
    return t;
  }

  let turnoCara = 0;
  function dibujarCara(avatar) {
    const turno = ++turnoCara;
    svgAImagen(caraSVG(avatar)).then(img => {
      if (turno !== turnoCara) return;
      const x = lienzoCara.getContext('2d');
      x.clearRect(0, 0, lienzoCara.width, lienzoCara.height);
      x.drawImage(img, 0, 0, lienzoCara.width, lienzoCara.height);
      texturaCara.needsUpdate = true;
    }).catch(() => {});
  }

  // ---------- pelo (en coordenadas de la cabeza: esfera de radio 1) ----------
  function pelo(cabeza, avatar, mat) {
    const M = (g, pos, rot, contorno = true) => malla(cabeza, g, mat, pos, rot, contorno);
    const gorro = (r, hasta) => casquete(r, 0, Math.PI * 2, 0, hasta);
    const nuca = (r, abertura, hasta) => casquete(r, F + abertura, Math.PI * 2 - 2 * abertura, 0, hasta);
    const flequillo = (r, medio, desde, hasta) => casquete(r, F - medio, 2 * medio, desde, hasta - desde);
    const puntas = (r, theta, a, b, n, rad) => {
      for (let i = 0; i < n; i++) {
        const p = sobreEsfera(r, theta - 0.04, F + a + (b - a) * i / (n - 1));
        M(esfera(rad * 0.85, 1, 1.9, 0.5), [p.x, p.y, p.z], null, false);
      }
    };
    switch (avatar.pelo.estilo) {
      case 'corto':
        M(gorro(1.09, 1.12)); M(nuca(1.1, 1.0, 1.95)); M(flequillo(1.1, 0.9, 0.85, 1.18));
        puntas(1.08, 1.2, -0.75, 0.45, 5, 0.11);
        break;
      case 'bob':
        M(gorro(1.1, 1.12)); M(nuca(1.14, 0.95, 2.4)); M(flequillo(1.11, 0.95, 0.85, 1.3));
        puntas(1.09, 1.31, -0.8, 0.8, 7, 0.11);
        break;
      case 'largo':
        M(gorro(1.1, 1.12)); M(nuca(1.13, 1.0, 2.25)); M(flequillo(1.11, 0.95, 0.85, 1.22));
        puntas(1.09, 1.24, -0.85, 0.35, 5, 0.12);
        M(esfera(1, 0.95, 1.05, 0.38), [0, -1.0, -0.6]);
        for (const lado of [-1, 1]) M(capsula(0.17, 0.8), [lado * 0.88, -0.85, 0.32], [0, 0, lado * -0.08]);
        break;
      case 'coletas':
        M(gorro(1.09, 1.12)); M(nuca(1.1, 1.0, 1.9)); M(flequillo(1.1, 0.95, 0.85, 1.3));
        puntas(1.08, 1.31, -0.8, 0.8, 7, 0.11);
        for (const lado of [-1, 1]) {
          M(capsula(0.2, 0.75), [lado * 1.2, -0.42, -0.2], [0, 0, lado * 0.22]);
          malla(cabeza, esfera(0.13), toon('#ff7aa8'), [lado * 1.02, 0.3, -0.08]);
        }
        break;
      case 'mono':
        M(gorro(1.09, 1.02)); M(nuca(1.1, 1.0, 1.85)); M(esfera(0.46), [0, 1.05, -0.28]);
        for (const lado of [-1, 1]) M(capsula(0.08, 0.5), [lado * 0.74, -0.2, 0.7], [0, 0, lado * 0.1]);
        break;
      case 'puntas': {
        M(gorro(1.09, 1.12)); M(nuca(1.1, 1.0, 1.85));
        const cono = new T.ConeGeometry(0.24, 0.62, 10), arriba = new T.Vector3(0, 1, 0);
        const pincho = (theta, phi, caida = 0) => {
          const n = sobreEsfera(1, theta, phi).normalize();
          const d = n.clone().add(new T.Vector3(0, -caida, 0)).normalize();
          const o = M(cono, [n.x * 0.98 + d.x * 0.28, n.y * 0.98 + d.y * 0.28, n.z * 0.98 + d.z * 0.28]);
          o.quaternion.setFromUnitVectors(arriba, d);
        };
        for (let i = 0; i < 5; i++) pincho(0.35, i * 1.26);
        for (let i = 0; i < 7; i++) pincho(0.95, F + 0.75 + i * 0.8);
        for (let i = 0; i < 5; i++) pincho(1.55, F + 1.2 + i * 0.95, 0.3);
        for (const phi of [-0.55, -0.18, 0.18, 0.55]) pincho(1.05, F + phi, 1.4);
        break;
      }
    }
  }

  // ---------- accesorios (coordenadas de la cabeza) ----------
  function accesorio(cabeza, avatar) {
    const oscuro = toon('#3d2f45');
    switch (avatar.accesorio) {
      case 'gafas': {
        const aro = new T.TorusGeometry(0.25, 0.032, 10, 40);
        const cristal = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 });
        for (const lado of [-1, 1]) {
          const p = sobreEsfera(1.08, F + 0.095, F + lado * 0.422);
          malla(cabeza, aro, oscuro, [p.x, p.y, p.z], [0, lado * 0.42, 0], false);
          malla(cabeza, new T.CircleGeometry(0.25, 32), cristal, [p.x, p.y, p.z], [0, lado * 0.42, 0], false);
        }
        malla(cabeza, cilindro(0.024, 0.024, 0.4, false, 8), oscuro, [0, -0.04, 1.06], [0, 0, F], false);
        break;
      }
      case 'orejas': {
        malla(cabeza, new T.TorusGeometry(1.1, 0.045, 8, 48, Math.PI), oscuro, [0, 0.04, 0.12], [0.3, 0, 0], false);
        for (const lado of [-1, 1]) {
          const g = new T.ConeGeometry(0.3, 0.56, 24); g.scale(1, 1, 0.45);
          malla(cabeza, g, oscuro, [lado * 0.58, 0.94, 0.12], [0, 0, -lado * 0.5]);
          const gi = new T.ConeGeometry(0.17, 0.33, 24); gi.scale(1, 1, 0.3);
          malla(cabeza, gi, toon('#ff9fc0'), [lado * 0.57, 0.9, 0.22], [0, 0, -lado * 0.5], false);
        }
        break;
      }
      case 'gorra': {
        const g = toon('#ff8a5c', { side: T.DoubleSide }), gd = toon(tono('#ff8a5c', -0.18));
        malla(cabeza, casquete(1.15, 0, Math.PI * 2, 0, 1.22), g);
        const visera = new T.CylinderGeometry(0.62, 0.62, 0.05, 32); visera.scale(1.15, 1, 1);
        malla(cabeza, visera, gd, [0, 0.36, 0.88], [0.12, 0, 0]);
        malla(cabeza, esfera(0.08), gd, [0, 1.15, 0]);
        break;
      }
      case 'auriculares': {
        const m = toon('#9b7be0');
        malla(cabeza, new T.TorusGeometry(1.16, 0.07, 10, 48, Math.PI), m, [0, 0.02, 0]);
        for (const lado of [-1, 1]) {
          malla(cabeza, cilindro(0.3, 0.3, 0.22), m, [lado * 1.12, 0, 0], [0, 0, F]);
          malla(cabeza, cilindro(0.2, 0.2, 0.04), toon(tono('#9b7be0', 0.4)), [lado * 1.24, 0, 0], [0, 0, F], false);
        }
        break;
      }
      case 'flor': {
        const n = sobreEsfera(1, 0.75, F + 0.95).normalize();
        const g = new T.Group();
        g.position.copy(n.clone().multiplyScalar(1.12));
        g.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), n);
        cabeza.add(g);
        for (let i = 0; i < 5; i++) {
          const a = i * Math.PI * 2 / 5;
          malla(g, esfera(0.1, 1, 1, 0.5), toon('#ff8fb1'), [Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0]);
        }
        malla(g, esfera(0.08, 1, 1, 0.6), toon('#ffd36e'), [0, 0, 0.03]);
        break;
      }
    }
  }

  // ---------- construir el avatar completo ----------
  function liberar(objeto) {
    objeto.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && o.material !== matContorno) {
        if (o.material.map && o.material.map !== texturaCara) o.material.map.dispose();
        o.material.dispose();
      }
    });
  }

  function construir(avatar) {
    if (avatar3d) { giro.remove(avatar3d); liberar(avatar3d); }
    avatar3d = new T.Group();
    giro.add(avatar3d);

    const fondo = catalogo.pieza('fondo', avatar.fondo);
    escena.background = new T.Color(fondo?.color3d || '#ece4ff');

    const piel = toon(avatar.piel);
    const matPelo = toon(avatar.pelo.color, { side: T.DoubleSide });
    const zapato = toon('#4b3d5c');

    const sombra = new T.Mesh(new T.CircleGeometry(0.95, 40), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.12 }));
    sombra.rotation.x = -F; sombra.position.y = 0.003;
    avatar3d.add(sombra);

    // Cuerpo
    for (const x of [-0.17, 0.17]) {
      malla(avatar3d, capsula(0.14, 0.34), piel, [x, 0.4, 0]);
      malla(avatar3d, esfera(1, 0.2, 0.13, 0.27), zapato, [x * 1.05, 0.12, 0.06]);
    }
    malla(avatar3d, capsula(0.4, 0.42), piel, [0, 1.0, 0]);
    const brazos = [-1, 1].map(lado => {
      const g = new T.Group();
      g.position.set(lado * 0.42, 1.28, 0);
      g.rotation.z = lado * 0.42;
      avatar3d.add(g);
      malla(g, capsula(0.11, 0.38), piel, [0, -0.3, 0]);
      malla(g, esfera(0.13), piel, [0, -0.62, 0]);
      return g;
    });

    // Ropa superior
    const r = avatar.ropa;
    const arriba = toon(r.colorArriba), arribaOsc = toon(tono(r.colorArriba, -0.18)), arribaClaro = toon(tono(r.colorArriba, 0.45));
    const mangas = (g, m, y) => brazos.forEach(b => malla(b, g, m, [0, y, 0]));
    switch (r.arriba) {
      case 'camiseta':
        malla(avatar3d, cilindro(0.43, 0.48, 0.74), arriba, [0, 0.99, 0]);
        mangas(cilindro(0.15, 0.17, 0.26), arriba, -0.1);
        break;
      case 'sudadera':
        malla(avatar3d, cilindro(0.45, 0.51, 0.82), arriba, [0, 0.95, 0]);
        malla(avatar3d, cilindro(0.515, 0.515, 0.1), arribaOsc, [0, 0.58, 0]);
        mangas(cilindro(0.15, 0.165, 0.5), arriba, -0.27);
        mangas(cilindro(0.165, 0.165, 0.08), arribaOsc, -0.52);
        malla(avatar3d, new T.TorusGeometry(0.38, 0.13, 12, 32), arribaOsc, [0, 1.3, -0.16], [F - 0.25, 0, 0]);
        malla(avatar3d, new T.BoxGeometry(0.52, 0.2, 0.05), arribaOsc, [0, 0.74, 0.49]);
        break;
      case 'rayas': {
        const m = new T.MeshToonMaterial({ map: rayas(r.colorArriba, tono(r.colorArriba, 0.45)), gradientMap: degradado });
        malla(avatar3d, cilindro(0.44, 0.49, 0.78), m, [0, 0.97, 0]);
        mangas(cilindro(0.15, 0.165, 0.5), m, -0.27);
        mangas(cilindro(0.165, 0.165, 0.08), arribaOsc, -0.52);
        break;
      }
      case 'vestido':
        malla(avatar3d, cilindro(0.43, 0.46, 0.42), arriba, [0, 1.14, 0]);
        malla(avatar3d, cilindro(0.46, 0.8, 0.62, true, 40), toon(r.colorArriba, { side: T.DoubleSide }), [0, 0.64, 0]);
        malla(avatar3d, new T.TorusGeometry(0.8, 0.035, 8, 48), arribaClaro, [0, 0.33, 0], [F, 0, 0], false);
        malla(avatar3d, new T.TorusGeometry(0.465, 0.045, 8, 40), arribaOsc, [0, 0.93, 0], [F, 0, 0], false);
        mangas(esfera(0.18), arriba, -0.06);
        break;
    }

    // Ropa inferior (si ninguna pieza la oculta)
    if (!catalogo.capasOcultas(avatar).has('ropa_abajo')) {
      const abajo = toon(r.colorAbajo);
      switch (r.abajo) {
        case 'pantalon':
          malla(avatar3d, cilindro(0.475, 0.475, 0.24), abajo, [0, 0.62, 0]);
          for (const x of [-0.17, 0.17]) malla(avatar3d, cilindro(0.17, 0.18, 0.46), abajo, [x, 0.33, 0]);
          break;
        case 'corto':
          malla(avatar3d, cilindro(0.475, 0.475, 0.24), abajo, [0, 0.62, 0]);
          for (const x of [-0.17, 0.17]) malla(avatar3d, cilindro(0.18, 0.19, 0.2), abajo, [x, 0.46, 0]);
          break;
        case 'falda':
          malla(avatar3d, cilindro(0.47, 0.68, 0.38, true, 40), toon(r.colorAbajo, { side: T.DoubleSide }), [0, 0.56, 0]);
          break;
      }
    }

    // Cabeza: esfera achatada + orejas + cara 2D como textura
    const cabeza = new T.Group();
    cabeza.position.set(0, 2.06, 0);
    cabeza.scale.set(1.08, 0.98, 1);
    avatar3d.add(cabeza);
    malla(cabeza, esfera(1, 1, 1, 1, 48, 32), piel);
    for (const lado of [-1, 1]) malla(cabeza, esfera(1, 0.12, 0.19, 0.14), piel, [lado * 1.0, -0.04, 0]);
    cabeza.add(new T.Mesh(
      new T.SphereGeometry(1.006, 48, 32, CARA.phi0, CARA.phiL, CARA.theta0, CARA.thetaL),
      new T.MeshBasicMaterial({ map: texturaCara, transparent: true, depthWrite: false })));
    dibujarCara(avatar);
    pelo(cabeza, avatar, matPelo);
    accesorio(cabeza, avatar);
  }

  // ---------- giro con el dedo / ratón y animación ----------
  let rotY = 0, velocidad = 0, arrastrando = false, ultimaX = 0, idFrame = 0, activo = false, balanceo = 1;
  const t0 = performance.now();
  canvas.addEventListener('pointerdown', e => {
    arrastrando = true; ultimaX = e.clientX; velocidad = 0;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* sin captura */ }
  });
  canvas.addEventListener('pointermove', e => {
    if (!arrastrando) return;
    const dx = e.clientX - ultimaX;
    ultimaX = e.clientX;
    rotY += dx * 0.012;
    velocidad = dx * 0.012;
  });
  const soltar = () => { arrastrando = false; };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);

  function ajustarTamano() {
    const r = contenedor.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    const v = Math.tan(camara.fov * Math.PI / 360);
    const z = Math.max(4.4 / 2 / v, 3.6 / 2 / (v * camara.aspect));
    camara.position.set(0, 1.8, z);
    camara.lookAt(0, 1.62, 0);
    camara.updateProjectionMatrix();
  }
  new ResizeObserver(() => { if (activo) ajustarTamano(); }).observe(contenedor);

  function bucle(t) {
    idFrame = requestAnimationFrame(bucle);
    if (!arrastrando) { rotY += velocidad; velocidad *= 0.92; }
    balanceo += ((arrastrando || Math.abs(velocidad) > 0.002 ? 0 : 1) - balanceo) * 0.02;
    const s = (t - t0) / 1000;
    giro.rotation.y = rotY + Math.sin(s * 0.6) * 0.22 * balanceo;
    giro.position.y = Math.sin(s * 2) * 0.02;
    renderer.render(escena, camara);
  }

  return {
    dibujar: construir,
    iniciar() { if (!activo) { activo = true; ajustarTamano(); idFrame = requestAnimationFrame(bucle); } },
    detener() { activo = false; cancelAnimationFrame(idFrame); },
    capturaPNG() { renderer.render(escena, camara); return canvas.toDataURL('image/png'); },
  };
}

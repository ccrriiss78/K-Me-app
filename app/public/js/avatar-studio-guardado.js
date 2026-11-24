// GUARDADO DE AVATAR STUDIO (T037, contrato v1, D052): habla con las rutas JSON del servidor.
// No toca la página: devuelve qué ha pasado ({ tipo, mensaje… }) y avatar-studio.js lo enseña.
// Así se puede probar sin navegador (tests/avatar-studio-cliente.test.js).
// - Nuevo: POST /studio/avatares (201). Desde entonces tiene id y versión.
// - Guardado: POST /studio/avatares/:id con la versión abierta; si otro dispositivo lo guardó antes
//   (409 con versión), no se sobrescribe y se puede guardar como copia.
// - Límite de 20 (409 sin versión): se pueden listar y borrar varios (D058).
// Sin borradores en localStorage (D052): lo que no se guarda en la cuenta se pierde al cerrar.

const JSON_CABECERAS = { 'content-type': 'application/json', accept: 'application/json' };
const SIN_CONEXION = 'No se ha podido guardar. Comprueba la conexión y vuelve a intentarlo: tus cambios siguen aquí.';
const SESION = 'Tu sesión ha caducado. Vuelve a entrar en otra pestaña y pulsa «Guardar» otra vez: tus cambios siguen aquí.';
const CADUCADA = 'La página ha caducado. Recarga la página para seguir (se perderán los cambios sin guardar).';

export function crearGuardado({ fetch, csrf, id = '', version = '' }) {
  const estado = { id: id || '', version: version ? Number(version) : null };

  async function pedir(url, { metodo = 'GET', cuerpo } = {}) {
    let res;
    try {
      res = await fetch(url, {
        method: metodo,
        headers: metodo === 'GET' ? { accept: 'application/json' } : JSON_CABECERAS,
        body: cuerpo === undefined ? undefined : JSON.stringify({ _csrf: csrf, ...cuerpo }),
      });
    } catch {
      return { error: { tipo: 'error', mensaje: SIN_CONEXION } };
    }
    let datos = null;
    try { datos = await res.json(); } catch { /* sin cuerpo JSON */ }
    if (res.status === 401) return { error: { tipo: 'sesion', mensaje: SESION } };
    if (res.status === 403) return { error: { tipo: 'caducada', mensaje: CADUCADA } };
    if (!res.ok) return { estado: res.status, datos, error: { tipo: 'error', mensaje: datos?.error ?? SIN_CONEXION } };
    return { estado: res.status, datos };
  }

  async function crear({ nombre, receta }) {
    const r = await pedir('/studio/avatares', { metodo: 'POST', cuerpo: { nombre, receta } });
    if (r.estado === 409) return { tipo: 'limite', mensaje: r.datos.error };
    if (r.error) return r.error;
    estado.id = String(r.datos.id);
    estado.version = r.datos.version;
    return { tipo: 'creado', id: estado.id, version: estado.version, direccion: `/studio/avatares/${estado.id}`, mensaje: 'Avatar guardado en tu cuenta.' };
  }

  async function guardar({ nombre, receta }) {
    if (!estado.id) return crear({ nombre, receta });
    const r = await pedir(`/studio/avatares/${estado.id}`, { metodo: 'POST', cuerpo: { nombre, receta, version: estado.version } });
    if (r.estado === 409) {
      return { tipo: 'conflicto', version: r.datos.version, mensaje: `${r.datos.error} Tus cambios siguen aquí: puedes guardarlos como copia o recargar la página para ver la versión guardada.` };
    }
    if (r.error) return r.error;
    estado.version = r.datos.version;
    return { tipo: 'guardado', id: estado.id, version: estado.version, mensaje: 'Cambios guardados.' };
  }

  // La lista de avatares de la cuenta ({ id, nombre }), para elegir cuáles borrar al llegar al límite.
  async function listar() {
    const r = await pedir('/studio/avatares');
    if (r.error) throw new Error(r.error.mensaje);
    return r.datos.avatares.map((a) => ({ id: a.id, nombre: a.nombre }));
  }

  // Borra varios avatares de la cuenta (ya confirmado en la página).
  async function borrar(ids) {
    const r = await pedir('/studio/avatares/borrar', { metodo: 'POST', cuerpo: { ids, confirmar: true } });
    if (r.error) return r.error;
    const n = r.datos.borrados;
    return { tipo: 'borrados', borrados: n, mensaje: n === 1 ? 'Se ha borrado 1 avatar.' : `Se han borrado ${n} avatares.` };
  }

  return { estado, guardar, guardarComoCopia: crear, listar, borrar };
}

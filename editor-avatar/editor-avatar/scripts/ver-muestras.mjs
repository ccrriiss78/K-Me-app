// Servidor de revisión: solo editor y logos, accesible únicamente desde este equipo.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';
const editor = fileURLToPath(new URL('../', import.meta.url));
const logos = fileURLToPath(new URL('../../../K-ME-logos-revisados-v1.1/', import.meta.url));
const tipos = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
createServer(async (req,res) => {
  try {
    const ruta=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    const prefijo='/editor-avatar/editor-avatar/';
    const prefijoLogos='/K-ME-logos-revisados-v1.1/';
    const base=ruta.startsWith(prefijo)?editor:ruta.startsWith(prefijoLogos)?logos:null;
    if(!base){res.writeHead(404);res.end('No encontrado');return;}
    const relativa=ruta.slice(base===editor?prefijo.length:prefijoLogos.length);
    const archivo=resolve(base,relativa);
    if(!archivo.startsWith(resolve(base)+sep)||!tipos[extname(archivo)]){res.writeHead(404);res.end('No encontrado');return;}
    const contenido=await readFile(archivo);
    res.writeHead(200,{'Content-Type':tipos[extname(archivo)],'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});res.end(contenido);
  } catch { res.writeHead(404);res.end('No encontrado'); }
}).listen(4173,'127.0.0.1',()=>console.log('Muestra: http://127.0.0.1:4173/editor-avatar/editor-avatar/kme-muestras.html'));

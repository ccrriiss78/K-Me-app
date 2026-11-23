import { dibujosMarcos } from '../assets/kme/marcos.js';

export const marcosDisponibles=[
  {id:'sin-marco',nombre:'Sin marco'},
  {id:'transparente',nombre:'Transparente'},
  {id:'charms',nombre:'Con charms'}
];
let contadorMarcos=0;
// Presentación independiente: no cambia la composición ni los colores del avatar.
export function svgConMarco(avatarSvg,marco='sin-marco'){
  if(marco==='sin-marco')return avatarSvg;
  const dibujo=dibujosMarcos[marco];if(!dibujo)throw new Error('Marco no disponible');
  // El dibujo conserva sus coordenadas e ID de color; nunca hereda medidas físicas de impresión.
  const avatar=avatarSvg.replace(/<svg\b[^>]*>/,tag=>tag
    .replace(/\s(?:width|height|x|y|viewBox|preserveAspectRatio)="[^"]*"/g,'')
    .replace(/>$/, ' x="0" y="0" width="400" height="480" viewBox="0 0 400 480" preserveAspectRatio="xMidYMid meet">'));
  const prefijo='ventana-marco-'+(++contadorMarcos);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 590" preserveAspectRatio="xMidYMid meet" data-marco="${marco}">
    <defs><clipPath id="${prefijo}"><rect x="68" y="142" width="304" height="380" rx="10"/></clipPath></defs>
    ${dibujo.fondo}
    <g clip-path="url(#${prefijo})"><svg data-parte="ventana-avatar" x="68" y="142" width="304" height="380" viewBox="60 0 280 450" preserveAspectRatio="xMidYMid meet">${avatar}</svg></g>
    ${dibujo.frente}
  </svg>`;
}

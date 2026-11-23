// Dibujos SVG originales de los portaphotocards. Separados del estado del editor.
// El hueco central coincide en ambos diseños para conservar el avatar completo.
const argollaMarco=`<g data-parte="argolla" fill="none" stroke-linecap="round">
  <path d="M176 103C147 78 166 25 204 25C246 25 261 79 231 103" stroke="#29242c" stroke-width="13"/>
  <path d="M176 100C151 76 169 29 204 29C243 29 256 76 231 100" stroke="#eeedf3" stroke-width="8"/>
  <path d="M177 92C158 69 174 35 198 34" stroke="#fff" stroke-width="2"/>
  <ellipse cx="204" cy="99" rx="12" ry="21" stroke="#5b5564" stroke-width="5"/>
  <path d="M197 85Q207 77 213 94" stroke="#fff" stroke-width="2"/>
</g>`;
const estrellaMarco='M0-17L5-5L18-4L8 5L11 18L0 11L-11 18L-8 5L-18-4L-5-5Z';

export const dibujosMarcos={
  transparente:{
    fondo:`<rect x="47" y="119" width="347" height="433" rx="28" fill="#211e24" opacity=".07"/>
      <rect x="43" y="111" width="354" height="442" rx="25" fill="#f1ecf5" fill-opacity=".48" stroke="#81758d" stroke-width="2"/>
      <rect x="48" y="115" width="343" height="432" rx="22" fill="#fff" fill-opacity=".38" stroke="#fff" stroke-width="3"/>
      <rect x="64" y="137" width="312" height="390" rx="13" fill="#fffdf9"/>`,
    frente:`${argollaMarco}
      <g fill="none" stroke-linecap="round">
        <rect x="64" y="137" width="312" height="390" rx="13" stroke="#c1b7ca" stroke-width="2"/>
        <path d="M54 174V143Q54 123 76 123H120M351 538H371Q386 538 386 521V493" stroke="#fff" stroke-width="4"/>
        <path d="M49 209V321M388 170V231" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>
      </g>
      <g data-parte="colgantes" stroke="#29242c" stroke-linecap="round" stroke-linejoin="round">
        <path d="M239 79Q322 60 384 110" fill="none" stroke="#84798c" stroke-width="3"/>
        <g fill="#fff" stroke="#84798c" stroke-width="2">
          <ellipse cx="270" cy="77" rx="8" ry="5" transform="rotate(-7 270 77)"/><ellipse cx="287" cy="77" rx="8" ry="5"/>
          <ellipse cx="304" cy="79" rx="8" ry="5" transform="rotate(12 304 79)"/><ellipse cx="321" cy="83" rx="8" ry="5" transform="rotate(20 321 83)"/>
          <ellipse cx="337" cy="89" rx="8" ry="5" transform="rotate(27 337 89)"/><ellipse cx="353" cy="97" rx="8" ry="5" transform="rotate(33 353 97)"/>
          <ellipse cx="368" cy="107" rx="8" ry="5" transform="rotate(43 368 107)"/><circle cx="382" cy="120" r="7"/>
        </g>
        <g transform="translate(390 154) rotate(12)"><path d="${estrellaMarco}" fill="#e83475" stroke-width="2.6"/><path d="M-4-7L-1-2" stroke="#fff" stroke-width="3"/></g>
        <circle cx="410" cy="183" r="6" fill="#fff" stroke-width="2"/>
      </g>
      <path d="M90 546l9-14m1 14 9-14" fill="none" stroke="#e83475" stroke-width="3" stroke-linecap="round"/>`
  },
  charms:{
    fondo:`<rect x="44" y="119" width="354" height="437" rx="32" fill="#211e24" opacity=".1"/>
      <rect x="39" y="110" width="360" height="442" rx="30" fill="#fbe6ef" stroke="#29242c" stroke-width="3"/>
      <rect x="46" y="117" width="346" height="428" rx="25" fill="#fffdf9" stroke="#e83475" stroke-width="2"/>
      <rect x="61" y="135" width="318" height="394" rx="16" fill="#fffdf9" stroke="#29242c" stroke-width="2"/>`,
    frente:`${argollaMarco}
      <path d="M58 162V140Q58 128 72 128H121" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
      <g data-parte="colgantes" stroke="#29242c" stroke-linecap="round" stroke-linejoin="round">
        <path d="M239 79Q397 55 425 167L429 205" fill="none" stroke-width="3"/>
        <g fill="#fff" stroke-width="2">
          <ellipse cx="269" cy="76" rx="8" ry="5"/><ellipse cx="287" cy="76" rx="8" ry="5"/><ellipse cx="305" cy="78" rx="8" ry="5" transform="rotate(14 305 78)"/>
          <ellipse cx="323" cy="82" rx="8" ry="5" transform="rotate(21 323 82)"/><ellipse cx="341" cy="89" rx="8" ry="5" transform="rotate(28 341 89)"/>
          <ellipse cx="358" cy="99" rx="8" ry="5" transform="rotate(35 358 99)"/><ellipse cx="374" cy="111" rx="8" ry="5" transform="rotate(42 374 111)"/>
          <ellipse cx="388" cy="125" rx="8" ry="5" transform="rotate(49 388 125)"/><ellipse cx="400" cy="141" rx="8" ry="5" transform="rotate(55 400 141)"/>
          <ellipse cx="410" cy="159" rx="8" ry="5" transform="rotate(62 410 159)"/><ellipse cx="418" cy="177" rx="8" ry="5" transform="rotate(70 418 177)"/>
          <ellipse cx="424" cy="195" rx="8" ry="5" transform="rotate(78 424 195)"/>
        </g>
        <path d="M352 101L361 145" fill="none" stroke-width="2"/>
        <g transform="translate(367 165) rotate(-12)"><path d="${estrellaMarco}" fill="#e83475" stroke-width="2.5"/><path d="M-4-7L-1-2" stroke="#fff" stroke-width="3"/></g>
        <circle cx="427" cy="211" r="6" fill="#fff" stroke-width="2"/>
        <g transform="translate(401 225) rotate(10 25 27)" stroke-width="3">
          <path d="M4 32V23C4-4 46-4 46 23V32" fill="none" stroke-width="7"/>
          <path d="M4 24C4 1 46 1 46 24" fill="none" stroke="#fff" stroke-width="2"/>
          <rect x="0" y="22" width="13" height="24" rx="5" fill="#e83475"/><rect x="37" y="22" width="13" height="24" rx="5" fill="#e83475"/>
          <path d="M13 41Q26 55 38 41" fill="none"/>
        </g>
        <path d="M423 278L414 302" fill="none" stroke-width="2"/>
        <circle cx="410" cy="310" r="8" fill="#fffdf9" stroke-width="2"/>
        <path d="M407 311l3-4 3 4" fill="none" stroke="#e83475" stroke-width="2"/>
      </g>
      <g transform="translate(66 527) rotate(-13)" stroke="#29242c" stroke-width="2" stroke-linejoin="round"><path d="${estrellaMarco}" fill="#fffdf9"/></g>
      <path d="M298 540l8-12m1 12 8-12" fill="none" stroke="#e83475" stroke-width="4" stroke-linecap="round"/>`
  }
};

# Guía de la prueba en el navegador · viernes 27/11/2026

Una sola lista, en el orden de la demo, con todo lo que falta revisar en tu navegador (T024, T030, T036, T039, T040, T041, T043, T044, T045, T046, T047, T048, T049, T053 y T055). Todo está probado con tests y en Chrome sin ventana por el asistente, **pero no por ti**: esta prueba es la que cuenta.

- ★ = sale en la demo del 1/12. Si vas justa de tiempo, haz primero lo marcado.
- Si algo falla: haz una captura, apunta el número del paso y sigue. Al final me pasas la lista.
- Unas 2 horas en total.

## 0. Preparar

- [ ] En PowerShell, desde `app/`: `$env:PORT = '3001'; npm run dev` → abre http://localhost:3001
- [ ] Usa una cuenta **nueva** y ficticia, creada en «Crear cuenta» (por ejemplo, el usuario `prueba_viernes` y el alias `fan_viernes`).
- **Para el móvil:** el móvil no ve `localhost`. En el ordenador, pulsa F12, luego el icono del móvil (Ctrl+Mayús+M) y elige 390 px de ancho.

## 1. Entrar y crear la cuenta (T036)

- [ ] ★ Crear cuenta con un alias que lleve una palabra no permitida → el aviso del alias, y el usuario se conserva.
- [ ] ★ Crear la cuenta bien → entras en «Mi K-ME», con tu alias en la cabecera.
- [ ] Revisa la lista de palabras no permitidas: `app/src/catalogos/palabras-no-permitidas.js`.
- [ ] En «Entrar» y «Crear cuenta», ya no está la raya fucsia suelta encima de la tarjeta (E0098).

## 2. Mi escenario · HANGUL LIVE 001 (T043)

- [ ] ★ «Mi escenario» → HANGUL LIVE 001 → lee la miniclase.
- [ ] ★ Falla una pregunta a propósito → te deja volver a probar (sin perder nada).
- [ ] ★ Acierta las 3 → el aviso en magenta, **20 Kpopis** en la cabecera y «Luz Hangul 001» en «Mis tesoros» (Mi K-ME).
- [ ] ★ En «Mi K-ME», la tarjeta de Luz Hangul 001 en «Mis tesoros» (D082, E0097), en horizontal. A la izquierda, el lightstick encendido: bola blanca y rosa, con un reflejo curvo y un halo rosa sobre el papel lila; esquina fucsia, esquina de lámina irisada y purpurina abajo. A la derecha, sobre blanco: «LIGHTSTICK», el nombre, «Conseguido el» con la fecha de hoy y el origen. Mírala en el ordenador y en el móvil (390 px).
- [ ] Repítela entera → «Por repasar hoy, has ganado 5 Kpopis» (D087), sin volver a dar el tesoro. Repítela otra vez el mismo día → ya no da más («vuelve mañana»). En Mis Kpopis sale «Repaso de HANGUL LIVE 001».
- [ ] ★ **HANGUL LIVE 002 y 003 (D086):** al acertar, la «K» con comillas fucsias lleva a la siguiente pregunta; pasa el ratón por encima y llega con Tab: se ilumina. Al terminar la 001, «Siguiente clase: HANGUL LIVE 002». Completa la 002 (사랑, 행복, 미소) y la 003 (무대, 최애, 컴백): **+20 Kpopis** cada una, la primera vez; repetirlas no da más. «← Clase anterior» te lleva a repasar. En la 003, «Terminar la clase» vuelve a «Mi escenario».
- [ ] **Decide:** ¿te gustan los textos, los dibujos y el sitio de cada cosa? ¿Y los materiales del tesoro? ¿Pedimos a ChatGPT las texturas de purpurina y lámina irisada (T054)?

## 3. Colección «K» y canje (T046)

- [ ] ★ Avatar Studio → «Nuevo avatar»: se abre la pestaña **Colección «K»**, negra con sombra fucsia, y el avatar de presentación con el gorro y la falda con botas.
- [ ] ★ Botón amarillo «Canjear Kpopis» → el catálogo con el Top Destello y la Chaqueta, a 20 Kpopis, cada una con su vista previa.
- [ ] ★ «Canjear» el Top Destello → «¡Canjeado! Ya tienes Top Destello.», «Tienes 0 Kpopis» y «Ya es tuya».
- [ ] «Canjear» la chaqueta sin saldo → «No tienes Kpopis suficientes: te faltan 20.»
- [ ] ★ Vuelve al editor → el top sale en la pestaña «K»; la chaqueta, no.
- [ ] «Mi K-ME» → «Mis Kpopis»: «−20 Kpopis · Canje: Top Destello».
- [ ] **Decide:** los precios y las próximas piezas de canje.

## 3b. Colección Encore (T048)

- [ ] ★ En el catálogo de canje salen las seis piezas de Encore, con su precio propuesto y su vista previa. Con 10 Kpopis, canjea los pendientes o el lazo.
- [ ] Para probar las seis sin gastar: pídeme que se las dé a tu cuenta de prueba, como en los tests.
- [ ] ★ En «K»: la chaqueta y la falda de tu cuerpo, y los cuatro accesorios. Póntelos todos a la vez.
- [ ] Cambia de cuerpo («Cuerpo») y de rostro («Cara»): la ropa cambia de variante; los pendientes cuelgan de la oreja también con el rostro ovalado; el brazalete va en la muñeca.
- [ ] El lazo y el pin: al poner uno se quita el otro.
- [ ] Guarda, vuelve a abrir, haz un sello «Cuerpo entero» y descarga la photocard en PDF.
- [ ] Haz un sello «Cuerpo entero» con un avatar muy cargado (las seis piezas de Encore y más accesorios): la vista previa se actualiza (el límite ya es de 16 imágenes).
- [ ] **Decide:** los precios y los ojos del lote 07.
- [ ] **COLECCIÓN K · SPOTLIGHT (T049), propuestas sin canje:** en «K», baja hasta su apartado: el título, el lema «Brilla en tu propio escenario» y debajo sus piezas (las que llevan «Spotlight» en el nombre, las Pulseras Fanchant y los Pines Fan Signal). Combínalas con los tres cuerpos y rostros; las pulseras, con camiseta y con chaqueta. Al pasar el ratón por una miniatura, el nombre que sale también dice Spotlight. **Decide** cuáles se quedan, sus precios, y si Rizo necesita más contraste.

## 4. Avatar Studio (T040, T044, T045, T047)

- [ ] ★ **Varios accesorios (T047):** en «K», pon el gorro; en «Accesorios», pon los auriculares y las gafas → se ven los tres a la vez, el gorro debajo.
- [ ] ★ Pulsa otra vez las gafas → se quitan y el resto sigue puesto. «Sin accesorio» los quita todos. «Deshacer» los recupera.
- [ ] Añade el pin y el lightstick (en «K») → los cinco a la vez.
- [ ] Cambia el color del gorro (en «K», debajo de los accesorios).
- [ ] Prueba el lightstick, la falda con bolsillos y la falda con botas con los tres cuerpos («Cuerpo»).
- [ ] ★ **Lightstick encendido (T055):** en «K», al lado del de siempre, «Lightstick de estudio · encendido». Elígelo con los tres cuerpos y con alguna chaqueta, y con el gorro y las gafas. Al elegir uno, el otro se quita. Guarda, vuelve a abrir, haz un sello «Cuerpo entero» y descarga la photocard: tiene que salir encendido. **Decide:** ¿se nota bastante la luz a tamaño pequeño?
- [ ] ★ Ponle nombre y «Guardar» → sale en «Mis avatares». Ábrelo otra vez: está igual, con sus accesorios.
- [ ] «Mi ambiente»: cambia el color.
- [ ] ★ «Imprimir avatar» y las dos photocards en PDF.
- [ ] Cambia algo y sal sin guardar → te avisa.
- [ ] Abre el mismo avatar en dos pestañas y guarda en las dos → la segunda te ofrece «Guardar como copia».
- [ ] En «Mis avatares»: «Borrar los seleccionados» y «Borrar todos» (crea antes 2 o 3 de prueba).
- [ ] (Opcional, es largo) el límite de 20 avatares, con el borrado allí mismo.
- [ ] **Decide:** los moños que asoman bajo el gorro (T045); el pin fucsia sobre el gorro fucsia, que apenas se distingue; los cruces del lightstick con brazos y prendas (T044, con ChatGPT).

## 5. Imagen de perfil (T039)

- [ ] ★ En «Mis avatares», «Usar en mi perfil» → la cara sale en la cabecera, en el marco con forma de logo.
- [ ] En «Mi K-ME», «Tu imagen de perfil»: se ve y se puede quitar.

## 6. Sello Studio (T036, T044, T024)

- [ ] ★ Crea un sello con una palabra en hangul, tu avatar («Cuerpo entero») y hasta 3 adornos → «Guardar».
- [ ] ★ «Imprimir», «Photocard 55 × 85 mm (PDF)» y «Descargar PNG».
- [ ] Imprime la photocard en papel al **100 %** y mídela: tiene que dar 55 × 85 mm.

## 7. Connect (T041)

- [ ] ★ Publica sin elegir diseño → sale la cara de tu avatar de perfil (con sus accesorios).
- [ ] Publica con un avatar concreto y con un sello concreto.
- [ ] Edita o borra ese avatar → la publicación no cambia (es una copia).
- [ ] Mensaje con iconos: elige, quita, y comprueba que no deja más de 5.
- [ ] ★ **Tipo de mensaje (D084):** al abrir «Añadir un mensaje con iconos», elige «¿Qué es?» (por ejemplo, Reto) y publica. En el muro, delante de los iconos, sale la etiqueta «RETO». Sin elegir, «MENSAJE». Sin iconos, no sale nada.
- [ ] Reacciona, quita «la última» y «todas las mías»; borra una publicación tuya.
- [ ] **Decide:** ¿te gustan los 7 iconos nuevos y el tamaño de la photocard?

## 8. En el móvil (390 px, con F12)

- [ ] ★ Cabecera y menú: «Hola, …», el saldo y el menú en dos filas, sin salirse.
- [ ] ★ Editor: la tarjeta del avatar queda **debajo** de «Guardar», sin taparlo (arreglado hoy, E0084).
- [ ] ★ Pestaña «K», «Accesorios» y el catálogo de canje: se leen bien y se pulsan sin esfuerzo.
- [ ] Mi escenario y Connect.
- [ ] Con la ventana a unos 900 px de ancho (F12, 900): el menú baja a su propia fila y «Hola, …» no se parte (arreglado hoy, E0096).

## 8b. K-ME · TÚ DECIDES (T053)

- [ ] ★ Al entrar, «Mi K-ME» como «Mi espacio» (D085). En el ordenador, a la izquierda, tu imagen de perfil grande, con el alias y la fecha; a la derecha, Mis tesoros, Mis Kpopis y tu sello si también tienes avatar; debajo, «¿Qué viene después?». En el móvil, uno debajo de otro, con la imagen grande y centrada, y la votación al final.
- [ ] Los cuatro casos: sin imagen de perfil (con la cuenta nueva), solo avatar, avatar y sello, y solo sello (el sello ocupa la imagen grande). Prueba también con el zoom del navegador al 200 %.
- [ ] ★ La cabecera: el logo más grande, y tu cara o tu sello a su misma altura, junto a «Hola, …». En el móvil, todo en una fila.
- [ ] ★ Elige una tarjeta y pulsa «¡Esta es mi favorita!»: «¡Voto guardado!», tu tarjeta en fucsia con ✓ y los porcentajes. La página **no se recarga ni se mueve** (arreglado hoy, E0099); prueba también con la ventana a unos 900 px y en el móvil (390 px).
- [ ] Elige otra y vuelve a pulsar: cambia tu voto (no se suma). Sal y vuelve a entrar: sigue la tuya.
- [ ] Vota con otra cuenta (la de prueba) y mira cómo cambian los porcentajes.
- [ ] Con el teclado: Tab hasta las tarjetas, flechas para cambiar, Enter en el botón.
- [ ] En el móvil (F12, 390 px): las tarjetas, una debajo de otra, y el botón a lo ancho.
- [ ] Los iconos de ChatGPT, a la izquierda de «Propuesta futura» en cada tarjeta: se distinguen bien, también en la tarjeta elegida (rosa).
- [ ] **Decide:** si te gustan los iconos y la portada nueva (si no, se vuelve a la anterior).

## 9. Teclado y contraste (T030)

- [ ] Recorre con Tab «Entrar», el editor y Connect: siempre se ve dónde estás (el foco).
- [ ] Los botones fucsia llevan el texto negro y se leen bien; el borde de los campos se ve.
- En Chrome sin ventana, el asistente midió el contraste de 18 páginas y estados: **0 fallos** (V107). Falta solo tu vistazo.

## Al terminar

Mándame: los pasos que fallaron (con captura) y tus respuestas a las decisiones marcadas con **Decide**. Con eso cierro las tareas en la bitácora y arreglo lo que haga falta el sábado, antes de congelar el código.

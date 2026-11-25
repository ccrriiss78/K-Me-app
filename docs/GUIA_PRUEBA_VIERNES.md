# Guía de la prueba en el navegador · viernes 27/11/2026

Una sola lista, en el orden de la demo, con todo lo que falta revisar en tu navegador (T024, T030, T036, T039, T040, T041, T043, T044, T045, T046 y T047). Todo está probado con tests y en Chrome sin ventana por el asistente, **pero no por ti**: esta prueba es la que cuenta.

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

## 2. Mi escenario · HANGUL LIVE 001 (T043)

- [ ] ★ «Mi escenario» → HANGUL LIVE 001 → lee la miniclase.
- [ ] ★ Falla una pregunta a propósito → te deja volver a probar (sin perder nada).
- [ ] ★ Acierta las 3 → el aviso en magenta, **20 Kpopis** en la cabecera y «Luz Hangul 001» en «Mis tesoros» (Mi K-ME).
- [ ] Repítela entera → no vuelve a dar Kpopis ni el tesoro.
- [ ] **Decide:** ¿te gustan los textos, los dibujos y el sitio de cada cosa?

## 3. Colección «K» y canje (T046)

- [ ] ★ Avatar Studio → «Nuevo avatar»: se abre la pestaña **Colección «K»**, negra con sombra fucsia, y el avatar de presentación con el gorro y la falda con botas.
- [ ] ★ Botón amarillo «Canjear Kpopis» → el catálogo con el Top Destello y la Chaqueta, a 20 Kpopis, cada una con su vista previa.
- [ ] ★ «Canjear» el Top Destello → «¡Canjeado! Ya tienes Top Destello.», «Tienes 0 Kpopis» y «Ya es tuya».
- [ ] «Canjear» la chaqueta sin saldo → «No tienes Kpopis suficientes: te faltan 20.»
- [ ] ★ Vuelve al editor → el top sale en la pestaña «K»; la chaqueta, no.
- [ ] «Mi K-ME» → «Mis Kpopis»: «−20 Kpopis · Canje: Top Destello».
- [ ] **Decide:** los precios y las próximas piezas de canje.

## 4. Avatar Studio (T040, T044, T045, T047)

- [ ] ★ **Varios accesorios (T047):** en «K», pon el gorro; en «Accesorios», pon los auriculares y las gafas → se ven los tres a la vez, el gorro debajo.
- [ ] ★ Pulsa otra vez las gafas → se quitan y el resto sigue puesto. «Sin accesorio» los quita todos. «Deshacer» los recupera.
- [ ] Añade el pin y el lightstick (en «K») → los cinco a la vez.
- [ ] Cambia el color del gorro (en «K», debajo de los accesorios).
- [ ] Prueba el lightstick, la falda con bolsillos y la falda con botas con los tres cuerpos («Cuerpo»).
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
- [ ] Reacciona, quita «la última» y «todas las mías»; borra una publicación tuya.
- [ ] **Decide:** ¿te gustan los 7 iconos nuevos y el tamaño de la photocard?

## 8. En el móvil (390 px, con F12)

- [ ] ★ Cabecera y menú: «Hola, …», el saldo y el menú en dos filas, sin salirse.
- [ ] ★ Editor: la tarjeta del avatar queda **debajo** de «Guardar», sin taparlo (arreglado hoy, E0084).
- [ ] ★ Pestaña «K», «Accesorios» y el catálogo de canje: se leen bien y se pulsan sin esfuerzo.
- [ ] Mi escenario y Connect.

## 9. Teclado y contraste (T030)

- [ ] Recorre con Tab «Entrar», el editor y Connect: siempre se ve dónde estás (el foco).
- [ ] Los botones fucsia llevan el texto negro y se leen bien; el borde de los campos se ve.
- En Chrome sin ventana, el asistente midió el contraste de 18 páginas y estados: **0 fallos** (V107). Falta solo tu vistazo.

## Al terminar

Mándame: los pasos que fallaron (con captura) y tus respuestas a las decisiones marcadas con **Decide**. Con eso cierro las tareas en la bitácora y arreglo lo que haga falta el sábado, antes de congelar el código.

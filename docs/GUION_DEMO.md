# Guion de la demo y plan B · presentación del 1/12/2026

**[PROPUESTA, P029]** Borrador del asistente para que la autora lo ajuste (D054: el domingo 29, ensayo y plan B). Nada de esto está decidido: cambia el orden, los tiempos y lo que se dice como quieras.

**Supuestos, por confirmar:** unos 10 minutos de demo; la app en local (http://localhost:3001) en tu portátil; una cuenta nueva creada en directo.

## 1. Antes de empezar (el mismo día)

- [ ] Portátil cargado y con el cargador. Las notificaciones, en silencio. Una sola ventana del navegador, con el zoom al 100 %.
- [ ] PostgreSQL en marcha: desde `app/`, `npm run comprobar-bd`.
- [ ] La app: `$env:PORT = '3001'; npm run dev` y abre http://localhost:3001
- [ ] La noche antes: `npm test` en verde (app 275 y editor 182, o los que haya tras el viernes).
- [ ] Una segunda cuenta ficticia con 2 o 3 publicaciones en Connect, para que el muro no salga vacío.
- [ ] Ten pensados el usuario y el alias de la cuenta de la demo (por ejemplo, `demo_kme` y `fan_demo`), y una contraseña de 12 caracteres que puedas escribir sin dudar.
- [ ] El plan B a mano (apartado 3).

## 2. El recorrido (unos 10 minutos)

| # | Min. | Qué enseñas | Qué cuentas |
| --- | --- | --- | --- |
| 1 | 1 | La pantalla de entrada, con el logo. | K-ME: una app para fans del K-pop donde **el fan es el protagonista**. *Sin fan no hay idol.* |
| 2 | 1 | «Crear cuenta»: usuario, alias y contraseña. | El usuario es privado (solo para entrar) y el alias, público. Sin correo ni datos personales. Contraseña de 12 caracteres como mínimo. Si algo falla, el mensaje no da pistas. |
| 3 | 1,5 | «Mi escenario» → HANGUL LIVE 001: falla una a propósito y acierta las tres. | Una miniclase de coreano. Se puede repetir hasta acertar. Al completarla: **20 Kpopis** (en la cabecera) y el tesoro «Luz Hangul 001». Los premios los calcula el servidor y nunca se cobran dos veces. |
| 4 | 1,5 | Avatar Studio: la pestaña **Colección «K»**, «Canjear Kpopis» → canjea el Top Destello. | Las piezas especiales, con materiales tipo collage. Se ve cómo quedan antes de canjear. Al canjear, se restan los 20 Kpopis y la pieza es tuya. |
| 5 | 1,5 | En el editor: el top, el gorro con auriculares y gafas (**varios accesorios**), los colores. «Guardar». | El avatar se guarda en tu cuenta como una receta, no como imagen, y se recupera desde cualquier navegador. |
| 6 | 0,5 | «Usar en mi perfil» → la cara en la cabecera. | Tu imagen de perfil, en un marco como el del logo. |
| 7 | 1,5 | Sello Studio: una palabra en hangul, tu avatar y adornos → «Photocard 55 × 85 mm (PDF)». Enseña una photocard ya impresa. | Lo que creas sale de la pantalla: se imprime a tamaño real. |
| 8 | 1 | Connect: publica «Feliz» con tu avatar y un mensaje con iconos; reacciona a otra publicación. | Un muro sin texto libre: emociones e iconos, para que sea un sitio seguro. |
| 9 | 1 | Por dentro (diapositiva o el README): MVC, PostgreSQL y tests. | Cada dato es de su cuenta y otra cuenta no puede verlo ni cambiarlo (hay un test para cada caso). Protección CSRF, contraseñas con Argon2id, el canje en una transacción. **275 tests de la app y 182 del editor**, escritos antes del código, y la bitácora con cada decisión. |
| 10 | 0,5 | — | Lo siguiente: más piezas de la Colección «K», los eventos, los intercambios y el selector de calzado. |

## 3. Plan B

| Si falla… | Haz esto |
| --- | --- |
| Una pantalla concreta | Di que lo cuentas con una captura y sigue con la siguiente. |
| La base de datos o la app entera | Las **capturas del recorrido**: el asistente las genera el sábado 28, después de congelar el código, en `privado/plan-b/` (fuera de Git). Y el editor sin servidor: `editor-avatar/editor-avatar/KME_ABRIR_MUESTRA.html`. |
| El portátil | El **vídeo del recorrido**, grabado en el ensayo del domingo, en el móvil y en un USB. El código está en GitHub. |
| La impresora (si imprimes en directo) | La photocard ya impresa y el PDF descargado. |

## 4. Ensayo del domingo 29

- [ ] Con una cuenta nueva y cronómetro, de principio a fin.
- [ ] Graba la pantalla mientras ensayas: ese es el vídeo del plan B.
- [ ] Apunta dónde te trabas o qué tarda, y me lo pasas.
- [ ] Imprime la photocard de la demo.

## Para decidir

- ¿Cuánto dura la demo? (aquí, 10 minutos)
- ¿Creas la cuenta en directo o entras con una ya preparada?
- ¿Imprimes en directo o enseñas una ya impresa?
- ¿Enseñas el apartado «por dentro» con una diapositiva, con el README o con `npm test` en directo?

# Diseño — fase 07: la pelotita de la barra se agarra y se arrastra

Nicolás probó la demo y pidió una sola cosa, en dos audios:

> *"veo que en los controles no está la pelotita que me muestra dónde estamos en
> el player. Me gustaría, tanto en mobile como con el mouse, poder agarrarla,
> seleccionarla y moverla a través de la barra, y una vez que suelte, ahí es el
> seek. Es como un drag and drop en una dimensión."*

> *"es ambos, ¿no? Yo puedo tocar en la pelotita y arrastrarla, o puedo tocar en
> la barra. Es lo que hace casi cualquier player."*

Es un arreglo chico, es un POC y la vara es la de siempre: quick and dirty, y
nada se mide ni se pule más allá de lo que hace falta para que el gesto funcione
en pantalla.

## Lo primero, porque cambia una línea del pedido: la pelotita ya está

Medido antes de diseñar nada, contra el player corriendo en el 8080 con el cromo
arriba y el programa en el segundo 60: `.qa-track__knob` existe desde la fase 02
(`7c2a228`), `paint()` la mueve todos los frames con el `currentTime`
(`lib/controls.js`), y en pantalla es un punto de 14 px en `rgb(55,180,167)` —el
`--qa-accent` que la demo le pasa— con anillo blanco, sobre la cabeza del fill y
por encima de las cinco marcas. **Se ve.**

Así que esta fase **no agrega la pelotita: le agrega el gesto**, que es lo que el
mismo pedido dice en su segunda oración. Escribir una segunda perilla sería
duplicar la que hay.

Por qué él dijo que no está es una lectura y va escrita como tal: **un punto que
sólo informa no se lee como un agarre.** Sin arrastre no hay nada que invite a
tocarlo, y a 14 px sobre la punta del fill se lee como parte del fill. Si es eso,
el arrastre lo arregla solo. Lo que el diseño se lleva de ahí es la decisión 5, y
nada más: no se mide el tamaño en reposo ni se cambia el color, porque ninguna
decisión de hoy necesita ese número.

## El modelo del gesto: uno solo, no dos

```
pointerdown en cualquier parte de la barra → la pelotita salta ahí y empieza el scrub
pointermove                                → la pelotita sigue al puntero
pointerup                                  → ahí es el seek
```

**Un toque suelto es un arrastre de longitud cero.** Tocás la barra, la pelotita
salta a ese punto, no movés, soltás, y seekea ahí. Agarrar la pelotita y llevarla
es el mismo camino con otra longitud.

De ahí salen dos propiedades y las dos son de lo que **no** hay que escribir:
**no hay una rama de "modo toque" contra "modo arrastre"**, y **no hay que acertar
si el dedo cayó sobre la pelotita o al lado de ella** —cayó en la barra, y con eso
alcanza—. Es la misma forma que la asimetría mouse/dedo de la fase 06, donde un
predicado dio los dos casos sin una rama por dispositivo.

Y una propiedad que sale gratis del código que ya está: **el scrub, como cualquier
control de este player, sólo cuenta con el cromo arriba.** No hace falta escribir
la regla, porque la capa del cromo no recibe punteros mientras está escondida, así
que con el cromo abajo el press ni llega a la barra. Es lo que el comentario del
`pointerdown` del contenedor ya dice de la barra: navega en el press, y por eso el
primer toque no la alcanza.

## El único cambio sobre lo que ya funciona

Hoy el seek pasa en el `pointerdown`:

```js
track.addEventListener('pointerdown', (event) => { seekFromEvent(event); show(); });
```

y con esto pasa en el `pointerup`. **Es lo que habilita el arrastre**, porque un
gesto que seekea al apretar ya no tiene nada que arrastrar. Es también lo único
que se puede romper acá, así que la definición de done de la task lo dice en esos
términos: **un toque suelto tiene que seguir seekeando exactamente donde seekea
hoy**, en el mismo punto de la barra y con la misma cuenta.

## Las cinco decisiones

### D1 — Mientras se arrastra, la posición la manda el puntero y no el video

Hoy el pintado tiene una única fuente de verdad, el `currentTime`, y un frame loop
lo repinta —`paint()` y el `loop()` del final de `lib/controls.js`—. Un arrastre
agrega una segunda fuente, y las dos no pueden estar prendidas a la vez: sin un
estado de scrub que el loop respete, la pelotita salta atrás sola en cada frame,
porque el video no se movió.

**Decisión:** hay un estado de scrub con la fracción que el puntero pide, y
mientras existe `paint()` lee de ahí en lugar del `currentTime`. Lo leen las tres
cosas que dependen de la posición —el fill, la pelotita y el reloj de la
izquierda—, así que la barra entera cuenta lo mismo durante el arrastre. Las
marcas no, porque dependen del largo y no de la posición.

**Descartado:** seekear en cada `pointermove`. Es la versión sin estado y no la
pidió: *"una vez que suelte, ahí es el seek"*. Además haría que el player busque
decenas de veces por gesto, que sobre HLS es exactamente lo que no se quiere
mostrar en cámara.

### D2 — `setPointerCapture` sobre la barra

La barra tiene 44 px de alto y un arrastre se sale de ahí sin querer, para arriba
o al costado. Sin captura, el gesto se corta en el borde y la pelotita se queda
donde estaba.

**Decisión:** la barra captura el puntero en el `pointerdown` y lo suelta en el
`pointerup`. Con eso los `pointermove` y el `pointerup` llegan a la barra aunque
el puntero esté afuera, que es lo que hace que soltar el botón a mitad de la
imagen igual seekee.

**Descartado:** escuchar el move y el up en `window`. Da lo mismo y obliga a
desuscribir a mano en cada salida, incluida la que nadie prueba.

### D3 — `touch-action: none` en la barra

**Decisión:** `.qa-track` lleva `touch-action: none`.

No es lo que habilita el gesto, es lo que impide que el browser se lo quede: sin
eso, un arrastre vertical sobre la barra lo interpreta como scroll de la página y
el gesto se corta a mitad de camino. **Medido hoy la barra está en
`touch-action: auto`.** El toque suelto anda igual con o sin esto; el que no
existe sin esto es el arrastre en mobile, que es la mitad del pedido.

### D4 — El cromo no se baja en medio de un arrastre

Hay un temporizador que esconde el cromo —`arm()` / `hide()`, con su presupuesto
en `hideMs`— y no sabe nada del gesto. Un arrastre lento, o un dedo quieto sobre
la pelotita, se come el presupuesto y la barra desaparece abajo del dedo.

**Decisión:** mientras hay un scrub en vuelo, `hide()` no corre; al terminar el
scrub se llama a `show()`, que vuelve a armar el temporizador como siempre.

**Descartado:** llamar a `show()` en cada `pointermove` del scrub. Es la versión
que parece más simple y falla justo en el caso que el riesgo describe, un dedo
apoyado y quieto, donde no hay moves que renueven nada.

### D5 — Mientras se arrastra, la pelotita crece

Sale del párrafo de arriba, y es lo único que se lleva de ahí. Es lo que hace
visible que el punto es un agarre y no una marca, y es lo que hace cualquier
player, que es el estándar que el propio pedido nombra.

**Decisión:** mientras dura el scrub, la pelotita se dibuja más grande. Es una
clase sobre el nodo que ya existe y una regla en la hoja de estilos que ya existe,
con la escala expresada sobre `--qa-rail` como todo el resto del cromo, así que
sigue escalando igual en fullscreen y en mobile.

**Descartado:** cambiarle el tamaño en reposo, o el color. Sería tocar lo que no
se midió: el punto se ve, y agrandar en reposo cambia cómo se ve la barra en
cámara, que es lo que la fase 04 dejó cerrado.

## Alcance

1. El scrub como un solo camino: press, move, release, y el seek en el release.
2. El estado de scrub, y `paint()` respetándolo (D1).
3. La captura del puntero (D2) y `touch-action: none` (D3).
4. El cromo que no se baja durante el gesto (D4).
5. La pelotita que crece mientras se arrastra (D5).
6. La corrida mirada con los dos punteros, mouse y toque emulado.

## Fuera de alcance

- **Tocar la pelotita en reposo**: tamaño, color, forma. No se midió y no hace
  falta para el gesto.
- **Un preview del cuadro al que se va a saltar.** Es lo que un player de mercado
  tiene y este no: pide thumbnails y no hay pipeline que los genere. No lo pidió.
- **Teclado y accesibilidad sobre la barra.** Misma razón que la fase 06: no está
  en el pedido y la vara es la de un POC.
- **La barra del pane de fábrica.** Es el mismo cromo, así que se lleva el gesto
  de rebote, y eso está bien —los dos panes siguen idénticos en todo menos en qué
  muestran durante el break, que es lo que la fase 04 dejó—. No se le agrega ni se
  le saca nada por separado.
- **Seekear durante el arrastre.** Descartado en la D1.
- **La regla de la fase 04 y el gesto del foco de la fase 06.** No se tocan. La
  barra ya es furniture para las dos: un toque sobre un control es de ese control
  y no alterna el cromo.

## Riesgos

**R1. El toque suelto deja de seekear donde seekeaba.** Es el único camino que hoy
funciona y que este cambio mueve, del press al release. Mitigación: la definición
de done de la task lo pide como comparación y no como impresión —el mismo punto de
la barra tiene que dar el mismo segundo—, y es lo primero que se mira con el
player.

**R2. El press sobre la barra deja de llegar, o llega y además alterna el cromo.**
El `pointerdown` del contenedor corre para todo lo que está adentro, y hoy trata a
la barra como furniture. Mitigación: no se toca ese handler, y el gesto se agrega
en la barra, que es donde ya estaba el listener que se reemplaza. Se mira en el
caso táctil: un arrastre no tiene que esconder el cromo al soltar.

**R3. Un arrastre en mobile scrollea la página en lugar de mover la pelotita.** Es
el defecto que la D3 evita, y es el que no se ve probando con mouse. Mitigación:
se prueba con toque emulado, y el chequeo es que el scroll de la página no se
mueva durante el arrastre.

## La verificación de la fase

Vara de POC. La lógica nueva es de gesto y de pintado, o sea visual, así que el
instrumento es mirar el player con los dos punteros. **Anclado en `#player`**: la
página tiene dos panes con el mismo cromo, y un selector global mide el de
fábrica.

- `npm test` y `npm run check` en verde. La suite no crece: no hay lógica no
  visual nueva. La cuenta de hoy es 49.
- Con el player corriendo:
  1. La pelotita está y está donde está el video.
  2. Un click suelto en la barra seekea a ese punto, **como hoy**.
  3. Arrastrarla mueve la pelotita y el video **no** seekea; al soltar, seekea.
  4. El arrastre sobrevive a salirse de la barra.
  5. Con toque, arrastrar **no** scrollea la página.
  6. El cromo no se baja en medio del arrastre.

## Tabla de descartes

| qué se descartó | por qué |
| --- | --- |
| agregar una pelotita | ya está, desde la fase 02, y se ve |
| dos ramas, "toque" y "arrastre" | el toque suelto es un arrastre de longitud cero, así que una sola |
| acertar si el dedo cayó sobre la pelotita | cayó en la barra y con eso alcanza |
| seekear en cada `pointermove` | no es lo que pidió, y busca decenas de veces por gesto sobre HLS |
| `window` para el move y el up | `setPointerCapture` da lo mismo sin desuscribir a mano |
| `show()` en cada move para sostener el cromo | falla con el dedo apoyado y quieto, que es el caso del riesgo |
| cambiar el tamaño o el color de la pelotita en reposo | no se midió, y cambia cómo se ve la barra en cámara |
| preview del cuadro al saltar | pide thumbnails que no existen, y no lo pidió |

# T-02 — Los dos punteros, mirados sobre el resultado final

Los seis casos, corridos con mouse y con el dedo sobre el resultado de la T-01, y
todos en verde. Nada de lo que ya andaba se movió, y de las tres superficies de
documentación una necesitaba una oración.

Todo anclado en `#player`, porque la página tiene dos panes con el mismo cromo y
un selector global mide el de fábrica.

## Con mouse, en 1600 × 900

Las lecturas en `t02-lecturas.json`. Programa de 180 s.

| # | caso | lectura |
| --- | --- | --- |
| 1 | la pelotita está donde está el video | con el `currentTime` en 90 s: `left` 50 %, el fill 50 %, `visibility: visible`, 14 px |
| 2 | click suelto | tocado al 10 %: `currentTime` 18,0 s contra 18,0 esperados |
| 3 | arrastre | de 10 % a 60 %: el `currentTime` **se queda en 18,0** mientras el botón está apretado, y al soltar da 108,0 contra 108,0 esperados |
| 4 | afuera de la barra | apretado al 60 %, llevado al 20 % y **400 px arriba** de la barra, soltado ahí: 36,0 contra 36,0 esperados |
| 6 | el cromo durante el arrastre | apretado y con el puntero casi quieto 4,3 s: el cromo sigue arriba, y sigue arriba al soltar |

## Con el dedo, en 420 × 420, y con su control

Las lecturas en `t02-el-dedo.json`, los toques por CDP (`Input.dispatchTouchEvent`).

**El caso 5 necesita un control y por eso el viewport es ése.** A 420 × 900 la
página **no scrollea** —`scrollHeight` 760 contra 760 de ventana—, así que
"arrastrar no scrolleó" ahí no prueba nada: es un chequeo que no puede fallar. A
420 × 420 sí scrollea, 687 contra 420, y entonces la pregunta tiene respuesta:

- **Control, el mismo arrastre vertical fuera del player:** `scrollY` va de 120 a
  265. La página scrollea, así que el instrumento distingue.
- **El mismo arrastre empezando en la barra:** `scrollY` se queda en 267 a lo
  largo de 160 px de movimiento hacia arriba, la pelotita va a 45 % y después a
  60 %, crece a 20 px, el `currentTime` se queda en 0 durante todo el gesto, y al
  soltar da **108,0 s contra 108,0 esperados**. El cromo sigue arriba al soltar.

El cuadro es `t02-toque-arrastrando.png`.

## Lo que ya andaba, y sigue

- **Las cinco marcas** siguen en el riel, las cinco del mismo color
  (`rgb(162,115,255)`), en los dos punteros.
- **La regla de la fase 04 no se movió**: con el cromo abajo, el primer toque lo
  sube y **no cambia el `currentTime`** (medido: 30 s antes y 30 s después). El
  scrub, como cualquier control, empieza a contar recién con el cromo arriba, y
  eso no está escrito en ninguna regla nueva: la capa no recibe punteros mientras
  está escondida.
- **La composición no se movió.** Dos cuadros con el Chrome del sistema, que es el
  que tiene los códecs: `t02-break1.png` en el segundo 25,3, con los dos videos
  del pane, y `t02-break4-quad.png` en el 100,1, con los cuatro del Quad, las
  cinco marcas y la pelotita al 55,6 % sobre el fill. Un solo error de consola en
  toda la corrida y es de red, del pane de fábrica, `aborted fatal: false`.

## La documentación, superficie por superficie

- **`docs/integrating-the-library.md` — corregida, una oración.** Su §3 enumera lo
  que el cromo le da a quien integra, y la barra pasó a hacer algo que esa lista
  no decía. La oración dice el gesto entero: un press en cualquier parte lleva la
  pelotita ahí, el seek pasa en el release, y por eso un press y release sin mover
  seekea donde se apretó. Es la misma forma de hallazgo que el cierre de la fase
  06 encontró en este archivo: la lista no era falsa, describía de menos.
- **`docs/contrato-senalizacion-renderizado.md` — nada, y por qué.** Es el contrato
  entre señalización y renderizado, y la barra es cromo: el documento no nombra el
  seek ni el gesto en ninguna de sus líneas, y las seis veces que dice "barra"
  hablan de qué se pinta —dónde están los breaks, de qué color, cómo se reparte la
  posición— y no de cómo se la toca. Nada de esta fase lo toca.
- **`demo/compatibility-pair/README.md` — nada, y por qué.** Ninguna de sus
  afirmaciones sobre la barra quedó vieja: dice que el cromo lo dibuja la
  librería y qué marca la barra, y las dos siguen siendo ciertas. Y el gesto **no
  entra al guion de la corrida**, que es una decisión del `PHASE.md` y no un
  olvido: arrastrar es un beat opcional, igual que el foco de la fase 06, y el
  guion se graba igual sin tocarlo.
- **El `README.md` de la raíz — nada.** Enruta y no describe el comportamiento del
  cromo; su única línea sobre `lib/controls.js` lista las piezas y sigue exacta.

## La suite

`t02-suite-y-costuras.txt`, verbatim: `npm test` da **49 en verde**, los mismos de
antes de la fase, y `npm run check` sigue en `both seams hold.`

## Dos notas del harness, que valen para la próxima corrida

- **Las coordenadas de la barra se leen justo antes de despachar el toque.** Un
  `currentTime` escrito a mano reacomoda la página, y un rect leído antes de eso
  manda el toque a donde la barra ya no está: se ve como "el gesto no anda" y es
  el harness. Costó tres corridas.
- **Y antes de arrastrar hay que verificar que el cromo esté arriba, no
  suponerlo.** El arrastre de control, el que scrollea la página, pasa por la
  imagen y de paso baja el cromo; el siguiente arrastre sobre la barra entonces no
  llega, que es correcto y parece un defecto.

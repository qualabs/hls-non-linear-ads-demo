# T-07, post-ejecución — las dos barras de desplazamiento, atadas

**Pedido de David sobre la página ya publicada:** que un scrub en cualquiera de las dos
barras deje a los dos panes mostrando el mismo momento del programa, para poder pararse en
un segundo cualquiera y mostrar qué pasa de un lado y del otro. La restricción de Nicolás:
**sólo código de la página**, nada de `lib/`, nada de estilo.

Lo que cambió es `demo/stage-pair/js/app.js` y nada más. `npm test` sigue en **216/216** y
`npm run check` sale **`EXIT=0`**.

## 1. Dónde se ató, y por qué ahí

El cromo de la librería cierra un scrub escribiendo **una** propiedad, al soltar: para
nuestro pane `video.currentTime`, el elemento; para el de fábrica `programme.currentTime`,
la fachada que `stock-player.js` le pasa a `attachControls`. Esas dos escrituras son toda
la superficie, así que el enlace es un accessor sobre cada una, puesto por armado. No hace
falta tocar `lib/`, ni inventar un evento, ni recalcular la geometría de la barra: el
número que el enlace transporta es el que la librería calculó.

**Y el gesto entra en la decisión, no sólo la escritura.** Medido acá: hls.js escribe
`currentTime` sobre el elemento por su cuenta —al rearmar, en la posición en la que arranca
un nivel—, así que un accessor solo toma esas escrituras por un scrub. La primera versión
de este cambio lo hacía, y la traza mostró el enlace disparando una segunda vez sin que
nadie tocara una barra. Por eso la ventana la abre un `pointerup` **sobre la barra**, en
fase de captura, y sólo la escritura que cae adentro de los 250 ms siguientes es el gesto.

**Es al soltar y no durante el arrastre**, y eso sale del mismo lugar: el cromo escribe en
`pointerup` y hasta entonces pinta la perilla de su propio puntero (ADR 0033). Así el otro
pane no se arrastra cuadro a cuadro.

## 2. La trampa, verificada antes de resolverla

Una búsqueda sobre el pane de fábrica **no entra** si ese pane está adentro de un break: la
escritura se acepta, no tira nada, y la propiedad sigue reportando el mismo segundo.
Reproducido sobre esta misma página, con el enlace apagado —o sea, la página como estaba—
escribiendo 140 s sobre el reloj del programa del pane de fábrica desde adentro del break A:

```
ADENTRO DEL BREAK A: {"nuestro": 20.101123, "stock": 20.011733333333336, "stockPlayingAd": "AD-A-LINEAR", "stockEnAd": true}
  +0.25s tras escribir 140 en el pane de fábrica: {"nuestro": 20.362902, "stock": 20.011733333333336, "stockPlayingAd": "AD-A-LINEAR", "stockEnAd": true}
  + 0.5s tras escribir 140 en el pane de fábrica: {"nuestro": 20.868231, "stock": 20.011733333333336, "stockPlayingAd": "AD-A-LINEAR", "stockEnAd": true}
  + 1.0s tras escribir 140 en el pane de fábrica: {"nuestro": 21.873506, "stock": 20.011733333333336, "stockPlayingAd": "AD-A-LINEAR", "stockEnAd": true}
  + 2.0s tras escribir 140 en el pane de fábrica: {"nuestro": 23.879141, "stock": 20.011733333333336, "stockPlayingAd": "AD-A-LINEAR", "stockEnAd": true}
  + 4.0s tras escribir 140 en el pane de fábrica: {"nuestro": 27.861579, "stock": 20.011733333333336, "stockPlayingAd": "AD-A-LINEAR", "stockEnAd": true}
```

Cuatro segundos después de la escritura el pane de fábrica sigue clavado en 20,01. Es lo
mismo que la T-07 midió como 90,79 s de separación, visto de cerca.

**Tres cosas la contestan, y cada una contesta una mitad distinta:**

- **Un destino adentro de un break** se convierte en la cabeza de ese break, `objetivoSeguro`,
  que es lo que el switch y los botones de salto ya hacen: es un segundo en el que el reloj
  del programa del otro pane no puede pararse, así que no es un destino para un PAR.
- **Un gesto hecho con el pane de fábrica adentro de un break** rearma los dos, que es el
  mecanismo de la T-07 y el único que se sabe que entra: después de un rearmado los dos
  están en la cabeza del programa y fuera de todos los breaks. Se le pregunta al pane —su
  propio `playingAd`— y no se deduce del reloj. Es el camino caro y cae en un gesto de cada
  quince: los tres breaks son 36 s de un programa de 198.
- **Toda búsqueda barata se lee de vuelta**, porque las dos de arriba son razones para
  esperar que entre y no una prueba de que entró. Si 400 ms después el pane de fábrica no
  está dentro de `TOLERANCIA`, se rearma igual. Y si ni el rearmado alcanza, la página lo
  dice por consola: `the off-the-shelf pane never took …s … the pair is NOT at the same
  second`. Eso es lo que hace que no falle en silencio, que era la condición.

**Lo que queda afuera, dicho y no escondido:** un scrub a un segundo que cae adentro de un
break aterriza en la cabeza de ese break, y un scrub tomado durante un break cuesta un
rearmado, que se ve. Las dos cosas están en pantalla.

## 3. La medición, con su control

`demo/stage-pair/test/medir-enlace-de-barras.py`, sobre `index.html` y con el gesto hecho
como lo hace una persona: el puntero se apoya sobre la barra, se arrastra en pasos y se
suelta. Nada se escribe en ningún reloj desde el instrumento.

**La propiedad medida** es la separación entre los dos relojes del programa después de
soltar, leídos **en la misma llamada**. **El control** es la misma corrida con el enlace
apagado (`window.demo.enlace = false`), que deja la página como estaba: cada barra mueve su
pane. Y el control **exige la negación exacta de lo que exige la medición** —que el par NO
quede junto en lo que la barra pidió— y no un umbral propio, porque el caso 6 del control
es la trampa misma: ahí no se mueve nada, así que la separación queda chica porque el seek
no ocurrió. Que el instrumento sabe encontrar una separación lo prueban los casos donde la
encuentra: **131,5 s, 131,4 s, 61,4 s, 54,1 s y 122,4 s.**

```
server PID 3075153 en el puerto 8099

══════════════════════════════════════════════════════════════════════════════
CON EL ENLACE PRENDIDO
══════════════════════════════════════════════════════════════════════════════

  1. desde NUESTRA barra, destino fuera de un break
      antes del gesto   nuestro    8.00   fábrica    8.00   
      la barra pidió     140.00 s  (fracción 0.707 de 198.00 s)   → objetivo seguro 140.00 s
      después           nuestro  140.49   fábrica  140.46   SEPARACIÓN    0.03 s   camino: directo   (en aviso: nuestro False, fábrica False)
      -> VERDE   (juntos: True, llegaron a lo pedido: True)

  2. desde la barra de FÁBRICA, destino fuera de un break
      antes del gesto   nuestro    8.00   fábrica    8.00   
      la barra pidió     140.00 s  (fracción 0.707 de 198.02 s)   → objetivo seguro 140.00 s
      después           nuestro  140.54   fábrica  140.45   SEPARACIÓN    0.08 s   camino: directo   (en aviso: nuestro False, fábrica False)
      -> VERDE   (juntos: True, llegaron a lo pedido: True)

  3. desde NUESTRA barra, destino ADENTRO del break B
      antes del gesto   nuestro    8.00   fábrica    8.00   
      la barra pidió      70.00 s  (fracción 0.354 de 198.00 s)   → objetivo seguro 60.00 s   [el destino cae adentro de un break]
      después           nuestro   60.47   fábrica   60.22   SEPARACIÓN    0.25 s   camino: directo   (en aviso: nuestro False, fábrica False)
      -> VERDE   (juntos: True, llegaron a lo pedido: True)

  4. desde la barra de FÁBRICA, destino ADENTRO del break B
      antes del gesto   nuestro    8.00   fábrica    8.00   
      la barra pidió      70.00 s  (fracción 0.354 de 198.02 s)   → objetivo seguro 60.00 s   [el destino cae adentro de un break]
      después           nuestro   60.43   fábrica   60.22   SEPARACIÓN    0.22 s   camino: directo   (en aviso: nuestro False, fábrica False)
      -> VERDE   (juntos: True, llegaron a lo pedido: True)

  5. LA TRAMPA: gesto desde NUESTRA barra con el par ADENTRO del break A
      antes del gesto   nuestro   20.30   fábrica   20.01   (los dos adentro del break)
      la barra pidió     140.00 s  (fracción 0.707 de 198.00 s)   → objetivo seguro 140.00 s
      después           nuestro  140.72   fábrica  140.46   SEPARACIÓN    0.27 s   camino: rearmado   (en aviso: nuestro False, fábrica False)
      consola: [app] scrub from the demo bar to 140.00s while the off-the-shelf pane is inside a break: it cannot take a seek there, so both are rebuilt
      -> VERDE   (juntos: True, llegaron a lo pedido: True)

  6. LA TRAMPA: gesto desde la barra de FÁBRICA con el par ADENTRO del break A
      antes del gesto   nuestro   20.26   fábrica   20.01   (los dos adentro del break)
      la barra pidió     140.00 s  (fracción 0.707 de 198.02 s)   → objetivo seguro 140.00 s
      después           nuestro  140.63   fábrica  140.45   SEPARACIÓN    0.18 s   camino: rearmado   (en aviso: nuestro False, fábrica False)
      consola: [app] scrub from the stock bar to 140.00s while the off-the-shelf pane is inside a break: it cannot take a seek there, so both are rebuilt
      -> VERDE   (juntos: True, llegaron a lo pedido: True)

══════════════════════════════════════════════════════════════════════════════
EL CONTROL — EL ENLACE APAGADO, cada barra mueve su pane
══════════════════════════════════════════════════════════════════════════════

  1. desde NUESTRA barra, destino fuera de un break
      antes del gesto   nuestro    8.00   fábrica    8.00   
      la barra pidió     140.00 s  (fracción 0.707 de 198.00 s)   → objetivo seguro 140.00 s
      después           nuestro  142.40   fábrica   10.87   SEPARACIÓN  131.53 s   camino: —   (en aviso: nuestro False, fábrica False)
      -> VERDE   (juntos: False, llegaron a lo pedido: True; el control exige que NO se den las dos)

  2. desde la barra de FÁBRICA, destino fuera de un break
      antes del gesto   nuestro    8.00   fábrica    8.00   
      la barra pidió     140.00 s  (fracción 0.707 de 198.01 s)   → objetivo seguro 140.00 s
      después           nuestro   10.88   fábrica  142.32   SEPARACIÓN  131.44 s   camino: —   (en aviso: nuestro False, fábrica False)
      -> VERDE   (juntos: False, llegaron a lo pedido: True; el control exige que NO se den las dos)

  3. desde NUESTRA barra, destino ADENTRO del break B
      antes del gesto   nuestro    8.00   fábrica    8.00   
      la barra pidió      70.00 s  (fracción 0.354 de 198.00 s)   → objetivo seguro 60.00 s   [el destino cae adentro de un break]
      después           nuestro   72.26   fábrica   10.85   SEPARACIÓN   61.41 s   camino: —   (en aviso: nuestro True, fábrica False)
      -> VERDE   (juntos: False, llegaron a lo pedido: True; el control exige que NO se den las dos)

  4. desde la barra de FÁBRICA, destino ADENTRO del break B
      antes del gesto   nuestro    8.00   fábrica    8.00   
      la barra pidió      70.00 s  (fracción 0.354 de 198.02 s)   → objetivo seguro 60.00 s   [el destino cae adentro de un break]
      después           nuestro   10.86   fábrica   65.00   SEPARACIÓN   54.14 s   camino: —   (en aviso: nuestro False, fábrica True)
      -> VERDE   (juntos: False, llegaron a lo pedido: True; el control exige que NO se den las dos)

  5. LA TRAMPA: gesto desde NUESTRA barra con el par ADENTRO del break A
      antes del gesto   nuestro   20.29   fábrica   20.01   (los dos adentro del break)
      la barra pidió     140.00 s  (fracción 0.707 de 198.00 s)   → objetivo seguro 140.00 s
      después           nuestro  142.39   fábrica   20.01   SEPARACIÓN  122.38 s   camino: —   (en aviso: nuestro False, fábrica True)
      -> VERDE   (juntos: False, llegaron a lo pedido: True; el control exige que NO se den las dos)

  6. LA TRAMPA: gesto desde la barra de FÁBRICA con el par ADENTRO del break A
      antes del gesto   nuestro   20.15   fábrica   20.01   (los dos adentro del break)
      la barra pidió     140.00 s  (fracción 0.707 de 198.02 s)   → objetivo seguro 140.00 s
      después           nuestro   23.14   fábrica   20.01   SEPARACIÓN    3.13 s   camino: —   (en aviso: nuestro True, fábrica True)
      consola: [app] the off-the-shelf pane never took 17.00s: it is at 20.01s and the pair is NOT at the same second
      -> VERDE   (juntos: False, llegaron a lo pedido: False; el control exige que NO se den las dos)

server 3075153 bajado

VERDE: el enlace deja los dos panes en el mismo segundo, y el control sin enlace los deja separados.
```

## 4. Las capturas

Los dos panes después de un seek, a 1907 de ancho. Con el enlace, los dos en el mismo
cuadro y las dos perillas en el mismo lugar; sin el enlace, dos escenas distintas de la
misma película.

| | |
| --- | --- |
| [`enlace-on-caso-1.png`](enlace-on-caso-1.png) | scrub en NUESTRA barra a 140 s: fábrica `2:20 · 140.2s`, nuestro `140.5s` |
| [`enlace-on-caso-2.png`](enlace-on-caso-2.png) | el mismo seek desde la barra de FÁBRICA |
| [`enlace-on-caso-3.png`](enlace-on-caso-3.png) · [`…caso-4.png`](enlace-on-caso-4.png) | destino adentro del break B, resuelto a la cabeza del break |
| [`enlace-on-caso-5.png`](enlace-on-caso-5.png) · [`…caso-6.png`](enlace-on-caso-6.png) | la trampa: el gesto con el par adentro del break A, por el camino del rearmado |
| [`enlace-off-caso-1.png`](enlace-off-caso-1.png) … [`…caso-6.png`](enlace-off-caso-6.png) | el control: el mismo gesto sin enlace. En el 1, fábrica `10.6s` y nuestro `142.3s` |

## 5. Lo que este cambio NO hizo

- **No tocó `lib/`**, ni el CSS, ni `index.html`, ni `inspect.html`, ni `race.html`, ni sus
  módulos, ni ninguna de las cuatro demos publicadas.
- **No commiteó, no pusheó y no publicó nada a GCS.** La demo publicada sigue siendo la de
  antes de este cambio.
- **No midió nada sobre iOS ni sobre Safari.** Todo en el Chrome real del sistema.

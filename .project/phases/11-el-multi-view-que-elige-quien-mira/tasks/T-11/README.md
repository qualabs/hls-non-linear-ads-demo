# T-11 — La página de la demo y la corrida mirada

Dos entregables y son independientes: la **página de verdad** de
`demo/multiview-offer/`, que reemplaza a la mínima que había dejado el cableado de
`attach()`, y la **corrida de 180 s mirada entera**, sin saltos, a dos anchos.

## Qué hay en esta carpeta

| archivo | qué es |
| --- | --- |
| `lecturas.txt` | la corrida, una línea por cambio de estado: el contrato, los `<video>` del contenedor y la línea que la página imprime. Más las tres lecturas seguidas de los cuatro decodificadores, la lista con la grilla llena, y la galería de formas al final |
| `corrida-1440.jsonl` / `corrida-420.jsonl` | la muestra cruda, cada 0,5 s, de las dos corridas completas (321 y 327 muestras) |
| `mirar-la-corrida.py` | el guión que la manejó: se conecta por CDP al Chrome que ya estaba, abre una página propia, fija el viewport exacto, reproduce de 0 a 180 sin buscar, y hace los gestos de quien mira en los segundos que declara |
| `capturas-1440/` | las capturas a 1440x900, una por momento del recorrido más las tres secciones de abajo |
| `capturas-420/` | lo mismo a 420x860 |
| `suites.txt` | la salida de `npm test` y `npm run check`, verbatim |

## La corrida, tramo por tramo

Los números salen de `lecturas.txt` y son del ancho de 1440; los de 420 dan lo mismo
salvo por el hallazgo 2.

| t | qué pasó |
| --- | --- |
| 1,7 | el programa solo, un `<video>` |
| 17,1 | aparece un segundo `<video>`, pausado y sin datos: el renderizado trae el aviso tres segundos antes de su turno |
| 20,1 – 32,1 | **el aviso concurrente.** `cornerOverlay`, dos elementos, el primario a cuadro entero y `adOverlay1` en `0 75 75 0`. Dos decodificadores corriendo. La clase vieja no cambió de comportamiento |
| 45,4 | **se abre la primera oferta.** El popup *Multi view available* aparece, y el punto se prende en el botón de la lista. Cero elementos: la ventana está abierta y no hay composición, que son dos cosas distintas |
| 48,9 | se abre la lista. El popup ya se fue; el punto sigue |
| 51,4 | **dos cajas**: `25 50 25 0` y `25 0 25 50`, el side by side con banda arriba y abajo. El punto se apaga |
| 60,6 | **tres cajas**: `0 50 50 0`, `0 0 50 50` y `50 25 0 25` |
| 69,3 | **cuatro cajas**, la grilla de 2x2. Cuatro `<video>`, todos `readyState` 4, ninguno pausado, `currentTime` avanzando |
| 78,6 | **agrandar.** La caja sale de su lugar y va al final de la lista con `box` en `0 0 0 0` y el `zDepth` más alto; el primario baja a `volume` 0 y la caja agrandada queda en 1 y sin mute. Foco completo, en una sola llamada |
| 88,4 | **desagrandar.** Vuelve la grilla de 2x2 y **el audio se queda con la vista**: el primario sigue en 0 y la que estaba grande sigue en 1 |
| 97,1 | **salir con el botón.** Cero elementos, un `<video>` |
| 105,5 | se cierra la ventana |
| 120,4 | **se abre la segunda oferta**, cinco vistas. Popup y punto otra vez |
| 127,2 / 131,8 / 136,8 | dos, tres y cuatro cajas |
| 141,2 | **la grilla llena.** Las dos filas que no están arriba quedan deshabilitadas y la nota dice *"4 boxes is what the screen holds. Lower one to raise another."* |
| 145,8 | **bajar una.** Quedan tres cajas y las dos que sobreviven se mueven a su lugar nuevo |
| 148,2 | **subir la que estaba deshabilitada.** Cuatro cajas otra vez |
| 158,1 → 162,2 | **la otra salida**: destildar hasta que no queda ninguna. Cero elementos, y el punto vuelve a prenderse, que es lo correcto: la ventana sigue abierta y no hay nada arriba |
| 175,3 | se cierra la ventana |
| 179,5 | el programa solo |

### Los cuatro decodificadores

Es el instrumento que la fase pide, y no una captura:

```
t=69.83
   video[0]  readyState=4  paused=False  currentTime=69.83  1280x720  volume=1  muted=False
   video[1]  readyState=4  paused=False  currentTime=24.60  1280x720  volume=0  muted=True
   video[2]  readyState=4  paused=False  currentTime=24.52  1280x720  volume=0  muted=True
   video[3]  readyState=4  paused=False  currentTime=24.57  1280x720  volume=0  muted=True
t=72.93   ... currentTime=72.93 / 27.70 / 27.63 / 27.68
t=75.69   ... currentTime=75.69 / 30.48 / 30.41 / 30.46
```

Tres lecturas y no una, porque una sola no distingue un decodificador que avanza de
uno congelado en un cuadro: entre la primera y la tercera pasan 5,86 s de programa y
las tres vistas avanzan 5,88 / 5,89 / 5,89.

### Que la composición se mueve y no se reconstruye

Sale de la misma columna, en el momento en que se baja una vista con la grilla llena:
a t=136,83 las tres vistas leen `currentTime` 16,57 / 16,58 / 16,59; a t=145,83, ya con
una menos y las otras dos en cajas nuevas, leen 25,58 / 25,58. Nueve segundos de
programa, nueve segundos de vista, sin volver a cero y sin rebufferear.

### La salida

`style=null · volume=1` en el `<video>` primario **antes de componer nada** y
`style=null · volume=1` **después de salir**, por los dos caminos. Durante la
composición el atributo lleva el `transform` que mueve la imagen, así que la lectura
tiene forma de dar distinto. Está en la propia página, en la sección 2, y cualquiera
la puede mirar cambiar.

### La consola

Un `[signalling]` por Date Range resuelto, tres y no más:

```
[signalling] BREAK-1-CONCURRENT at t=20.00s, asset-list .../asset-list-cornerOverlay.json
[signalling] BREAK-2-MULTIVIEW  at t=45.00s, asset-list .../asset-list-offer-3.json
[signalling] BREAK-3-MULTIVIEW  at t=120.00s, asset-list .../asset-list-offer-5.json
```

La línea nombra el ID y el asset-list; **la clase no está en la línea**, está en el tag,
y el tag lo imprime la página en la sección 3 leyéndolo de la playlist servida.

## La página

`index.html`, `css/page.css`, `js/{app,opening,recorrido,contrato,senalizacion,dom}.js`,
`brand/` (copia de la del kit, como las otras dos demos) y `README.md`.

La forma es la que fijó el ADR 0077: apertura, player, tres secciones de pantalla
completa y los créditos como pie. **No hay recorrido guiado, y es la demo y no una
omisión**: acá no pasa nada hasta que alguien tilda una fila, así que un guion que
tildara por vos argumentaría lo contrario de lo que la página dice. Lo que hay abajo
del player es el mapa del recorrido, leído de `programRanges()`.

**Nada afirma nada que no haya leído.** Las cajas del aviso son los cuatro porcentajes
que el payload declaró; los nombres de los catálogos son los `name` del asset-list; los
nombres de campo de la comparación son las claves de un `Element` y de una `view`
reales; los tags son las líneas de la playlist; la galería de formas se llena sola a
medida que la corrida las recorre, con el segundo en que pasó. No hay una sola captura
ni un solo porcentaje escrito a mano en el repositorio.

## Hallazgos

Van en el informe. Los dos que tocan código ajeno se reportan y no se arreglan.

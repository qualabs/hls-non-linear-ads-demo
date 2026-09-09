# T-02 — La demo nueva corre, con el plate suplente

`demo/hydration-break/` existe y `PORT=8081 ./run.sh hydration-break` la levanta. En
pantalla corre el minuto del break de hidratación con sus cuatro avisos en la curva de
intrusión del ADR 0043, y **todavía con el material de la demo actual como suplente**.

**La sdk no se tocó y `demo/compatibility-pair/` tampoco.** El único archivo de la raíz
que participa es `run.sh` tal como está, y el puerto sale de la variable `PORT` que
`server.mjs` ya leía: el 8080 de Nicolás quedó arriba y sirviendo la demo de siempre.

## El recorrido, impreso por el propio script

`t02-el-recorrido.txt` lo trae completo. La tabla:

```
  break  t= 15s a  73s  (58s)  la parada del juego
      aviso 1  t= 15s a  31s  lowerThirdOverlay  concurrente  image/jpeg
      aviso 2  t= 31s a  47s  squeezebackLShape  concurrente  application/vnd.apple.mpegurl
      aviso 3  t= 47s a  57s  linear             a cuadro entero, el programa corre detrás
      aviso 4  t= 57s a  73s  cornerOverlay      concurrente  application/vnd.apple.mpegurl
```

El plate son 90 s y el break arranca en el 15, que es el `paradaEn` de `plate.json`.

## Lo que el player resolvió, leído del contrato

`programRanges()` devuelve **un** rango, `HYDRATION-BREAK`, `kind: concurrent`, en el
segundo 15 y por 58 s. Un solo Date Range y no un par: esta demo no lleva el par de
compatibilidad (ADR 0043).

Las cuatro experiencias, con sus cajas tal como el contrato las entrega:

| itemId | type | arranca | dura | medio del aviso |
| --- | --- | --- | --- | --- |
| `HYDRATION-BREAK.0` | `lowerThirdOverlay` | 15 | 16 | **`image/jpeg`** |
| `HYDRATION-BREAK.1` | `squeezebackLShape` | 31 | 16 | `application/vnd.apple.mpegurl` |
| `HYDRATION-BREAK.2` | `linear` | 47 | 10 | `null`, es su propio `URI` |
| `HYDRATION-BREAK.3` | `cornerOverlay` | 57 | 16 | `application/vnd.apple.mpegurl` |

El lineal llega como una experiencia de tipo `linear` con dos elementos, el primario y
el aviso, los dos con caja `{0,0,0,0}` y el aviso un `zDepth` más arriba: es el camino
único del ADR 0019, sin una línea de código nueva.

## Las cuatro capturas, y la línea de estado de cada una

La línea la escribe la página leyendo el contrato, y dice de qué forma es el aviso sin
saber nada del asset list:

| captura | línea de estado |
| --- | --- |
| `t02-aviso1-banner-imagen.png` | `22.2s · ad on screen: lowerThirdOverlay · still image · the match is still playing` |
| `t02-aviso2-l.png` | `38.2s · ad on screen: squeezebackLShape · video · the match is still playing` |
| `t02-aviso3-lineal.png` | `53.2s · ad on screen: linear · video · the match is underneath, covered` |
| `t02-aviso4-overlay.png` | `64.2s · ad on screen: cornerOverlay · video · the match is still playing` |

El `covered` del tercero se lee del contrato y no del tipo del aviso: un aviso que tapa
es una caja y un `zDepth`, así que cualquier layout que alguna vez declare una recibe la
misma línea sin que la página aprenda nada nuevo.

## El corrimiento de la parada, declarado una vez

`plate.json` lleva `largo`, `paradaEn` y `paradaDura`. Lo leen **los dos scripts** con
`node -e`: el que empaqueta el plate toma `largo`, y el que señaliza toma `paradaEn` para
poner el `START-DATE` del Date Range ahí. Ninguno de los dos números está escrito dos
veces (ADR 0044). El chequeo que lo asierta es de la T-07.

## Un defecto encontrado y arreglado en el camino

**El picture no entraba en el viewport y el banner del primer aviso caía abajo del
pliegue.** Con el ancho como único tope —`max-width: min(1600px, 100%)`— un cuadro de
16:9 en una ventana de 1920×887 mide 1600×900 y no cabe, así que la franja inferior del
banner, que es justamente el aviso, quedaba fuera de la pantalla. Se ve en la primera
captura que saqué y por eso está el arreglo: el ancho ahora está topeado también por el
alto disponible, `min(1600px, 100%, calc((100vh - 260px) * 16 / 9))`, y la relación de
aspecto convierte ese alto de vuelta en ancho. Medido después: el player mide 1115×627 y
termina en el píxel 730 de 887.

Es un defecto de la estética y no de la señalización —una idea por pantalla, y una página
que hay que scrollear para ver el pie del video tiene dos— y por eso el arreglo vive en
el CSS con el motivo escrito al lado.

## Dos cosas que quedan dichas y no resueltas

- **No hay asset de la marca de SVTA en el repositorio.** El branding del proyecto pide
  la marca de Qualabs junto a la de SVTA, y lo único que hay vendorizado es el kit de
  Qualabs. La página pone `with the SVTA` como texto, que es lo honesto: **no se fabrica
  el logo de un tercero.** Si se consigue el archivo, entra en `brand/` con su
  procedencia como los de Qualabs.
- **El material es provisorio y está dicho en tres lugares**: el encabezado de
  `scripts/preparar-contenido.sh`, la línea de crédito de la página, y la salida del
  propio script.

## Verificación

`npm test` en 49 verdes y `npm run check` en `both seams hold.` El grep del ADR 0015 pasa
porque esta task no tocó `lib/`.

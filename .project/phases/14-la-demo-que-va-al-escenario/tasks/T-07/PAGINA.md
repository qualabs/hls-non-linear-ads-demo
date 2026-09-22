# T-07 — `index.html`: el par, con el control de decodificadores

**La página principal existe y corre.** Dos panes sobre la misma playlist, el recorrido
pasando por las tres formas no lineales, y un switch de tres posiciones donde
`qa-decoder-count` **viaja de verdad** —leído de la red, con su control negativo en rojo— y
la composición cambia de **dos** elementos `<video>` a **uno** sin cambiar el layout, la
campaña ni la duración.

Los dos panes siguen entrando y saliendo de los tres breaks con menos de 0,06 s de
diferencia, y el control del tramo invertido abre a 12 s.

`npm test` sigue en **207/207** y `npm run check` sale **`EXIT=0`**.

## 1. Qué quedó escrito

| archivo | qué es |
| --- | --- |
| `demo/stage-pair/index.html` | la página: masthead, el switch, el par, los pedidos que se hicieron y los créditos |
| `demo/stage-pair/js/app.js` | el bloque cercado del integrador, el armado de los dos panes, el switch y los saltos |
| `demo/stage-pair/js/stock-player.js` | **copia byte a byte** de `demo/compatibility-pair/js/stock-player.js` (`cmp` sin salida) |
| `demo/stage-pair/css/player.css` | la hoja **de las tres páginas** de la demo, adaptada de la del par de compatibilidad |
| `demo/stage-pair/brand/` | el kit de marca copiado de `demo/hydration-break/brand/`, con su `README.md` |
| `demo/stage-pair/test/medir-escalera.py` | el instrumento de las tres mediciones de abajo, con sus controles |

`js/contract-trace.js` ya estaba: lo trajo la T-06 porque el chequeo de costuras lo
necesitaba.

## 2. Las capturas

Una por posición del switch a los dos anchos contra los que este proyecto mide, y las tres
formas a 1907. Todas tomadas con el aviso **en pantalla**, que es lo único que hay que mirar.

| | |
| --- | --- |
| [`pagina-1907-paso-not-declared-break-a.png`](pagina-1907-paso-not-declared-break-a.png) | side by side, el aviso en video |
| [`pagina-1907-paso-1-break-a.png`](pagina-1907-paso-1-break-a.png) | **el mismo break**, el mismo dibujo, `image/svg+xml` |
| [`pagina-1907-paso-2-break-a.png`](pagina-1907-paso-2-break-a.png) | el mismo break con el parámetro en 2 |
| [`pagina-1907-paso-2-break-b.png`](pagina-1907-paso-2-break-b.png) · [`…paso-1-break-b.png`](pagina-1907-paso-1-break-b.png) | la L de KETRAVA, en los dos medios |
| [`pagina-1907-paso-2-break-c.png`](pagina-1907-paso-2-break-c.png) · [`…paso-1-break-c.png`](pagina-1907-paso-1-break-c.png) | el banner de KOVRIN, en los dos medios |
| [`pagina-400-paso-not-declared-break-a.png`](pagina-400-paso-not-declared-break-a.png) · [`…paso-1…`](pagina-400-paso-1-break-a.png) · [`…paso-2…`](pagina-400-paso-2-break-a.png) | los tres escalones a 400 × 780 |

## 3. Cómo se rearman los dos players, que es lo que el switch obliga

`decoderCount` se lee **una sola vez**, al crear la señalización (`createSignalling`, en
`lib/signalling.js`), con el argumento escrito de por qué: lo que ese valor puede tener de
equivocado es una afirmación del integrador, y es una y no una por break. Así que cambiarlo
en vivo rearma el player con cualquier diseño, y rearmarlo no es un rodeo sino el contrato.

**Los dos lados se rearman en una sola llamada, `armar(posición, objetivo)`**, que derriba los
dos —`hls.destroy()` en las dos instancias, y el DOM de los dos contenedores reemplazado— y
construye los dos con **el mismo segundo objetivo**. Rearmar un lado y no el otro los deja en
líneas de tiempo distintas, y ahí el par deja de argumentar; que la invariante no dependa de
que alguien se acuerde es la razón de que sea una función y no dos.

**El segundo del programa se conserva**, porque el evento da unos dos minutos para todo y un
switch que devolviera la corrida a cero costaría veinte segundos hasta el primer break cada
vez que se lo toca.

**Y los saltos a un break rearman también**, por una razón medida que es la parte no obvia de
esta task:

- **Una búsqueda sobre el pane de fábrica sólo entra cuando ese pane está fuera de un break.**
  Adentro, la escritura sobre `interstitialsManager.primary.currentTime` se acepta, no tira
  ningún error, y la propiedad sigue reportando el mismo segundo: hls.js está reproduciendo el
  aviso lineal y el tag lleva `X-RESTRICT="SKIP"`. El nuestro no tiene esa restricción porque
  nunca se reemplazó nada (ADR 0016), así que se movía solo. Medido: los dos panes a **90,79 s
  de distancia** después de saltar al break C desde adentro del break A.

  ```
  jump «break C»  {'nuestro': 112.58, 'stock': 20.0, ..., 'delta': 90.79}
  jump «break B»  {'nuestro': 65.9,   'stock': 20.01, ..., 'delta': 45.89}
  ```

  Con el rearmado, la misma secuencia:

  ```
  jump «break C»  {'nuestro': 112.58, 'stock': 110.01, ..., 'delta': 2.57}
  jump «break B»  {'nuestro': 67.63,  'stock': 65.01,  ..., 'delta': 2.62}
  jump «start»    {'nuestro': 7.77,   'stock': 7.7,    ..., 'delta': 0.07}
  ```

  Los ~2,6 s que quedan en las filas de break **no son separación**: el reloj del programa del
  pane de fábrica se congela en el segundo en que el break empezó, que es lo que la cabecera de
  `stock-player.js` ya tiene medido. Fuera de break dan 0,07 s.

- **Una escritura hecha demasiado temprano también se acepta y se pierde.** Justo después de un
  rearmado, `interstitialsManager.primary` ya existe, la escritura vuelve sin tirar nada y el
  pane se queda donde estaba. Por eso el seek de esta página **se lee de vuelta**: se escribe,
  se espera un cuarto de segundo, y si no llegó se reintenta, hasta veinte veces. Esperar una
  bandera de listo más sería adivinar cuál; leer lo que se escribió es la propiedad que importa
  y es la misma de los dos lados.

- **Un objetivo adentro de un break se convierte en la cabeza de ese break**, porque es un
  segundo que el otro pane no puede alcanzar. No se pierde nada con eso: tocar el switch en
  mitad de un break y que el break arranque de nuevo desde arriba es exactamente cómo se
  comparan los dos formatos del mismo aviso, que es para lo que el switch existe.

## 4. Las tres mediciones, con sus controles

Todas sobre **`index.html`**, no sobre un banco: `demo/stage-pair/test/medir-escalera.py`
maneja la página real, toca el switch por el botón y levanta y baja su propio server por el
PID que guardó.

```
$ ./demo/stage-pair/test/medir-escalera.py --puerto 8096
server PID 2764282 en el puerto 8096

== 1. EL PARÁMETRO VIAJA — leído de la red, no del código ==

  posición «not declared»  ->  playlist rica
    /signalling/asset-list-break-a-rica.json
    /signalling/asset-list-break-b-rica.json
    /signalling/asset-list-break-c-rica.json
    -> 3 pedidos, 0 con qa-decoder-count.  VERDE: el control negativo no lleva el parámetro

  posición «1»  ->  playlist magra
    /signalling/asset-list-break-a-magra.json?qa-decoder-count=1
    /signalling/asset-list-break-b-magra.json?qa-decoder-count=1
    /signalling/asset-list-break-c-magra.json?qa-decoder-count=1
    -> 3 pedidos, todos con qa-decoder-count=1.  VERDE

  posición «2»  ->  playlist rica
    /signalling/asset-list-break-a-rica.json?qa-decoder-count=2
    /signalling/asset-list-break-b-rica.json?qa-decoder-count=2
    /signalling/asset-list-break-c-rica.json?qa-decoder-count=2
    -> 3 pedidos, todos con qa-decoder-count=2.  VERDE

== 2. LA CUENTA DE ELEMENTOS <video> POR ESCALÓN, SOBRE LA PÁGINA REAL ==
   (adentro del contenedor de nuestro pane; el escalón rico es el control)

  posición «not declared»  ->  playlist rica
    break A  fuera del break (t= 11.18): 1 video / 0 img   DENTRO: 2 video / 0 img   medio del aviso: application/vnd.apple.mpegurl   layout: squeezebackDoubleBox   OK
    break B  fuera del break (t= 56.31): 1 video / 0 img   DENTRO: 2 video / 0 img   medio del aviso: application/vnd.apple.mpegurl   layout: squeezebackLShape   OK
    break C  fuera del break (t=101.24): 1 video / 0 img   DENTRO: 2 video / 0 img   medio del aviso: application/vnd.apple.mpegurl   layout: lowerThirdOverlay   OK

  posición «1»  ->  playlist magra
    break A  fuera del break (t= 11.00): 1 video / 0 img   DENTRO: 1 video / 1 img   medio del aviso: image/svg+xml   layout: squeezebackDoubleBox   OK
    break B  fuera del break (t= 56.30): 1 video / 0 img   DENTRO: 1 video / 1 img   medio del aviso: image/svg+xml   layout: squeezebackLShape   OK
    break C  fuera del break (t=101.26): 1 video / 0 img   DENTRO: 1 video / 1 img   medio del aviso: image/svg+xml   layout: lowerThirdOverlay   OK

  posición «2»  ->  playlist rica
    break A  fuera del break (t= 11.00): 1 video / 0 img   DENTRO: 2 video / 0 img   medio del aviso: application/vnd.apple.mpegurl   layout: squeezebackDoubleBox   OK
    break B  fuera del break (t= 56.20): 1 video / 0 img   DENTRO: 2 video / 0 img   medio del aviso: application/vnd.apple.mpegurl   layout: squeezebackLShape   OK
    break C  fuera del break (t=101.26): 1 video / 0 img   DENTRO: 2 video / 0 img   medio del aviso: application/vnd.apple.mpegurl   layout: lowerThirdOverlay   OK

== 3. LOS DOS PANES ENTRAN Y SALEN JUNTOS — index.html, escalón rico ==
  break A  fábrica  20.001 ->  32.078   nuestro  19.945 ->  32.046   delta entrada  0.056 s  salida  0.033 s   IGUAL
  break B  fábrica  64.973 ->  77.075   nuestro  64.965 ->  77.030   delta entrada  0.008 s  salida  0.045 s   IGUAL
  break C  fábrica 109.962 -> 122.077   nuestro 109.922 -> 122.068   delta entrada  0.040 s  salida  0.009 s   IGUAL

==    EL CONTROL — el break concurrente dura 24.0 s y su lineal no ==
  break A  fábrica  19.790 ->  32.078   nuestro  19.908 ->  44.100   delta entrada  0.118 s  salida 12.021 s   DISTINTO
  break B  fábrica  64.953 ->  77.075   nuestro  64.988 ->  89.002   delta entrada  0.035 s  salida 11.927 s   DISTINTO
  break C  fábrica 109.969 -> 122.077   nuestro 109.976 -> 134.044   delta entrada  0.006 s  salida 11.967 s   DISTINTO

server 2764282 bajado

VERDE: las mediciones dieron lo esperado y los controles también.
EXIT=0
```

### El lector del parámetro, visto en rojo

Un cero no es un resultado hasta que el instrumento demuestra que sabe encontrar. La
posición "sin declarar" es el control negativo, así que se le plantó el parámetro a propósito
—`decoderCount: posicion.valor ?? 2`— y el control tiene que ponerse rojo. Se puso:

```
$ sed -i 's/    decoderCount: posicion.valor$/    decoderCount: posicion.valor ?? 2 \/* PLANTADO *\//' demo/stage-pair/js/app.js
$ ./demo/stage-pair/test/medir-escalera.py --puerto 8096 --que parametro

  posición «not declared»  ->  playlist rica
    /signalling/asset-list-break-a-rica.json?qa-decoder-count=2
    /signalling/asset-list-break-b-rica.json?qa-decoder-count=2
    /signalling/asset-list-break-c-rica.json?qa-decoder-count=2
    -> 3 pedidos, 3 con qa-decoder-count.  ROJO

ROJO: 1 fila(s) no dieron lo esperado.
```

Sacado el plantado, `grep -c PLANTADO` da 0 y la fila vuelve a verde.

**Y el contra-control ya está adentro de la corrida normal**: las posiciones 1 y 2 exigen el
valor exacto, así que un lector que nunca encontrara nada daría verde en la primera fila y
rojo en las otras dos. El cero de la primera fila sale del mismo lector que encuentra los
`=1` y los `=2`.

### El instrumento se equivocó dos veces, y en las dos el rojo era suyo

Las dos primeras corridas dieron `ROJO` en filas que resultaron ser del instrumento, y las dos
están arregladas adentro del script con su comentario:

1. **El pedido del último break de la corrida anterior llegaba después del click que rearma**,
   así que la lista cruda de la posición "sin declarar" traía cuatro pedidos y no tres. Se
   comparan **las URI distintas**: un pedido del escalón equivocado llevaría otro valor del
   parámetro —o ninguno— y las dos ramas de la aserción lo siguen cazando.
2. **La referencia "fuera del break" se tomaba demasiado cerca del break.** `bringAhead`
   construye el nodo del aviso hasta 3 s antes de que se vea (medido en la T-02), y además el
   renderizador limpia en su propio bucle de cuadro, así que la muestra siguiente a una
   búsqueda todavía podía contar el nodo del break del que se acababa de salir. Ahora la
   referencia se toma a **nueve segundos** del break y se confirma con una segunda muestra, y
   el `t` de cada una va impreso en la fila para que se pueda auditar.

Que lo que sobraba fuera el nodo del break anterior y no un elemento vivo de más se verificó
aparte: **una salida natural de un break deja UN elemento `<video>` en el cuadro siguiente**,
y una salida por búsqueda también.

```
  t=  30.67 enAd=True  videos=2 imgs=0
  t=  32.18 enAd=False videos=1 imgs=0
```

## 5. La no-regresión

```
$ npm test
ℹ tests 207
ℹ pass 207
ℹ fail 0

$ npm run check
   GREEN: 3 occurrence(s), all of them on the accepted list.
   GREEN: zero hits.
verificar-cortes: both seams hold.
EXIT=0
```

`git status --porcelain` sobre `lib/`, `docs/`, las cuatro demos publicadas, `run.sh`,
`server.mjs`, `package.json` y el `README.md` de la raíz sale **vacío**: esta task no tocó
ninguno. Lo único modificado fuera de lo suyo es `scripts/verificar-cortes.mjs`, que ya venía
modificado por la T-06.

## 6. Lo que esta task NO hizo

- **No tocó `lib/`**, ni el contrato, ni ninguna de las cuatro demos publicadas, ni
  `scripts/verificar-cortes.mjs`.
- **No escribió `CREDITS.md` ni el `README.md` de la demo**, que son de la T-11. La
  procedencia de los tres archivos de marca que esta task copió queda declarada mientras tanto
  en `demo/stage-pair/brand/README.md`.
- **No midió nada sobre iOS ni sobre Safari.** Todo se midió en el Chrome real del sistema.
- **No commiteó, no pusheó y no publicó nada a GCS.**

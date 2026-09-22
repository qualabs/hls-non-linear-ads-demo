# T-06 — La señalización del par

**El recorrido está señalizado, en dos playlists y nueve asset-lists, y el tramo invertido no
existe: medido en el navegador, los dos panes entran y salen de los tres breaks con menos de
0,2 s de diferencia, y el control puesto a propósito lo abre a 12 s.** La copia de
`contract-trace.js` de esta demo entró al chequeo de costuras y se la vio roja.

`npm test` pasa de **193 a 207** —los 14 del test nuevo— con 0 fallas, y `npm run check` sale
`EXIT=0`.

## 1. Qué quedó escrito, y qué declara cada cosa

### Los generadores

| archivo | qué hace |
| --- | --- |
| `demo/stage-pair/scripts/senalizar-contenido.sh` | corre en cada arranque: manda a escribir los nueve asset-lists y escribe **las dos playlists señalizadas**, con dos `EXT-X-DATERANGE` por break |
| `demo/stage-pair/scripts/escribir-asset-lists.mjs` | los nueve asset-lists, derivados de `stage.json` y de nada más |

### Los nueve asset-lists, en `demo/stage-pair/signalling/`

| archivo | qué declara |
| --- | --- |
| `asset-list-linear-a/b/c.json` | el aviso lineal de **ese** break: el creativo 16:9 de su campaña, `DURATION` 12,0 s. Uno por break y no uno compartido, que es el ADR 0082 |
| `asset-list-break-a-rica.json` | `squeezebackDoubleBox`, primario `zDepth` 0 en `"25 50 25 0"`, aviso `zDepth` 1 en `"25 0 25 50"`, `application/vnd.apple.mpegurl` → `/content/creatives/zumbra-16x9/index.m3u8` |
| `asset-list-break-a-magra.json` | **el mismo archivo**, con `image/svg+xml` → `/graphics/campaigns/zumbra-16x9.svg` |
| `asset-list-break-b-rica.json` | `squeezebackLShape`, aviso a cuadro entero `"0 0 0 0"` en `zDepth` 0 y primario encima en `zDepth` 1 con inset 25 % (`"0 0 25 25"`), video → `ketrava-backplate` |
| `asset-list-break-b-magra.json` | **el mismo**, con el SVG de `ketrava-backplate` |
| `asset-list-break-c-rica.json` | `lowerThirdOverlay`, aviso en `"70 6.25 12.5 6.25"` `zDepth` 1, **sin bloque `primaryContent`**, video → `kovrin-banner` |
| `asset-list-break-c-magra.json` | **el mismo**, con el SVG de `kovrin-banner` |

Los tres concurrentes ricos y los tres magros llevan además, en el nivel superior del asset,
el **repliegue del ADR 0019** —`URI` y `DURATION`—, y es **el mismo en los dos escalones**: el
creativo 16:9 de la campaña del break, o sea exactamente lo que el aviso lineal reproduce. Si
la magra repusiera otro repliegue, los dos archivos diferirían en tres campos y no en dos, y
la afirmación del ADR 0084 dejaría de ser verificable sobre el archivo.

**El `lowerThirdOverlay` no declara `primaryContent` y es deliberado**: la herramienta de SVTA
no lo emite en los dos overlays y la capa asume su preset, que es lo que
`docs/contrato-senalizacion-renderizado.md` tiene medido y lo que
`demo/hydration-break/signalling/` ya hace. Escribirlo sería divergir del asset-list que la
herramienta emite, que es lo que el ADR 0004 prohíbe.

### Las dos playlists

`content/primary/con-daterange-rica.m3u8` y `con-daterange-magra.m3u8`. Seis Date Ranges cada
una: por break, uno de clase `com.apple.hls.interstitial` apuntando al lineal y uno de
`com.qualabs.hls.concurrentInterstitial` apuntando al asset-list de su escalón, **los dos en el
mismo `START-DATE`** (ADR 0007). El tag de clase Apple es **byte por byte el mismo** en las dos
playlists: lo único que las separa es a qué asset-list concurrente apunta cada break.

```
#EXT-X-DATERANGE:ID="AD-A-LINEAR",CLASS="com.apple.hls.interstitial",START-DATE="2026-09-22T04:40:47.832-0300",X-ASSET-LIST="/signalling/asset-list-linear-a.json",X-RESTRICT="SKIP",PLANNED-DURATION=12
#EXT-X-DATERANGE:ID="AD-A-CONCURRENT",CLASS="com.qualabs.hls.concurrentInterstitial",START-DATE="2026-09-22T04:40:47.832-0300",X-ASSET-LIST="/signalling/asset-list-break-a-rica.json",X-RESUME-OFFSET=0,X-SNAP="OUT,IN",X-RESTRICT="SKIP",PLANNED-DURATION=12
```

El tag lineal va **sin `X-RESUME-OFFSET`**, que es la forma de reemplazo del ADR 0017 y la otra
mitad de por qué los dos panes se quedan en el mismo segundo del programa.

### El instrumento y el test

| archivo | qué es |
| --- | --- |
| `demo/stage-pair/test/signalled-run.test.js` | 14 pruebas sobre lo que el señalizador escribió de verdad, sin ffmpeg y sin un byte de video |
| `demo/stage-pair/test/banco-de-medicion.html` | el banco de la medición del tramo invertido. **No es una página de la demo**: las tres son de las T-07, T-08 y T-10 |
| `demo/stage-pair/test/medir-tramo-invertido.py` | maneja el banco, levanta su propio server y lo baja por el PID que guardó |
| `demo/stage-pair/js/contract-trace.js` | copia byte a byte de la de `compatibility-pair`, para que el chequeo de costuras tenga qué mirar |

## 2. La afirmación del ADR 0084, y el test en rojo

Entre la rica y la magra de un break cambian **exactamente dos campos**. El `diff` de los
archivos escritos, verbatim:

```
$ diff signalling/asset-list-break-b-rica.json signalling/asset-list-break-b-magra.json
22,23c22,23
<                   "type": "application/vnd.apple.mpegurl",
<                   "uri": "/content/creatives/ketrava-backplate/index.m3u8",
---
>                   "type": "image/svg+xml",
>                   "uri": "/graphics/campaigns/ketrava-backplate.svg",
```

El test no compara "los campos que uno se acordó de mirar": compara **los dos objetos enteros**
y exige que la lista de rutas donde difieren sea exactamente esas dos. Una lista de campos a
revisar deja afuera el campo que alguien agregue mañana, que es justo el que rompería la
afirmación.

**Y se lo vio rojo.** Se plantó en el generador un `viewport` distinto para la variante de
imagen —la edición exacta que la task teme— y se corrió la suite:

```
$ node --test demo/stage-pair/test/signalled-run.test.js
✖ entre la rica y la magra de un break cambian EXACTAMENTE el type y el uri del asset
  AssertionError: break a: la rica y la magra difieren en algo más que el medio del asset
  + actual - expected
      'ASSETS.0.X-AD-CREATIVE-SIGNALING.payload.0.layout.assets.0.type',
      'ASSETS.0.X-AD-CREATIVE-SIGNALING.payload.0.layout.assets.0.uri',
  +   'ASSETS.0.X-AD-CREATIVE-SIGNALING.payload.0.layout.assets.0.viewport'
✖ el layout de cada break es el que stage.json declara, con sus cajas
  + actual - expected
  + '10 10 10 10'
  - '25 0 25 50'
ℹ tests 14
ℹ pass 12
ℹ fail 2
```

Dos aserciones distintas lo cazan y el mensaje **nombra el campo que se movió**, que es lo que
hace que el rojo sirva para arreglarlo y no sólo para saber que algo pasó. Sacado el plantado,
las 14 vuelven a verde.

El otro negativo de la task —**ningún asset-list magro declara un `type` de video**— lleva su
propio control adentro de la suite: se le planta el `type` de video a una copia y la misma
lectura tiene que cazarlo. Un cero producido por una lectura rota da igual que un cero
producido por un juego de asset-lists correcto.

## 3. El tramo invertido, medido y con el control en rojo

Se mide **leyendo el estado del navegador**, que es el instrumento que la fase 03 eligió: del
pane de fábrica, `interstitialsManager.playingItem.event.identifier` y el reloj del programa
`interstitialsManager.primary.currentTime`; del nuestro, `provider.activeAt(t)`, que es el
contrato. El recorrido se reproduce **entero y de corrido**, sin buscar y sin acelerar: escribir
un `currentTime` es intervenir sobre el mismo reloj que se está midiendo.

```
$ ./demo/stage-pair/test/medir-tramo-invertido.py --puerto 8098
server PID 2696311 en el puerto 8098

== LA MEDICIÓN — señalización tal cual, escalón rica ==
  break A  fábrica  19.759 ->  32.078   nuestro  19.929 ->  32.036   delta entrada  0.170 s  salida  0.043 s   IGUAL
  break B  fábrica  64.945 ->  77.075   nuestro  64.932 ->  77.081   delta entrada  0.013 s  salida  0.006 s   IGUAL
  break C  fábrica 109.963 -> 122.077   nuestro 109.973 -> 122.095   delta entrada  0.010 s  salida  0.018 s   IGUAL

== EL CONTROL — el break concurrente dura 24.0 s y su lineal no ==
  break A  fábrica  19.753 ->  32.078   nuestro  19.948 ->  44.023   delta entrada  0.195 s  salida 11.944 s   DISTINTO
  break B  fábrica  64.896 ->  77.075   nuestro  64.956 ->  89.076   delta entrada  0.059 s  salida 12.001 s   DISTINTO
  break C  fábrica 109.969 -> 122.077   nuestro 109.953 -> 134.036   delta entrada  0.017 s  salida 11.959 s   DISTINTO

server 2696311 bajado

VERDE: la medición dio igual y el control dio distinto.
```

Y la misma medición sobre la **playlist magra**, que es la que el recorrido también tiene que
correr de punta a punta:

```
$ ./demo/stage-pair/test/medir-tramo-invertido.py --puerto 8098 --escalon magra

== LA MEDICIÓN — señalización tal cual, escalón magra ==
  break A  fábrica  19.767 ->  32.078   nuestro  19.928 ->  32.046   delta entrada  0.161 s  salida  0.032 s   IGUAL
  break B  fábrica  64.996 ->  77.076   nuestro  64.948 ->  77.005   delta entrada  0.048 s  salida  0.071 s   IGUAL
  break C  fábrica 109.981 -> 122.077   nuestro 109.907 -> 122.055   delta entrada  0.074 s  salida  0.023 s   IGUAL

== EL CONTROL — el break concurrente dura 24.0 s y su lineal no ==
  break A  fábrica  19.968 ->  32.078   nuestro  19.966 ->  44.054   delta entrada  0.002 s  salida 11.976 s   DISTINTO
  break B  fábrica  64.947 ->  77.075   nuestro  64.949 ->  89.091   delta entrada  0.002 s  salida 12.017 s   DISTINTO
  break C  fábrica 109.949 -> 122.077   nuestro 109.951 -> 134.031   delta entrada  0.002 s  salida 11.954 s   DISTINTO

VERDE: la medición dio igual y el control dio distinto.
```

**Los doce segundos del control son exactamente el defecto de `compatibility-pair`**, y que
aparezcan ahí es lo que hace que los 0,2 s de arriba signifiquen algo: el instrumento sabe ver
una diferencia de esa magnitud, así que cuando dice que no la hay, no la hay.

**Y el instrumento se equivocó una vez, y el control lo delató.** La primera versión leía
`interstitialsManager.playingItem` a secas, que también existe mientras corre el contenido
primario: el pane de fábrica reportaba "en aviso" de punta a punta y las seis filas salieron
`INCOMPLETO`. Lo que corresponde leer es `playingItem.event.identifier`, que es la misma
propiedad que `demo/compatibility-pair/js/stock-player.js` lee, y está anotado en la cabecera
del banco.

## 4. El chequeo de costuras, visto en rojo

`scripts/verificar-cortes.mjs` nombra los archivos que audita uno por uno, así que la copia de
`contract-trace.js` de una demo nueva queda afuera sin que nada avise. Se agregó
`demo/stage-pair/js/contract-trace.js` a la lista del corte del ADR 0003, y se verificó
plantándole un término del transporte:

```
$ printf '\n// el break llega en un EXT-X-DATERANGE de la playlist m3u8\n' >> demo/stage-pair/js/contract-trace.js
$ npm run check
## ADR 0003 -- the rendering side does not know one word of the transport
   /usr/bin/grep -n -i -E "hls|daterange|...|Hls\." lib/renderer.js lib/controls.js lib/multiview.js demo/compatibility-pair/js/contract-trace.js demo/compatibility-pair/css/player.css demo/stage-pair/js/contract-trace.js

   RED: 1 occurrence(s) that are not on the accepted list.

     demo/stage-pair/js/contract-trace.js:83
       // el break llega en un EXT-X-DATERANGE de la playlist m3u8
EXIT=1
```

**Y el contra-control, que es el que prueba que lo que lo caza es la línea nueva y no otra
cosa**: el mismo término plantado, con `demo/stage-pair/js/contract-trace.js` comentado en la
lista, sale verde.

```
   GREEN: 3 occurrence(s), all of them on the accepted list.
```

Sacado el término, la copia vuelve a ser idéntica al original (`cmp` sin salida) y
`npm run check` sale `EXIT=0`.

## 5. Lo que se corrigió de lo que venía escrito, y por qué

Tres cosas, las tres en `demo/stage-pair/stage.json`, que es donde el ADR 0044 manda que vivan
los números de esta demo.

**Las dos playlists señalizadas pasan de `signalling/` a `content/primary/`.** `stage.json` las
declaraba en `signalling/stage-rica.m3u8` y `stage-magra.m3u8`. No pueden ir ahí por dos
razones independientes: llevan un `START-DATE` resuelto contra el `EXT-X-PROGRAM-DATE-TIME` del
empaquetado, que es hora de pared, así que en git —y `signalling/` está en git— sólo pueden
estar viejas; y sus segmentos son relativos, así que desde `/signalling/` no resuelven. Quedan
en `content/primary/con-daterange-rica.m3u8` y `-magra.m3u8`, que es donde las otras cuatro
demos ponen su `con-daterange.m3u8` y es una carpeta gitignoreada. Los nueve asset-lists sí
quedan en `signalling/` y sí van a git: no contienen ni un instante, son función pura de
`stage.json`.

**El `viewport` y el `zDepth` del primario del `squeezebackDoubleBox` estaban sin declarar.**
`stage.json` traía el del aviso y el del backplate, pero no el del primario de la forma 16:9.
Se agregaron `viewportPrimario: "25 50 25 0"` y `zDepthPrimario: 0`, verbatim de
`demo/compatibility-pair/signalling/`, que es el valor ya medido en pantalla. Van en
`stage.json` y no adentro del generador porque son números que gobiernan la corrida.

**Y el `zDepth` del aviso de las tres formas**, por lo mismo.

## 6. Lo que esta task NO hizo

- **No tocó `lib/`**, ni el contrato, ni ninguna de las cuatro demos publicadas. El único
  archivo fuera de `demo/stage-pair/` que edita es `scripts/verificar-cortes.mjs`, que es el
  que el contrato de la task le asigna.
- **No escribió ninguna de las tres páginas.** `banco-de-medicion.html` es el instrumento de
  esta medición y vive en `test/`.
- **Copió `js/contract-trace.js`, que el `TASKS.md` le asigna a la T-07.** Sin el archivo, el
  `grep` de `verificar-cortes.mjs` falla con status 2 y el chequeo entero se cae, así que la
  línea que esta task tiene que agregar no se puede agregar antes que el archivo exista. Es una
  copia byte a byte; la T-07 sigue teniendo que copiar `stock-player.js` y escribir `app.js`.
- **No commiteó ni publicó nada.**
- **No midió nada sobre iOS ni sobre Safari.** Todo se midió en el Chrome real del sistema.

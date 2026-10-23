# T-02 — verificación (2026-10-22, rama `fase-17`, fe82c1c)

## Lo generado

```
progresivo-creativos: content/creatives/zumbra-16x9/d8eabbdae4/progressive.mp4  960x540 @ 500k  vp09.00.30.08
progresivo-creativos: content/creatives/ketrava-backplate/8d140e0f2b/progressive.mp4  960x540 @ 500k  vp09.00.30.08
progresivo-creativos: content/creatives/kovrin-banner/8e5914d854/progressive.mp4  1120x126 @ 300k  vp09.00.21.08
rasterizar-fijo: graphics/campaigns/zumbra-backplate-fijo.png  1920x1080
rasterizar-fijo: graphics/campaigns/ketrava-16x9-fijo.png  1920x1080
rasterizar-fijo: graphics/campaigns/kovrin-backplate-fijo.png  1920x1080
```

Los hashes de los HLS no cambiaron (`d8eabbdae4`, `8d140e0f2b`, `8e5914d854`): no se re-empaquetó nada.
Los dos backplates salen RGBA con la guarda transparente (alfa 0 en el centro); `ketrava-16x9-fijo.png`
sale RGB (tipo de color 2): es opaco entero y Chrome no escribe el canal.

`progresivo-creativos.sh` corrido dos veces: `stage.json` igual, y el MP4 byte por byte igual al de
T-01 (`cmp`).

## Los tests: `node --test demo/stage-pair/test/signalled-run.test.js`

26/26 verdes. Dos nuevos: cada gemela es su original salvo `type`/`uri`/`codecs` (con dos controles
adentro: video contra imagen, y una gemela con otro `viewport`), y la propiedad del ADR 0097 con
`selectOption` en las cinco capacidades (con el control de las gemelas antes de sus originales).

## La campaña de mutaciones sobre `escribir-asset-lists.mjs`

```
== M1: la gemela MP4 antes que el HLS
exit 1 ; ℹ fail 7
✖ cada break trae las opciones del aviso: el video y su MP4, después la imagen y su PNG
✖ each twin is its original with another medium, and nothing else changes
✖ el asset de cada break es la pieza de su campaña, en los dos medios
✖ la hoja que el script imprime sale de los archivos y no de sí misma
✖ la librería, sobre la misma respuesta, dibuja video, imagen, el lineal o nada según la capacidad
✖ la opción de imagen va en OTRA forma que la de video, y es de la misma campaña
✖ the twins never change what the library picks, under any capability
== M2: la PNG antes que la SVG
exit 1 ; ℹ fail 7
== M3: la gemela MP4 con otro zDepth
exit 1 ; ℹ fail 1
✖ each twin is its original with another medium, and nothing else changes
== M4: la gemela PNG apunta al SVG
exit 1 ; ℹ fail 1
✖ each twin is its original with another medium, and nothing else changes
```

## El chequeo del PNG al día: `rasterizar-fijo.py --verificar`

```
GREEN graphics/campaigns/zumbra-backplate-fijo.png: 0 px differ from its SVG drawn again
GREEN graphics/campaigns/ketrava-16x9-fijo.png: 0 px differ from its SVG drawn again
GREEN graphics/campaigns/kovrin-backplate-fijo.png: 0 px differ from its SVG drawn again
== M5: un PNG alterado en 31x31 px
RED graphics/campaigns/kovrin-backplate-fijo.png: 961 px differ from its SVG drawn again
exit 1
```

961 = 31 × 31: el instrumento cuenta exactamente lo que se plantó.

## Créditos: `test/verificar-creditos.py`

Antes de agregar las filas, rojo con los tres PNG nombrados ("NO ORIGIN DECLARED"); después, verde, y
con un `graphics/campaigns/planted.png` plantado, rojo.

## La suite entera

`npm test`: 248/248. `npm run check`: verde. Las verificaciones de navegador
(`verificar-capacidades.py`, que pasó a esperar la opción 3 para la imagen, y las demás) corren en T-05.

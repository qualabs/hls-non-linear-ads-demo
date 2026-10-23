# T-03 — verificación (2026-10-22, rama `fase-17`, 54dd9c7)

## Lo generado, y el chequeo del asset-list a mano contra los archivos

```
progresivo-creativos: content/adL/progressive.mp4  960x540 @ 500k  vp09.00.30.08
progresivo-creativos: content/adOverlay/progressive.mp4  320x180 @ 200k  vp09.00.11.08
GREEN content/adL/progressive.mp4: codecs vp09.00.30.08, as the asset-list says
GREEN content/adOverlay/progressive.mp4: codecs vp09.00.11.08, as the asset-list says
== control: codecs equivocado en la esquina
RED   content/adOverlay/progressive.mp4: the asset-list says codecs "vp09.00.30.08" and the file is vp09.00.11.08
exit 1
== control: falta el MP4 de la L
RED   content/adL/progressive.mp4: does not pass progresivo.sh --verificar
exit 1
```

## Lo que la demo hace con el asset-list nuevo, contra el de `main`

- `senalizar-contenido.sh`: la hoja impresa idéntica (`diff` vacío) y
  `content/primary/con-daterange.m3u8` idéntico byte por byte (también el `START-DATE`, que sale del
  `PROGRAM-DATE-TIME` del empaquetado).
- Los rótulos de los pliegues de la página (`labelsOfAssetList`), iguales:
  `Ad 1 · lowerThirdOverlay · 16 s · still image`, `Ad 2 · squeezebackLShape · 16 s · video`,
  `Ad 3 · no layout block, played full frame · 8 s`, `Ad 4 · cornerOverlay · 24 s · video`.
- La tabla de campos (`blockGlossOf`): las mismas 19 filas más dos, `item.options` (optional) y
  `element.codecs` (ignored).
- `scripts/l-capas.sh` con la lista de `main` y con la nueva: `l-fondo.png` y `l-tipografia.png` a 0
  px de diferencia (`pxdif.sh`). Control: el `l-capas.sh` de `main` con la lista nueva da "el asset
  list no declara la L", exit 1. `creativos.sh` no se corrió entero (rehace los creativos de video):
  su lector cambia la misma línea, y la caja del banner que lee sale igual (`70 6.25 12.5 6.25
  image/png`), porque el banner no tiene opciones.

## Tests: `node --test demo/hydration-break/test/*.test.js`

13/13. Nuevos: las gemelas (sólo la L y la esquina, idénticas salvo `type`/`uri`/`codecs`, control de
`viewport` adentro), la propiedad del ADR 0097 con `selectOption` (control: la gemela primero), y los
rótulos con y sin gemelas (control: una primera opción distinta cambia un rótulo).

## Mutaciones sobre los lectores

```
== H1: el rótulo lee el tipo del ítem          → fail 1: the folds of the page read the same with the twins as without them
== H2: el medio del rótulo lee el layout del ítem → fail 1: the folds of the page read the same ...
== H3: la glosa no baja por las opciones       → fail 1: la glosa del bloque explica los campos que el asset list trae, y ninguno más
== H4: la glosa pierde la fila de codecs       → fail 1: la glosa del bloque explica los campos ...
== H5: un MIME literal en la glosa, con el chequeo de medios sin mirar opciones → exit 0 (es la referencia: así no se veía)
== H6: un MIME literal de una gemela en la glosa → fail 1: lo que puede ir en una caja se lee del contrato y no está escrito en la página
```

H1 y H2 dieron verde la primera vez: ningún test fijaba los rótulos. Se agregó el de los pliegues y
pasaron a rojo.

`npm run mutaciones`: "las 20 roturas dieron rojo y los 9 chequeos dan verde sin romper nada".
`npm test`: 251/251.

## El árbol para el Roku

`~/.cache/cto-tmp/hls17-arbol/repo-hb/demo/hydration-break/`, con el chequeo de referencias de
`publicar.py`: "14 references, 3 playlists followed, 24 segments; 0 missing". Enviado a
`roku-ads-02`.

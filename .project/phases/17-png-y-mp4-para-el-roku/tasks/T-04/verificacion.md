# T-04 — verificación (2026-10-22, rama `fase-17`, 70205e1)

`.mp4` entra en `MUTABLE` de `scripts/publicar.py`, con una función `no_cache()` que usan `fixes` y
`verify`, y siete casos nuevos en el `selftest`. Control: sin `.mp4` en la tupla, el `selftest` da
los dos MP4 como "cached an hour <-- WRONG" y exit 1.

## La corrida en seco con contenido: `scripts/publicar.sh --con-contenido stage-pair hydration-break`

```
== 0. the exclusion patterns, against planted paths ==
   scripts/__pycache__/x.pyc                    excluded
   test/__pycache__/y.pyc                       excluded
   content/primary/seg000.ts                    excluded
   index.html                                   published
   signalling/asset-list-offer.json             published
   js/content/x.js                              published
   .fuentes/Sparks.mp4                          excluded
   primary/con-daterange-rica.m3u8              excluded
   primary/seg000.ts                            published
   primary/con-daterange-concurrente.m3u8       published
   index.html                                   no-cache
   graphics/campaigns/zumbra-backplate-fijo.png no-cache
   content/creatives/zumbra-16x9/d8eabbdae4/progressive.mp4 no-cache
   content/adL/progressive.mp4                  no-cache
   content/primary/index.m3u8                   no-cache
   content/primary/seg000.ts                    cached an hour
   content/adBanner/creative.png                cached an hour
== 1. the stage: HEAD 70205e1, with dist/ built in it ==
construir-libreria: dist/qualabs-concurrent-hls.js (5795 lines, global QualabsConcurrentHls)
== 2. stage-pair: checks ==
   senalizar-contenido.sh leaves the committed files as they are
   77 files to publish outside content/, 0 signalled files of content/ that change
   48 references, 19 playlists followed, 564 segments; 0 missing
   the sync would do (gcloud --dry-run):
     16 to copy, 0 to remove
     and content/: 6 objects to copy or remove
== 2. hydration-break: checks ==
   senalizar-contenido.sh leaves the committed files as they are
   61 files to publish outside content/, 0 signalled files of content/ that change
   14 references, 3 playlists followed, 24 segments; 0 missing
   the sync would do (gcloud --dry-run):
     10 to copy, 0 to remove
     and content/: 3 objects to copy or remove
DRY RUN GREEN: nothing was published (--publicar does)
exit 0
```

Lo que copiaría fuera de `content/`: los 26 archivos que la rama cambió o agregó, y nada más (16 de
stage-pair, 10 de hydration-break; la lista entera en el log de abajo). Borrados: 0.

Lo que copiaría en `content/` (`gcloud storage rsync --dry-run` con el mismo `-x`):

```
stage-pair:      creatives/{ketrava-backplate/8d140e0f2b,kovrin-banner/8e5914d854,zumbra-16x9/d8eabbdae4}/progressive.mp4
                 primary/con-daterange-concurrente.m3u8, primary/con-daterange-interstitial.m3u8, race/program/con-daterange.m3u8
hydration-break: adL/progressive.mp4, adOverlay/progressive.mp4, primary/con-daterange.m3u8
```

Borrados: 0. Las playlists señalizadas difieren sólo en la zona horaria del `START-DATE`: el bucket
las tiene en UTC (las escribió el CI) y el `content/` local en -0300, el mismo instante
(`2026-09-11T02:45:37.717+0000` contra `2026-09-10T23:45:37.717-0300`). En la misma corrida las
reemplaza la versión que `senalizar-contenido.sh` escribe en el escenario.

## El control, y la razón del ADR 0103: `scripts/publicar.sh --control stage-pair`

Sin `--con-contenido`, que es el camino del CI, los MP4 que el bucket todavía no tiene salen
faltantes, además de los dos plantados:

```
   50 references, 19 playlists followed, 564 segments; 5 missing
     MISSING content/creatives/ketrava-backplate/8d140e0f2b/progressive.mp4   (from stage.json)
     MISSING content/creatives/kovrin-banner/8e5914d854/progressive.mp4   (from stage.json)
     MISSING content/creatives/zumbra-16x9/d8eabbdae4/progressive.mp4   (from stage.json)
     MISSING content/no-existe.m3u8   (from --control)
     MISSING dist/no-existe.js   (from --control)
RED: nothing was published
```

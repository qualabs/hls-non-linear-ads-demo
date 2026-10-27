# T-06 — El contenido DASH de `stage-pair`

Rama `fase-19`, `6e9bbea`.

- `scripts/empaquetar-dash.sh`: **remux, no encode**. El HLS ya empaquetado del programa y de cada
  `video` de `stage.json` (9 creativos) pasa a fMP4 con su MPD, en `<carpeta>/dash/manifest.mpd`,
  con `ffmpeg -copyts -c copy` (SegmentTimeline, segmentos de 2 s). Mismos cuadros, misma cadencia,
  mismo audio.
- `escribir-asset-lists.mjs` escribe además `signalling/dash/slots-break-<id>.json`, un sobre `slot`
  por break, **armado desde el asset-list de HLS** del mismo break: el video pasa a su MPD y el
  `URI` del asset a `Slot.media`.
- `senalizar-dash.mjs` (llamado desde `senalizar-contenido.sh` cuando el empaquetado existe) escribe
  `content/primary/dash/senalizado.mpd`: un Event de SVTA por break (`presentationTime` = el offset
  de `stage.json`; el pre en 0 y el post en los últimos 12 s, como sus tags HLS) y el Replace del
  lineal a 150 s.

| definición de done | resultado |
| --- | --- |
| los scripts corren de cero | `empaquetar-dash.sh` borra y rehace cada `dash/`: 10 MPD (184 segmentos el programa, 7 cada creativo); `senalizar-contenido.sh` escribe `senalizado.mpd` |
| ASSET-LIST y playlist HLS byte a byte iguales | el señalizador de `bb0d78b` y el nuevo, corridos sobre el mismo `index.m3u8` a carpetas temporales: playlist `cmp` igual, asset-lists `diff -r` igual, sólo `Only in new/sig: dash`. Control (`CONTROL_DURACION_CONCURRENTE=9`): `differ: byte 351, line 8` y 3 asset-lists distintos |
| cada sobre `slot` con las mismas gemelas que su ASSET-LIST, por script, visto fallar | `demo/stage-pair/test/slots-dash.test.js` (6 tests, la regla escrita en el test y no en el generador). Una PNG cambiada en B: `fail 1`; un MPD vuelto a HLS en C: `fail 1` |
| el MPD carga en dash.js y reproduce | sí (Chrome, `origen.py`); y las 28 referencias de los sobres y del MPD señalizado existen en `content/` |

## El origen, medido

`origen.py` abre el programa en hls.js y en dash.js lado a lado, los lleva al mismo segundo, y compara
los cuadros (diferencia media por píxel, 0-255). Control: el DASH 0,1 s corrido.

```
start: {"hls": 0.066733, "dash": 0.066733}
at 30:   same 0   shifted 14.73
at 75.5: same 0   shifted 1.86
at 140:  same 0   shifted 2.77
```

**El mismo cuadro en el mismo segundo, píxel a píxel**, sin escribir nada. Mi primera versión del
script escribía un `@presentationTimeOffset` de 1,4 s (el offset de MPEG-TS que `-copyts` conserva),
que es lo que la lectura de la norma sugiere; medido, corría el DASH 1,4 s antes: con él los cuadros
daban 26,55 / 12,07 / 55,32 y un barrido de ±2 s encontró el mínimo (0) en −1,399 s
(`barrido-con-pto.json`). Sin él, el mínimo está en 0 (`barrido-sin-pto.json`). Se sacó, y la
cabecera del script dice las dos mediciones. T-08 no tiene corrimiento que descontar.

## Para publicar (no se hizo)

El MPD señalizado y los segmentos DASH están en `content/`, que no va en git: subirlos es
`publicar.sh --publicar --con-contenido stage-pair`. Una corrida en seco sin `--con-contenido`
chequea las referencias contra el bucket, donde todavía no están, y va a dar rojo en `stage-pair`
hasta esa subida: es la protección correcta. `.mpd` y `.m4s` salen con su tipo
(`mimetypes`: `application/dash+xml`, `video/iso.segment`).

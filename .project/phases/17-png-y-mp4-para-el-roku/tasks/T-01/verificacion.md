# T-01 — verificación (2026-10-22, rama `fase-17`)

## Los cinco MP4, con el `codecs` leído del `vpcC`

```
zumbra-16x9-d8eabbdae4 -> vp09.00.30.08  676726 B  12.000000s
ketrava-backplate-8d140e0f2b -> vp09.00.30.08  627799 B  12.000000s
kovrin-banner-8e5914d854 -> vp09.00.21.08  424107 B  12.000000s
content-adL -> vp09.00.30.08  942331 B  15.958333s
content-adOverlay -> vp09.00.11.08  955540 B  24.000000s
```

## La referencia independiente: la tabla de niveles de VP9, a mano

| archivo | tamaño de cuadro | nivel anterior (tope) | nivel (tope) | esperado |
| --- | --- | --- | --- | --- |
| 960x540 | 518400 | 2.1 (245760) | 3 (552960) | `vp09.00.30.08` |
| 1120x126 | 141120 | 2 (122880) | 2.1 (245760) | `vp09.00.21.08` |
| 320x180 | 57600 | 1 (36864) | 1.1 (73728) | `vp09.00.11.08` |

La cadencia (30 fps o menos) queda por debajo del tope de muestras por segundo de cada nivel. Coincide
en los cinco.

## Los controles, que tienen que dar rojo

```
== verde: el MP4 de adOverlay
vp09.00.11.08
exit 0
== rojo esperado: h264.mp4 320x180
progresivo: .../h264.mp4: expected one VP9 video stream, found ['h264']
exit 1
== rojo esperado: audio.mp4 320x180
progresivo: .../audio.mp4: carries ['audio'] besides the video, and must carry nothing
exit 1
== rojo esperado: corto.mp4 320x180
progresivo: .../corto.mp4: lasts 20.000 s and its HLS 24.000 s, more than one frame apart
exit 1
== rojo esperado: content-adOverlay.mp4 640x360
progresivo: .../content-adOverlay.mp4: is 320x180, asked for 640x360
exit 1
```

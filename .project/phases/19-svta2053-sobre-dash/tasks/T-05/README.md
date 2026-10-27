# T-05 — `dash/media.js`, `dash/concurrent-dash.js`, el dist DASH y las costuras

Rama `fase-19`, dos commits: `07c3c21` (`createLayer` y
`ensurePositioned` suben a `lib/layer.js`, comparador **verde**) y `d607237` (lo de DASH).

| definición de done | resultado |
| --- | --- |
| `npm run check` verde, y rojo con `demo` plantado en `dash/media.js` | verde; con el plantado: `RED: 1 occurrence(s)… dash/media.js:51` |
| el dist DASH evaluado en un browser define su global | Chrome con los dos dists y los dos players: `{"dash": ["VERSION", "SVTA_SCHEME", "VIDEO_DECODERS_PARAM", "IMAGE_OVER_VIDEO_PARAM", "attach"], "hls": [… 7 claves], "dashjs": "5.2.1"}`, sin errores de página (`global.py`) |
| el dist HLS idéntico al de T-02 salvo ADR 0118 | el `construir-libreria.sh` nuevo da el dist HLS **byte a byte** igual al del script anterior sobre el mismo árbol (`cmp` sin salida); control: con `VERSION` cambiado, `differ: byte 368141, line 7322` |
| `demos-cambiadas.sh` para un commit que sólo toca `dash/` lista `stage-pair` y nada más | `28e59e7` (sólo `dash/signalling.js`) → `stage-pair`; control `97c239d` (toca `hls/`) → las cinco; `4616a5a` (sólo `test/`) → ninguna |

**Lo publicado** (`comparar-4616a5a-d607237.txt`): las cuatro demos que no son `stage-pair` dan 0 rojos
(su única diferencia admitida es el dist HLS, por la mudanza de `lib/layer.js`); `stage-pair` suma
tres URLs nuevas, `dist/qualabs-concurrent-dash.js`, `vendor/dash.all.min.js` y
`vendor/dash.js.LICENSE`.

Lo que se decidió acá:

- **Los archivos de DASH van sólo a las demos que los cargan.** Cada bucket lleva `dist/` y
  `vendor/` enteros; sin esto, las cuatro demos HLS ganaban tres URLs que ninguna página pide.
  `publicar.sh` declara `DASH=(stage-pair)` y `DASH_FILES=(…)`, y el comparador y
  `demos-cambiadas.sh` leen esa lista.
- **`attach` va antes de `player.initialize`**, con `video` obligatorio: los breaks se leen del MPD
  cuando dash.js lo recibe (ADR 0128).
- **El primer load de un MPD es `MANIFEST_LOADED`**; un `ERROR` antes es el fallo (T-01: 404 del
  MPD = error 25). Un 404 de init o de segmento llega después y, como en HLS, no cambia de opción.
- `server.mjs` sirve `.mpd` como `application/dash+xml` (no se publica).

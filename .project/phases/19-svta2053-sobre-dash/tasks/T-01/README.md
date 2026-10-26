# T-01 — Los riesgos medidos

dash.js 5.2.1 (`dist/modern/umd/dash.all.min.js` del tarball de npm, el mismo que queda en
`vendor/`), Chrome headless por Playwright, server propio en 8195 apagado por su PID.
`fixture-main.mpd`: un Period `static` de 150 s con un EventStream SVTA (eventos 1 en 0 s, 2 en
45 s, 4 en 130 s con cuerpo en texto, 3 en 120 s) y uno de Replace (evento 9 en 90 s). La página es
`probe.html`, el runner `run.py` (8 s de reproducción, seek a 40 s, 10 s más), la salida
`salida.json`.

**Veredicto: el diseño sigue.** Cambia una cosa del cómo: `dash/signalling.js` lee el EventStream
del texto del MPD en `addResponseInterceptor`, no de los eventos de dash.js (ADR 0128).

## (a) Cuándo entrega dash.js los eventos del MPD

**Todos al cargar.** Con `{mode: dashjs.MediaPlayer.events.EVENT_MODE_ON_RECEIVE}` llegan los cinco
eventos (los de 0, 45, 120, 130 y el Replace de 90 s) juntos, 85 ms después de `MANIFEST_LOADED`,
con `currentTime` 0 (extracto de la segunda corrida; `salida.json` es la última, con el evento 4
agregado, y da el mismo orden):

```
{"k": "interceptor-mpd", "hasReplace": true, "url": "/main/manifest.mpd", "ms": 121}
{"k": "main-manifest-loaded", "ct": 0, "ms": 122}
{"k": "event", "scheme": "…ad-creative-signaling#receive", "id": 1, "pt": 0,   "dur": 10, "ct": 0, "ms": 207}
{"k": "event", "scheme": "…ad-creative-signaling#receive", "id": 2, "pt": 45,  "dur": 12, "ct": 0, "ms": 207}
{"k": "event", "scheme": "…ad-creative-signaling#receive", "id": 3, "pt": 120, "dur": 12, "ct": 0, "ms": 207}
{"k": "event", "scheme": "urn:mpeg:dash:event:alternativeMPD:replace:2025", "id": 9, "pt": 90, "dur": 10, "ct": 0, "ms": 207}
```

El control: el mismo esquema registrado en `EVENT_MODE_ON_START` entrega el 1 en 0 s y el 2 recién
a `ct` 45,086, después del seek a 40. El modo se distingue.

**La premisa del diseño estaba mal en un detalle:** el modo no es `'onReceive'` sino la constante
`'eventModeOnReceive'`. Con `{mode: 'onReceive'}` (primera corrida) **no llega ningún evento**, en
ningún modo, y dash.js no avisa.

## El hallazgo: el cuerpo en CDATA no llega

Los eventos en CDATA (1, 2, 3) llegan con `messageData` **`undefined`**; el 4, con el mismo JSON
como texto, llega entero:

```
1 341 0 None
2 341 0 None
4 341 0 "{\"version\":2,\"type\":\"pod\",\"plain\":true}"
3 342 0 None
```

Causa, en el código de 5.2.1: el modelo lee `n.messageData||n.__cdata||n.__text`, y el parser nuevo
deja el CDATA en un nodo `"#cdata"` (`"#cdata":{"nodeName":"#cdata","nodeValue":"{\"version\":2,…"}`
en el nodo crudo del manifest). Es un bug de dash.js upstream, y pega en el formato que SVTA2053 usa
en todos sus ejemplos de §6.1 (Table 25, `borrador.md:870`, `:894`, `:1084`). Es para David y para
upstream.

El cuerpo se alcanza igual por `event.eventStream.period.mpd.manifest.Period[…].EventStream[…]`,
que no es API.

## (b) Cómo se detecta que un creativo MPD no cargó

Un `MediaPlayer` por caso; `since` es desde `initialize`:

| caso | evento | código | latencia |
| --- | --- | --- | --- |
| MPD bien | `video:loadeddata`, `CAN_PLAY`, `PLAYBACK_PLAYING` | — | 363 ms |
| 404 en el MPD | `ERROR` "…/nope/manifest.mpd is not available" | 25 | 1596 ms |
| 404 en el init | `ERROR` "…/cre-segfail/init-0.m4s is not available" | 28 | 3188 ms |
| 404 en el primer segmento | `ERROR` "…/cre-medfail/seg-0-1.m4s is not available" | 27 | 3243 ms |

Los tres fallos llegan por `MediaPlayer.events.ERROR`, después de los reintentos de dash.js, y los
tres antes de los 10 s de `FIRST_REQUEST_TIMEOUT_MS` (`hls/media.js:107`). `onLoaded` es
`loadeddata` del `<video>`; `onFailed` es el primer `ERROR`. Hace lo que `hls/media.js` hace con
hls.js.

## (c) Los atributos de `ReplacePresentation`

**No llegan en el evento** (`messageData` y `parsedMessageData` vacíos), y sí están en el nodo
crudo del manifest, por la ruta que no es API:

```
"ReplacePresentation":{… "uri":"/cre/manifest.mpd","maxDuration":10000,"clip":"false","executeOnce":"true" …}
```

Y el interceptor de respuesta recibe el MPD como texto antes que los eventos (121 ms contra 207 ms),
con el `ReplacePresentation` adentro (`hasReplace: true`).

## Qué cambia

Leer el EventStream del texto del MPD en `addResponseInterceptor` resuelve las tres cosas por API
pública: el cuerpo en CDATA o en texto, los atributos del Replace, y los `Event@id` como string (dash.js
los pasa por `parseInt`). Llega antes que los eventos, así que la barra y el pre-roll no esperan. Es
el repuesto que el diseño ya nombraba para el Replace (ADR 0125), extendido al cuerpo. El costo: el
tiempo de cada Event lo calcula la librería (Period@start, `timescale`, `presentationTimeOffset`),
que es lo que T-03 iba a hacer igual.

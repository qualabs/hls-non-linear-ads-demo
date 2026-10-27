# T-07 — `stage-pair`: "DASH, our library" en cada pane

Rama `fase-19`, `750d27c`. Cada pane elige "HLS interstitials, native", "With our library" o
"DASH, our library" (`?izq=ours-2dec-img&der=dash-2dec-img`); el modo DASH tiene los mismos dos ejes
de capacidades. `construirDash` en `js/app.js` es el bloque del integrador con dash.js: `attach`
antes de `initialize`. `stage.json` gana `"mpd"`.

## Capturas a tamaño real (1920×1080), un pane HLS y uno DASH

| estado | `pre.png` | `break-b.png` | `lineal.png` |
| --- | --- | --- | --- |
| HLS (izq) | 4,0 s · `lowerThirdOverlay` · HLS | 68,4 s · `squeezebackLShape` · HLS | "LINEAR AD, played by hls.js" · programa en 150,0 s |
| DASH (der) | 4,1 s · `lowerThirdOverlay` · `dash+xml` | 68,3 s · `squeezebackLShape` · `dash+xml` | "LINEAR AD, played by our library (replace event)" · programa en 153,1 s |

Mismo cuadro del programa en las dos (`break-b.png`), mismo layout, mismo creativo. En el lineal el
reloj difiere y es la semántica de cada uno: hls.js para el programa durante un interstitial de
reemplazo y lo retoma en `START + DURATION`; un `ReplacePresentation` deja correr el tiempo del
programa (23009-1, 5.16.1). Los dos salen en 162 s; T-08 lo mide.

## Un corrimiento que la captura mostró, medido y arreglado

En la primera captura el backplate de KETRAVA se veía en otro cuadro de su animación en cada pane.
`creativo-t.py` lee el `currentTime` de los `<video>` de los creativos en los dos panes durante B:

```
antes   {"izq": {"prog": 68.4, "ads": [3.43]}, "der": {"prog": 68.35, "ads": [4.8]}}
después {"izq": {"prog": 68.37, "ads": [3.77]}, "der": {"prog": 68.35, "ads": [3.86]}}
```

Con `-copyts` solo, el MPD de cada creativo empieza en 1,4667 s y dash.js, al arrancar en 0, salta
ese "gap" ("Adjusting playback time 1.4677 because of gap in the manifest"): el creativo DASH arrancaba
1,47 s adentro. `empaquetar-dash.sh` ahora escribe el fMP4 en la línea de tiempo de HLS
(`-output_ts_offset -1.4`), el MPD empieza en 0,0667 s, y la diferencia queda en 0,07-0,1 s (el salto
de 0,0667 s que dash.js todavía hace al arrancar). El programa y un creativo siguen dando el mismo
cuadro que HLS, píxel a píxel (`origen.py` y `origen-creativo.py` de T-06, re-corridos: `same 0` en
los seis puntos).

## Las 18 líneas viejas

`git grep -nE "lib/(signalling|media|concurrent-hls)\.js|assembled from lib/ on" -- demo`: **0**; la
misma búsqueda sobre `bb0d78b`: **18**. Ahora nombran `hls/signalling.js`, `hls/media.js`,
`lib/ad-list.js`, `lib/experience.js` o "lib/ and hls/".

En las cuatro demos que no son `stage-pair` son **sólo comentarios** (`solo-comentarios.py`: corta
los comentarios HTML, CSS y JS de la versión vieja y de la nueva y compara lo que queda):

```
comments only demo/compatibility-pair/index.html
comments only demo/hydration-break/css/page.css
comments only demo/hydration-break/index.html
comments only demo/hydration-break/js/senalizacion.js
comments only demo/hydration-break/js/tipos.js
comments only demo/multiview-offer/index.html
comments only demo/race-multiview/index.html
```

Control: con una constante renombrada en `tipos.js`, `CODE CHANGED  demo/hydration-break/js/tipos.js`
y exit 1.

`npm test` 419/419, `npm run check` verde.

Ruido de consola, no de la librería: dash.js 5.2.1 avisa "Failed to record response received in
CMCD reporter… Invalid URL" en cada player; CMCD no está configurado.

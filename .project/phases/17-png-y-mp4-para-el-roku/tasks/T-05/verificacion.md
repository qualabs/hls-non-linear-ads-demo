# T-05 — verificación (2026-10-22, rama `fase-17` 70205e1 contra `main`)

Servidores propios (`server.mjs`) en 8197 (rama, stage-pair), 8198 (main, stage-pair), 8199 (rama,
hydration-break), 8200 (main, hydration-break), sobre los árboles de `~/.cache/cto-tmp/hls17-arbol/`,
y bajados por su PID al terminar. `lib/` y `vendor/`: 0 líneas de diff contra `main`.

## 1. La propiedad, contra los asset-lists de `main`

Cada aviso de los cuatro asset-lists, en las cinco capacidades (ninguna; 2 dec con y sin imágenes;
1 dec con y sin imágenes), elige en la rama la misma opción por contenido (`type` del layout y sus
elementos) que en `main`, con el `selectOption` de `lib/`:

```
30 picks compared, 0 different
CONTROL, las opciones dadas vuelta en la rama:
CONTROL (options reversed on the branch): 30 picks compared, 18 different
```

## 2. La red: la web no pide ninguna gemela

Las páginas de verdad en Chrome, recorriendo todos los breaks: stage-pair `index.html` con el pane
derecho en las cuatro capacidades y `inspect.html`; hydration-break `index.html` por el banner, la
L y la esquina. Se cuentan los pedidos a un `.mp4`/`.png` bajo `/content/` o `/graphics/`.

```
== stage-pair-rama
   requests: 590; to a .mp4/.png of a creative (twins): 0
   control, what the web does ask for (-fijo\.svg(\?|$)): 3
     http://localhost:8197/graphics/campaigns/ketrava-16x9-fijo.svg
     http://localhost:8197/graphics/campaigns/kovrin-backplate-fijo.svg
     http://localhost:8197/graphics/campaigns/zumbra-backplate-fijo.svg
GREEN
== stage-pair-main
   requests: 590; to a .mp4/.png of a creative (twins): 0
   control, what the web does ask for (-fijo\.svg(\?|$)): 3
     http://localhost:8198/graphics/campaigns/ketrava-16x9-fijo.svg
     http://localhost:8198/graphics/campaigns/kovrin-backplate-fijo.svg
     http://localhost:8198/graphics/campaigns/zumbra-backplate-fijo.svg
GREEN
== hydration-break-rama
   index.html: 82 requests
   requests: 82; to a .mp4/.png of a creative (twins): 0
   control, what the web does ask for (/content/adBanner/creative\.png): 1
     http://localhost:8199/content/adBanner/creative.png
   requests under /content/adL/: 9
   requests under /content/adOverlay/: 13
   requests under /content/creatives/: 0
GREEN
== hydration-break-main
   index.html: 82 requests
   requests: 82; to a .mp4/.png of a creative (twins): 0
   control, what the web does ask for (/content/adBanner/creative\.png): 1
     http://localhost:8200/content/adBanner/creative.png
   requests under /content/adL/: 9
   requests under /content/adOverlay/: 13
   requests under /content/creatives/: 0
GREEN
```

El control encuentra lo que la web sí pide (los tres `-fijo.svg`, el `creative.png` del banner), y
la L y la esquina se pidieron enteras (9 y 13 pedidos: la playlist y sus segmentos), igual en la
rama que en `main`.

## 3. Las suites existentes, en la rama y en `main`

`npm test` 251/251 en la rama (248 en `main` antes de la fase, más los tests nuevos); `npm run
check` verde; `npm run mutaciones` 20/20. Las verificaciones de navegador de stage-pair:

```
rama capacidades inspect exit 0
rama capacidades index exit 0
rama pares exit 0
rama inspect exit 1
rama inspect-modos exit 0
main capacidades inspect exit 0
main capacidades index exit 0
main pares exit 0
main inspect exit 0
main inspect-modos exit 0
rama inspect (corrida en su propio puerto, 8201) exit 0
```

El `exit 1` de `rama inspect` es del arnés y no de la rama: `verificar-inspect.py` levanta su propio
servidor y le pasé un puerto donde ya corría el mío sobre una copia, así que su control reescribió el
asset-list del worktree y la pantalla leyó la copia. En un puerto libre: todas VERDE, con el control
(`duration: 24`) visible. `verificar-capacidades.py` de la rama espera la imagen en la opción 3, el
de `main` en la 2: los dos verdes.

## 4. Las capturas, `main` contra rama, con `pxdif.sh` (umbral 5 %)

La caja de la imagen (el `<img>` con el programa oculto, `*-quietud-1.png`): **0 px** de diferencia en
los seis casos (inspect e index, breaks A, B y C con 1 decodificador e imágenes).

Las capturas de página entera no discriminan: llevan el programa y el creativo en video, en
instantes que no coinciden al cuadro. La referencia es una segunda corrida de `main` contra la
primera, y la rama contra `main` cae en el mismo orden:

```
inspect-dec1-imgno-break-a-1907.png  main-vs-main2 254909  rama-vs-main 235605
inspect-dec1-imgno-break-b-1907.png  main-vs-main2 29446  rama-vs-main 51845
inspect-dec1-imgno-break-c-1907.png  main-vs-main2 19801  rama-vs-main 43114
inspect-dec1-imgsi-break-a-1907.png  main-vs-main2 117762  rama-vs-main 140720
inspect-dec1-imgsi-break-b-1907.png  main-vs-main2 58883  rama-vs-main 21956
inspect-dec1-imgsi-break-c-1907.png  main-vs-main2 122991  rama-vs-main 145712
inspect-dec2-imgno-break-a-1907.png  main-vs-main2 53553  rama-vs-main 87529
inspect-dec2-imgno-break-b-1907.png  main-vs-main2 215716  rama-vs-main 233622
inspect-dec2-imgno-break-c-1907.png  main-vs-main2 192949  rama-vs-main 18834
inspect-dec2-imgsi-break-a-1907.png  main-vs-main2 127985  rama-vs-main 142590
inspect-dec2-imgsi-break-b-1907.png  main-vs-main2 262868  rama-vs-main 242976
inspect-dec2-imgsi-break-c-1907.png  main-vs-main2 235123  rama-vs-main 18834
```

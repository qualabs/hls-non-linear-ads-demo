# T-05 — el README de la raíz enruta y la demo cuenta su corrida

El README de 347 líneas y nueve secciones quedó partido en dos documentos que se
leen solos: la raíz, 170 líneas, que dice qué es la sdk y dónde está escrita cada
cosa; y `demo/compatibility-pair/README.md`, 243 líneas, que dice qué muestra esa
demo y cómo se levanta. El reparto lo decidió el ADR 0025 y esta task lo ejecutó
tal cual.

## El reparto, sección por sección

| sección del README de 347 líneas | dónde quedó |
| --- | --- |
| encabezado | los dos, reescrito. La raíz abre con la librería y la línea "la raíz es la librería, `demo/` es donde se la muestra"; la demo abre con "una URL, dos clientes lado a lado" |
| Run it | demo, entero, con las rutas completas de los dos comandos que la T-04 sacó del manifiesto |
| Before you record | demo, entero, con su tabla de los cinco breaks |
| Test it | partido. Raíz: `npm test` y `npm run check`, qué cubre `test/` y qué no, y que `node --test` descubre las dos suites. Demo: sus tres afirmaciones sobre la corrida viva |
| What is where | partido. Cada uno lista su propio árbol; la raíz no lista `demo/` archivo por archivo, lista las demos |
| The compatibility pair | demo, entero |
| The two layers | raíz, con el puntero al contrato como cuerpo de la sección |
| The library, and the page that uses it | raíz, entero |
| Four things… 1, la maquinaria de interstitials apagada | raíz, **como puntero**: el requisito en tres líneas y el resto a `docs/integrating-the-library.md` §2.1 |
| Four things… 2, `EXT-X-PROGRAM-DATE-TIME` | demo, en *Two things that look like details and are not* |
| Four things… 3, un layout inserta una imagen | demo, en la misma sección |
| Four things… 4, los dos defaults que la herramienta omite | raíz, **como puntero**: qué omite la herramienta y que la capa lo asume, y el detalle de cada default al contrato |

La sección `demo/` de la raíz es un índice de una fila: qué argumenta
`compatibility-pair`, el link a su README y el ADR 0007, más `./run.sh <demo>`.
Una demo nueva agrega una fila y escribe su propio README.

Los dos punteros son la parte que se puede deshacer sola, así que quedan dichos
con lo justo para saber si hay que seguirlos: el de la maquinaria de
interstitials dice el requisito, porque es de la sdk, y manda a `docs/` por el
por qué, el warning y el síntoma; el de los dos defaults dice que la herramienta
no emite `volume` ni el bloque `primaryContent` de los dos overlays y que la capa
los asume, y manda al contrato por lo que asume en cada caso.

## La cláusula de procedencia en `docs/`

La cita de `docs/contrato-senalizacion-renderizado.md` al JSON de la T-06 de la
fase 01 se quedó, con una frase agregada: que ese archivo es la evidencia de una
fase cerrada y que la cita es su procedencia —dónde se hizo la medición—, no una
ruta que alguien resuelva en tiempo de ejecución (ADR 0023). Nada más de `docs/`
se tocó: el `loadSource('./content/primary/con-daterange.m3u8')` del ejemplo y el
`GET /signalling/asset-list-cornerOverlay.json?...` siguen como estaban.

## Tres cosas que el bloque no cubría, decididas acá

**El nombre del repositorio en el título de la raíz.** El README abría con
`# hls-non-linear-ads-demo`, que es el `name` que el ADR 0024 sacó del
manifiesto. Quedó `# qualabs-concurrent-hls`, que es lo que el documento describe
de la primera línea en adelante. Con eso se cierra uno de los dos lugares que la
T-04 reportó como sobrevivientes del nombre viejo; el otro, la etiqueta de
consola de `server.mjs:107`, sigue abierto y no es de esta task.

**"One thing to do before the camera rolls, and five to expect"**, cuando abajo
hay seis párrafos. El texto venía así y se mudó entero, así que se corrigió a
seis: es la cuenta que un lector chequea de un vistazo, y la sección era la que
estaba pasando por la mano.

**Dos filas de tabla que decían "the same contract" y "none of the above"**,
frases que en el README único se apoyaban en una sección que ahora vive en el
otro documento. La regla del ADR 0025 es que cada README se lea solo, así que
`js/contract-trace.js` nombra el contrato y linkea a `docs/`, y
`js/stock-player.js` dice qué es lo que no tiene: `new Hls()` sin una sola opción
y, de la librería, sólo `attachControls`.

## La verificación

El nivel es mínimo y el único chequeo mecánico son los links. Se corrieron los
dos README contra el disco: **12 links markdown y 48 rutas escritas en prosa o en
un bloque de código, todas resueltas**, en
`t05-los-links-resueltos.txt` junto con el script que las resuelve. El chequeo va
más allá del link markdown a propósito: lo que se quedó viejo dos veces en esta
fase fue una ruta escrita en un comentario, no un link.

El único hallazgo del chequeo fue `verificar-cortes.mjs` escrito suelto en la
fila de `scripts/`, que no resuelve desde la raíz. Quedó `scripts/verificar-cortes.mjs`,
que es la convención que la tabla ya usaba para los cinco archivos de `lib/`.

`npm test` en 46 de 46 y las dos costuras en verde, antes y después, en
`t05-suite-y-costuras.txt`. Ninguna costura mira los README: la del ADR 0015
grepea `lib/*.js` y `scripts/construir-libreria.sh`, y el grep de autosuficiencia
de `test/` va acotado a `*.js`.

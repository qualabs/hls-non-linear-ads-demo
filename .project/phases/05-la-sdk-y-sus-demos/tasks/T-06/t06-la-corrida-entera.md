# T-06 — la corrida entera desde la estructura nueva

La fase se probó como un todo: `./run.sh` levantó la demo desde la estructura
nueva, el recorrido de los cinco breaks corrió entero hasta el final, y la suite
y las dos costuras quedaron en verde después de que todo lo demás ya estaba
tocado. La salida verbatim de los cuatro chequeos, en el orden en que el
`PHASE.md` los pide, está en `t06-los-cuatro-chequeos.txt`.

| chequeo | resultado |
| --- | --- |
| `./run.sh` y un cuadro por break | los cinco breaks, con un sexto cuadro del aviso a cuadro entero de adentro del mezclado; `video.ended === true` en 180.03 s; 250 pedidos y ninguno con status >= 400 |
| `npm test` | 46 de 46, `fail 0`. `test/` 43, `demo/compatibility-pair/test/` 3 |
| `npm run check` | `verificar-cortes: both seams hold.` |
| el grep de autosuficiencia de `test/` | cero líneas |

Y lo que sólo se podía mirar acá, porque es sobre el conjunto: **el `ls` de la
raíz devuelve los once archivos y carpetas de una sdk** —`lib/`, `dist/`,
`test/`, `docs/`, `vendor/`, `demo/`, `scripts/`, `server.mjs`, `run.sh`,
`package.json`, `README.md`— y nada de la página. Ni un archivo de la demo quedó
arriba.

## La cuenta de tests, que es donde la fase podía salir mal en silencio

Antes de la fase `test/` tenía 43 tests, en tres archivos de 16, 15 y 12. Después
tiene los mismos 43, con los mismos tres archivos y las mismas cuentas, más los 3
de la demo. La suite no adelgazó, y el número que más podía moverse
—`program-ranges-and-volume.test.js`— quedó en 12 antes y después: las tres
afirmaciones que bajaron a la demo se compensan con el test de integridad del
fixture que la T-01 agregó.

## Los seis cuadros, mirados como imagen

Los cinco breaks se ven como tienen que verse, y el cuadro es la composición
quieta: en cada ventana se pausó con el control de la librería, se sacó el PNG y
se reanudó.

| cuadro | qué muestra |
| --- | --- |
| break 1, `cornerOverlay` | el overlay arriba a la izquierda sobre el programa, que se sigue viendo; a la izquierda el de fábrica con el aviso lineal a cuadro entero |
| break 2, `squeezebackLShape` | la L: el programa achicado arriba a la izquierda, la barra vertical a la derecha y la horizontal abajo |
| break 3, `squeezebackLShape` con stills | la misma L con imágenes jpeg, y la línea de estado diciendo que el aviso no tiene audio |
| break 4, `multiView` | el Quad: el programa en un cuadrante y tres vistas en los otros |
| break 5, aviso 1 | el mezclado arrancando, overlay sobre el programa |
| break 5, aviso 3 | el aviso a cuadro entero, con el par invertido: el de fábrica ya volvió al programa y el nuestro está tapado |

El cuadro del break 2 se comparó con el de la T-03: la misma composición, los
mismos recuadros, el mismo segundo. La mudanza no movió un píxel.

Dos cosas que se leen en la evidencia y no son defectos, dichas para que nadie
las lea como tales. En dos de las pausas el reloj del pane de fábrica marca 3.55
y 3.04 en lugar del segundo del programa: son los dos breaks en los que hls.js le
pasa el MediaSource al asset, así que el elemento reporta el reloj del aviso, y
está escrito en el README de la demo. Y los cuadros no tienen el audio encendido,
porque el audio es del briefing de grabación y no de lo que un cuadro prueba.

## La etiqueta de `server.mjs`, decidida

La T-04 dejó abierto el último sobreviviente del nombre viejo: la línea de
arranque imprimía `hls-non-linear-ads-demo:`, y ningún ADR dice cuál tiene que
ser la etiqueta nueva. **La etiqueta nombra a la herramienta que imprime la
línea**, que es la convención que las otras dos ya usan —`construir-libreria:`
sale de `scripts/construir-libreria.sh` y `verificar-cortes:` de
`scripts/verificar-cortes.mjs`, las dos el nombre del archivo sin su extensión—,
así que quedó `server:`.

Ese criterio es el que contesta la duda que la T-04 planteó y por la que no la
copió del manifiesto: el servidor sirve una demo y no la sdk, así que no le
corresponde el nombre del producto; y tampoco el de una demo, porque sirve la que
se le nombre. Nombrándose a sí mismo dice lo único que es cierto para las tres
raíces que monta, y qué carpeta está sirviendo ya lo dice la misma línea, después
del guión.

    server: http://localhost:8080/ -- serving demo/compatibility-pair

Con eso el nombre viejo no queda en ningún archivo tracked fuera de `.project/`,
donde queda como registro.

## Lo que se arregló, y lo que se reporta

El chequeo de rutas se corrió sobre los 36 archivos de texto tracked y no sólo
sobre los dos README, y cubriendo la prosa y los bloques de código además de los
links markdown, porque lo que se quedó viejo dos veces en esta fase fue una ruta
adentro de un comentario. Resultado en `t06-las-rutas-resueltas.txt`: 12 links y
179 rutas resueltas, y **una ruta vieja**.

**Arreglado, y era de la T-03.** `test/fixtures/README.md` decía que `run.json`
reemplaza el parseo de `scripts/senalizar-contenido.sh`, y ese script bajó a
`demo/compatibility-pair/scripts/` con la mudanza: el `scripts/` de la raíz es el
de la sdk y no lo tiene. Quedó nombrado por lo que es, el script de señalización
de la demo, que es la forma en que ese mismo documento ya nombra a `signalling/`.

**Arreglado, y era del ajuste del preámbulo.** El mismo README explicaba que sus
rutas van sin prefijo porque el grep de autosuficiencia mira la carpeta entera,
"este README incluido". El grep se acotó al código (`--include='*.js'`) cuando la
T-01 encontró las quince líneas de dato medido, así que ese README ya no está
adentro del alcance y la razón escrita había dejado de ser cierta. El párrafo
ahora dice el alcance que el chequeo tiene, y la omisión se queda: una ruta
completa es algo para seguir, y la procedencia de una copia es algo para saber.

**Se reporta, y no se toca:** que las cinco citas a `.project/` de ese README
podrían escribirse completas, porque el ADR 0023 dice explícitamente que la
documentación cita el registro y el grep ya no las alcanza. Es cambiar una
decisión de la T-01 y no arreglar un defecto, así que queda dicho y no hecho.

## Cero hallazgos abiertos

Los dos que las tasks anteriores dejaron —la etiqueta de `server.mjs` y el
alcance del chequeo de links— están cerrados, y el único que este chequeo
encontró está corregido. No queda ninguno abierto.

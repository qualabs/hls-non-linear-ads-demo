# Evidencia de la T-01 — las cuatro secciones, la copia y el comentario de cabecera

Registro de lo que se corrió y se miró el 2026-09-11. No es instrucción vigente:
lo que se vuelve a correr son los dos scripts de acá abajo y los tres comandos de
siempre.

## La línea de base de la fase

Medida **antes de tocar un archivo**, que es para lo que existe: la T-05 compara
contra esto y no contra la memoria de nadie.

| archivo | qué dice |
| --- | --- |
| `linea-de-base-suite.txt` | `npm test` — **124 pruebas, 124 en verde** |
| `linea-de-base-costuras.txt` | `npm run check` — las dos costuras en pie |
| `linea-de-base-mutaciones.txt` | `npm run mutaciones` — 4 chequeos en verde, 10 roturas en rojo |

La suite se movía mientras esto corría: tres tasks de la fase 11 estaban editando
`lib/` en paralelo. El número de base es el del momento en que la T-01 arrancó.

## Lo mismo, después de la task

| archivo | qué dice |
| --- | --- |
| `suite.txt` | 124 pruebas, 124 en verde. **Ninguna prueba menos** |
| `costuras.txt` | idéntico a la línea de base |
| `mutaciones.txt` | **byte a byte idéntico** a la línea de base |

La task no agrega ni toca una sola prueba, y eso es lo esperado: no hay lógica no
visual acá. Los chequeos nuevos de la fase son de la T-02 y de la T-03.

## Los dos instrumentos

| archivo | qué hace |
| --- | --- |
| `capturas.py` | carga la página en los dos anchos, mide `scrollWidth` contra `clientWidth`, lee los cuatro `aria-label` en orden y el contenido de las dos cajas de montaje, y escribe las dos capturas de página entera. Salida en `medicion-ancho.json` |
| `recorrido.py` | mira el recorrido guiado: que arranque solo cuando el player entra en pantalla, la primera placa, el rótulo del botón durante y después, y el reinicio. Salida en `recorrido.json` |

Los dos necesitan `playwright` —en esta máquina, el del skill:
`/home/nicolas/.claude/skills/playwright/.venv/bin/python`— y la demo servida en
`http://localhost:8090/`.

## Lo que las mediciones dicen

**El documento no scrollea de costado en ninguno de los dos anchos.** A 400 px
`scrollWidth` es 400 y a 1907 es 1907, que es la propiedad que
`chapter__inner { min-width: 0 }` defiende y la que el JSON crudo de la T-03 va a
volver a poner en riesgo.

**Las cuatro secciones están en el orden del pedido**, leídas de los `aria-label`:
*Two ways to run an Ad*, *The signalling class*, *The signalling, as it is served*,
*Credits*.

**Las dos cajas de montaje están vacías**, `#shapes` y `#assets`, sin texto de
relleno.

**El recorrido guiado corre igual que antes**: cuatro líneas de apertura, arranque
por viewport, la primera placa del guion, el botón que dice *Skip the walkthrough*
durante y *Play the walkthrough again* al terminar, y el reinicio que vuelve el
programa a cero y repite la primera placa. Cero errores de consola.

**La sección 3 sigue leyendo en vivo.** El `START-DATE` que se ve en el `<pre>` del
tag es el de `content/primary/con-daterange.m3u8` de esa corrida, y el segundo
`<pre>` sigue mostrando el asset-list que el player fue a buscar.

## Las capturas

| archivo | qué es |
| --- | --- |
| `pagina-400x780.png` | la página entera, de arriba a abajo, a 400 px |
| `pagina-1907.png` | la página entera a 1907 px |
| `seccion-1-1907.png`, `seccion-2-1907.png`, `seccion-2-400x780.png` | las dos secciones con copia nueva, para leerlas sin el resto de la página encima |

## Una nota sobre cómo se sirvió la demo

La demo se sirvió con `PORT=8090 node server.mjs demo/hydration-break` y **no** con
`./run.sh hydration-break`, que es lo que la task pedía. La razón es de ese día y
no del comando: `run.sh` reconstruye `dist/` desde `lib/` en cada arranque, y
`lib/` estaba siendo editado por tres tasks de la fase 11 al mismo tiempo. Una
reconstrucción a mitad de edición se le mete en el `dist/` a todas las demos
servidas, incluidas las de esas tasks. La playlist señalizada y el `dist/` que se
usaron son los que `run.sh` había escrito en esa misma jornada.

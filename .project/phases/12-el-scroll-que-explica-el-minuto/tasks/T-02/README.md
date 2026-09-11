# Evidencia de la T-02 — la galería de formas, dibujada del contrato, con su guarda

Registro de lo que se corrió y se miró el 2026-09-11. No es instrucción vigente: lo
que se vuelve a correr son los dos instrumentos de acá abajo y los tres comandos de
siempre.

## La premisa, comprobada antes de escribir una línea

El primer paso de la task era el riesgo R4: que `activeAt` conteste por tiempos que
todavía no se reprodujeron. Estaba leído en la fuente, y acá está medido en vuelo:
con la página recién cargada y el programa en `currentTime: 0`, `programRanges()` ya
devolvía `settled: true` y `activeAt(60)` contestaba con el cuarto aviso del break y
sus cajas resueltas. **La premisa es verdadera, así que la task siguió**; si hubiera
resultado falsa, la salida era el hallazgo y no un parser del asset-list escrito en la
página.

## Lo que se construyó

| archivo | qué es |
| --- | --- |
| `demo/hydration-break/js/tipos.js` | el módulo: enumera los avisos caminando `activeAt` sobre los rangos de `kind` `'concurrent'`, y dibuja una ficha por aviso con las cajas del contrato |
| `demo/hydration-break/js/app.js` | dos líneas: el import y la llamada |
| `demo/hydration-break/css/page.css` | el bloque de la galería, sin colores nuevos |
| `demo/hydration-break/test/comprobaciones.js` | `laGaleriaSeDibujaDelContrato`, la guarda |
| `demo/hydration-break/test/signalled-run.test.js` | la prueba que la corre sobre los archivos de verdad |
| `demo/hydration-break/test/mutaciones.mjs` | el control: una copia de `index.html` con un identificador plantado |

`index.html` no se tocó: la T-01 ya había dejado la caja de montaje y la línea de
prosa del ADR 0074 al pie de la sección.

## Las tres corridas

| archivo | qué dice |
| --- | --- |
| `suite.txt` | `npm test` — **156 pruebas, 156 en verde** |
| `costuras.txt` | `npm run check` — las dos costuras en pie |
| `mutaciones.txt` | `npm run mutaciones` — **5 chequeos en verde y 11 roturas en rojo** |

**La diferencia contra la línea de base de la T-01 (124) está explicada y no es de
esta task sola.** Esta task agrega **una** prueba, la de la guarda. Las otras vienen
de la fase 11, que corre en paralelo sobre `lib/` y sobre `test/`: mientras esta task
se ejecutaba apareció `test/views-selector.test.js`, con cuatro pruebas más, escrito a
las 13:00. Medido y no supuesto: la carpeta de la demo declara 6 pruebas
(`node --test demo/hydration-break/test/signalled-run.test.js`), que son las 5 que ya
tenía más la nueva.

## La guarda, y el control que la vio ponerse roja

La guarda mide una propiedad y no repite una conclusión: **ninguno de los
identificadores de layout que el asset-list declara aparece como literal en
`index.html` ni en `js/tipos.js`**. Los identificadores salen del asset-list y no de
una lista escrita en el chequeo, por la misma razón que la galería sale del contrato.

El control está en `mutaciones.txt`, en el pie de la campaña:

```
  ROJO   laGaleriaSeDibujaDelContrato
         regla:  ningún identificador de layout está escrito a mano en la página (ADR 0073)
         rotura: a una copia de index.html se le planta `lowerThirdOverlay` como rótulo
                 escrito a mano, que es la galería degradada a una lista de nombres
         dijo:   `index.html` tiene escrito el identificador de layout `lowerThirdOverlay`:
                 la galería dejó de derivarse del contrato y pasó a ser una afirmación, que
                 es lo que envejece sin que nadie se entere (ADR 0073)
```

La rotura corre sobre una copia en memoria del texto de los dos archivos; el árbol no
se toca. Y el identificador que se planta también sale del asset-list, así que el día
que el asset-list cambie la rotura planta el nombre que importa y no uno viejo.

La guarda además se protege de sí misma: si el asset-list no declarara ningún
identificador, el chequeo no tendría qué buscar y no podría dar rojo nunca — así que
en ese caso **es el chequeo el que se reporta roto**.

## Los dos instrumentos

| archivo | qué hace |
| --- | --- |
| `galeria.py` | carga la página en los dos anchos, espera a que la galería esté dibujada (y no a un temporizador), mide `scrollWidth` contra `clientWidth`, lee de cada ficha el rótulo y las cajas con sus insets computados, y chequea si alguna etiqueta se desborda de su caja. Escribe las capturas y `medicion-galeria.json` |
| `cotejo.mjs` | coteja las cajas dibujadas contra los `viewport` del asset-list, ficha por ficha y en los dos anchos. Salida en `cotejo-cajas.txt` |

`galeria.py` necesita `playwright` —en esta máquina, el del skill
`/home/nicolas/.claude/skills/playwright/.venv/bin/python`— y la demo servida.
`cotejo.mjs` corre con node desde la raíz del repositorio y lee el JSON de al lado.

## Lo que las mediciones dicen

**Las cuatro fichas dibujan exactamente las cajas que el asset-list declara**, en los
dos anchos (`cotejo-cajas.txt`). Incluidos los dos casos donde el asset-list no dice
nada y la capa aplica su default: el `primaryContent` ausente de los dos overlays
(ADR 0004) y el aviso sin bloque, que la señalización sintetiza como un elemento a
cuadro entero sobre el primario (ADR 0019). La página no re-implementa ninguno de los
dos: le llegan resueltos.

**Ningún rótulo se desborda de su caja** en ninguno de los dos anchos, y la más chica
—la esquina del cuarto aviso— mide 90×50 px a 400 px de viewport.

**El documento no scrollea de costado**: `scrollWidth` 1907 sobre `clientWidth` 1907,
y 400 sobre 400.

**Cero errores de consola** en las dos corridas.

## Las capturas

| archivo | qué es |
| --- | --- |
| `seccion-1-1907.png` | la sección 1 entera a 1907 px: las cuatro fichas en dos columnas |
| `seccion-1-400x780.png` | la misma sección a 400 px, en una columna |
| `pagina-1907.png`, `pagina-400x780.png` | la página entera en los dos anchos |

## Dos cosas que se decidieron mirando, y que la captura muestra

**Las cajas se dibujan opacas.** Con relleno traslúcido, el aviso lineal —un elemento
a cuadro entero sobre un primario a cuadro entero— salía con su propio rótulo impreso
encima del de abajo, que se lee como un defecto y dice lo contrario de lo que la ficha
afirma. Opacas, una caja arriba tapa a la de abajo, que es lo que pasa en la imagen.

**El rótulo de cada caja va al pie de su caja y no arriba.** Una caja dibujada sobre
otra le tapa primero la parte de arriba: con los rótulos arriba, el nombre del fondo
de la L quedaba cortado al medio por el contenido primario dibujado encima.

## Cómo se sirvió la demo

`PORT=8092 node server.mjs demo/hydration-break`, y **no** `./run.sh hydration-break`,
por la misma razón que la T-01: `run.sh` reconstruye `dist/` desde `lib/` en cada
arranque, y `lib/` lo están editando las tasks de la fase 11. El `dist/` y la playlist
señalizada que se usaron son los que `run.sh` escribió en esa misma jornada. El server
se apagó al terminar.

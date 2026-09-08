---
id: "0020"
title: La raíz del repositorio es la librería, y demo/ es donde se la muestra
status: accepted
scope: project
date: 2026-09-08
supersedes: null
superseded_by: null
generalizes: ["0015"]
generalized_by: null
---

## Contexto

El ADR 0015 dividió este repositorio en dos, la librería y la página que la usa,
y lo hizo adentro del código: `lib/` son los cinco módulos de la sdk y `js/` son
los tres de la página. La división existe y la verifica un grep
(`scripts/verificar-cortes.mjs`), pero **no se ve desde afuera**. Quien abre la
raíz encuentra `brand/`, `content/`, `css/`, `signalling/` e `index.html` al lado
de `lib/`, todos al mismo nivel y sin nada que diga cuál es el producto. El
`package.json` se llama `hls-non-linear-ads-demo` y no declara `main`, `module`,
`exports` ni `files`: el único archivo que podría decir qué es la sdk no dice
nada.

Y hay una razón para resolverlo ahora y no cuando aparezca la segunda demo: todo
lo que se construya con la estructura vieja se construye del lado equivocado de
la línea y hay que mudarlo después, que es el mismo argumento con el que el
ADR 0015 puso su corte primero adentro de su fase.

## Decisión

**La raíz del repositorio es la sdk, y `demo/` es donde se la muestra, con una
subcarpeta por demo.**

El reparto de cada archivo sale de una sola pregunta: **¿existiría si no hubiera
ninguna demo?** Si la respuesta es sí, es de la sdk y se queda en la raíz. Si es
no, es de la demo y baja a su carpeta. La pregunta no es "¿lo usa la demo?",
porque la demo usa la sdk entera; es si el archivo tiene una razón de ser propia
cuando no hay una página que mostrar.

Aplicada al árbol de hoy:

| queda en la raíz | por qué |
| --- | --- |
| `lib/` | es la sdk |
| `dist/` | es la sdk construida. Generado, gitignored |
| `test/` | prueba las funciones puras de la sdk |
| `docs/` | el contrato entre las dos capas y cómo integrar la librería: los dos le hablan a quien construye con la sdk |
| `scripts/construir-libreria.sh` | construye la sdk |
| `scripts/verificar-cortes.mjs` | verifica las dos costuras de la sdk, ADR 0003 y ADR 0015 |
| `vendor/hls.min.js` | ver abajo |
| `server.mjs` | un servidor para todas las demos (ADR 0022) |
| `run.sh` | construye la sdk y levanta la demo que se le nombre |
| `package.json` | el manifiesto de la sdk (ADR 0024) |
| `README.md` | enruta (ADR 0025) |

| baja a `demo/compatibility-pair/` | por qué |
| --- | --- |
| `index.html` | es la página |
| `css/player.css` | es la hoja de estilos de la página. Los controles traen su propio CSS adentro de `lib/controls.js`, así que esta hoja no tiene nada de la sdk |
| `js/` (`app.js`, `stock-player.js`, `contract-trace.js`) | el cableado de la página, el pane de fábrica del par de compatibilidad y la traza del contrato |
| `brand/` | ver abajo |
| `signalling/` | ADR 0021 |
| `content/` | el material empaquetado de esta demo. Generado, gitignored |
| los tres scripts de contenido | bajan, empaquetan y señalizan el material de esta demo |
| `CREDITS.md` | la atribución CC BY que exige el material de esta demo |

Las carpetas conservan su nombre adentro de la demo, que es lo que deja las
rutas relativas de `index.html` byte por byte iguales.

**Los tres archivos que la pregunta no contesta sola:**

**`vendor/hls.min.js` queda en la raíz.** La lectura que lo bajaría a la demo es
buena: la librería nunca recibe el constructor de hls.js, lee `window.Hls`, así
que proveerlo es tarea del integrador y acá el integrador es la página. La que
gana es la otra: 1.7.2 no es un asset de la página, es la versión contra la que
la sdk está leída y medida (ADR 0002), y una segunda demo tiene que usar la misma
o la garantía de la sdk no vale. El desempate es preguntar quién queda mal si
está en el lugar equivocado: con una copia por demo, el día que la sdk suba de
versión cada demo queda con una copia vieja y nada lo dice. Al revés no hay
problema simétrico, porque una demo que necesite otra versión puede vendorearla
al lado de su propia página.

**`brand/` baja a la demo.** `docs/integrating-the-library.md` §7 se titula "The
brand is yours, because this library ships none": la librería no envía marca, la
recibe. La marca es de la página.

**`css/player.css` baja a la demo**, y no es dudoso una vez que se mira el
código: `lib/controls.js` lleva su propio CSS adentro (las reglas `.qa-*` y las
variables `--qa-*`), así que la hoja de la raíz es solamente la página.

**Y una demo se nombra por el argumento que hace, no por la ocasión, el
contenido ni la plataforma.** La que existe se llama `compatibility-pair`: es una
página con dos players al lado, los dos sobre la misma URL, uno de ellos hls.js
en configuración de fábrica, y el proyecto ya la nombra así en los dos lugares
donde tuvo que explicarla (el README y el primer bloque de comentario de
`index.html`, los dos apuntando al ADR 0007). Descartados, y cada uno dice qué
falla del criterio: `hls-interest-day` nombra la ocasión y choca el día que haya
una segunda demo para el mismo evento; `five-layouts` nombra el contenido de la
corrida, que es justo lo que más cambia; y `web-hlsjs` nombra la plataforma, que
es lo que distingue a este repositorio entero y no a una demo de adentro. El
nombre va en inglés, como todos los artefactos que miran hacia afuera de este
repositorio.

## Consecuencias

**`demo/` es para demos web de esta sdk, y iOS no entra ahí.** El ADR 0015 ya
dice que la plataforma nativa hereda la línea y no el código.

**Este ADR generaliza el ADR 0015 y no le contradice nada.** Ese ADR puso la
línea adentro del código y dijo qué queda de cada lado; éste la ensancha al árbol
del repositorio y agrega la parte que ese ADR no tenía por qué contestar: que del
lado de la demo puede haber más de una, cada una en su carpeta, y cuál es la
pregunta que reparte un archivo nuevo. Todo lo que el ADR 0015 afirma sigue
valiendo, incluida su costura verificada por grep, que es la que ahora encuentra
a la librería nombrando a la demo.

**La costura del ADR 0015 se vuelve más filosa por el solo hecho de la
mudanza**, y esto es un efecto que vale escribir porque nadie lo pidió. Su grep
busca el término `demo` en `lib/*.js` con lista de aceptados vacía, así que
cualquier cita de la librería a un archivo que bajó se pone roja. Ya encontró
una: el comentario de `lib/controls.js` que explica por qué el amarillo y el
violeta no son colores de marca citaba `brand/README.md`. Se saca la ruta y se
queda la frase, porque el argumento del comentario es que esos dos colores son
funcionales y para un argumento el chequeo es un lector, no un grep.

**El grep del ADR 0003 reescribe dos rutas y no pierde ninguna.** Su lista de
archivos del lado del renderizado incluye `js/contract-trace.js` y
`css/player.css`, que se mudan, y pasan a nombrarse bajo
`demo/compatibility-pair/`. Se actualizan y no se sacan: esa lista es por archivo
a propósito, y esos dos archivos ganan su lugar porque son la prueba de que el
contrato alcanza para dibujar, que es el argumento del ADR 0003. Lo que no puede
depender de una demo es la verificación de completitud del script, que exige que
todo `lib/*.js` esté de un lado o del otro de la costura, y ésa ya es sólo sobre
`lib/`.

**Las URLs que sirve la demo cambian de lugar en el árbol y no en el navegador**,
porque el ADR 0022 le da al servidor la carpeta de la demo como raíz de
documentos. Que el cambio de URLs no fuera un problema estaba aceptado de
antemano; el efecto lateral es que igual no hay cambio.

**El `.gitignore` no se toca.** Sus dos patrones relevantes, `content/` y
`dist/`, no llevan barra inicial, así que matchean a cualquier profundidad
(verificado con `git check-ignore`).

**El costo, dicho de frente: la raíz gana una carpeta y la demo gana un nivel de
profundidad.** Todo lo de la página queda un directorio más abajo, y los comandos
de contenido de esa demo pasan a nombrarse con su ruta completa. Se paga una vez
y compra que la segunda demo no tenga que discutir dónde va.

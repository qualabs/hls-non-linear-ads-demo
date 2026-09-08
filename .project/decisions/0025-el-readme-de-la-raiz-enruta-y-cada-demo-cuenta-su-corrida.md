---
id: "0025"
title: El README de la raíz enruta, y cada demo cuenta su corrida
status: accepted
scope: project
date: 2026-09-08
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El README de la raíz tiene 347 líneas y nueve secciones, y es de las dos cosas a
la vez: describe la librería y describe la corrida de la demo. Con la página
mudada a su carpeta (ADR 0020) hay dos README y hay que decidir qué dice cada
uno, y hay que decidirlo con una regla y no archivo por archivo, porque la
pregunta vuelve con cada demo nueva.

## Decisión

**El README de la raíz enruta, y cada demo cuenta su corrida.** Dos reglas, y la
segunda es la que evita que la raíz vuelva a crecer:

1. **Cada párrafo va donde vive su tema, y el otro README recibe un puntero,
   nunca un resumen.**
2. **El README de la raíz no describe la corrida.** La corrida es una propiedad
   de una demo.

El reparto del documento de hoy:

| sección | va a | por qué |
| --- | --- | --- |
| encabezado (qué es esto) | los dos, reescrito en cada uno | la raíz dice qué es la sdk; la demo dice qué muestra esta demo. No es el mismo párrafo dos veces, son dos temas |
| Run it | demo | es el comando de esta demo. La raíz queda con el `./run.sh <demo>` en la sección de demos |
| Before you record | demo | entero. Es sobre esta corrida: los cinco breaks, el audio, la inversión del tramo del break 5 |
| la tabla de los cinco breaks | demo | es la corrida |
| Test it | los dos, partido | la raíz: `npm test` y `npm run check`, qué cubren y qué no. La demo: su propio test de la corrida |
| What is where | los dos, partido | cada uno lista su propio árbol. La raíz no lista `demo/` archivo por archivo, lista las demos |
| The compatibility pair | demo | es el argumento de esta página, no de la sdk. La sdk no sabe lo que es un par |
| The two layers | raíz | es la sdk, y es sobre todo un puntero a `docs/contrato-senalizacion-renderizado.md` |
| The library, and the page that uses it | raíz | es la línea del ADR 0015, que es de qué es este repositorio |
| Four things… 1 (maquinaria de interstitials apagada) | raíz, como puntero | es un requisito de la sdk y ya está escrito completo en `docs/integrating-the-library.md` §2.1 |
| Four things… 2 (`EXT-X-PROGRAM-DATE-TIME`) | demo | es una propiedad del contenido empaquetado de esta demo |
| Four things… 3 (un layout inserta una imagen) | demo | es una nota sobre lo que muestra el break 3 |
| Four things… 4 (los dos defaults que la herramienta omite) | raíz, como puntero | es comportamiento de la capa de señalización y ya está en el contrato y en los ADR 0004 y 0014 |

**La raíz gana una sección `demo/`, que es un índice**: una línea por demo con
qué argumenta y un link a su README, más el comando para levantar una. La línea
de `compatibility-pair` dice de qué es el par y apunta al ADR 0007. Esa línea es
el índice haciendo su trabajo, no un párrafo duplicado.

## Consecuencias

**Los dos punteros de la tabla son la tercera duplicación del README y la menos
visible**: los puntos 1 y 4 de "Four things" están hoy escritos completos en el
README **y** en `docs/`. Un dato del que otro artefacto es dueño no se copia, se
apunta. Así que el trabajo del README de la raíz queda en enrutar: qué es la sdk
en pocas líneas, y dónde está escrita cada cosa.

**Una demo nueva agrega una línea al índice de la raíz y escribe su propio
README.** No toca ninguna otra sección, que es la propiedad que esta decisión
compra.

**El README de la demo es el lugar de los comandos que el manifiesto dejó de
tener** (ADR 0024): `serve` y `content` salieron de `package.json` y se escriben
ahí con su ruta completa.

**`docs/` no se parte en subcarpetas por audiencia.** Los dos documentos tienen
el mismo lector, quien construye con la sdk, así que la regla que pide una
subcarpeta por audiencia ya está contestada con una sola.

---
id: "0118"
title: Una reestructura se prueba comparando lo que se publicaría contra lo publicado, y el dist sólo puede cambiar de orden y comentarios
status: accepted
scope: project
date: 2026-10-26
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

La regla de la fase 18 es que nada de lo que hace la demo cambia, y se pidió medirla con la
corrida en seco de `publicar.sh`: la misma lista de lo que se sube. En `0739c38` esa lista es vacía
en las cinco demos. Pero ninguna reestructura de `lib/` deja el dist byte a byte igual: el build
etiqueta cada fuente con su ruta, y partir un archivo reordena declaraciones. Y los cinco
`demo/<demo>/test/signalled-run.test.js` (más `demo/stage-pair/test/verificar-carrera.py`),
publicados con su demo, importan de `lib/signalling.js`.

Nicolás aceptó (2026-10-26, vía agent-nicolas-laptop-865daf) que esos archivos cambien, siempre
que se pruebe que el cambio es inerte, con un script que quede en el repo.

## Decisión

**`scripts/comparar-publicacion.mjs <antes> [<después>]`** arma por demo lo que `publicar.sh`
publicaría desde cada commit y exige:

1. La misma lista de archivos.
2. Los mismos bytes, salvo:
3. **el dist**, que sin comentarios (un lexer de JS que respeta cadenas, plantillas y regex) y
   partido en sus declaraciones de nivel superior tiene que dar **el mismo conjunto de
   declaraciones con el mismo texto**;
4. **un archivo que sólo cambió imports**: con las rutas a módulos de la librería normalizadas y
   las sentencias `import { … } from` quitadas, el resto es idéntico y los nombres importados son
   los mismos.

Su modo `--control` planta un rojo por rama y los verdes que tienen que seguir verdes. La
corrida en seco de `publicar.sh` se sigue comparando antes y después: dice que las referencias y
lo señalizado no cambian.

## Consecuencias

- El próximo push después de una reestructura publica un dist nuevo con el mismo comportamiento.
- La fase DASH, al subir algo de `hls/` a `lib/`, prueba lo mismo con el mismo comando.
- Descartado: etiquetas del build con las rutas viejas (el dist mentiría su procedencia), un parser
  de npm (el repo no tiene dependencias), y sólo la corrida en seco (dice que cambió, no cómo).

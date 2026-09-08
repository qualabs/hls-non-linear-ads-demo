---
id: "0024"
title: El manifiesto declara la sdk sin afirmar que está publicada
status: accepted
scope: project
date: 2026-09-08
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Lo más fuerte que dice hoy el `package.json` es su `name`:
`hls-non-linear-ads-demo`. No declara `main`, `module`, `exports` ni `files`, así
que el único archivo del repositorio que podría decir qué es el producto no dice
nada, y lo que dice nombra a la demo en lugar de a la librería.

## Decisión

**El manifiesto declara la sdk.**

- **`name`: `qualabs-concurrent-hls`**, que es el nombre del archivo construido y
  del global que define. La `description` no se toca: ya describe la librería y no
  la demo.
- **`main` y `exports`: `./lib/concurrent-hls.js`.** Es el punto de entrada de las
  fuentes y la superficie pública real. Descartado apuntarlos a
  `./dist/qualabs-concurrent-hls.js`: `dist/` está gitignoreado y se construye en
  cada arranque, así que un campo del manifiesto que apunta ahí es una afirmación
  falsa en todo clone nuevo.
- **`files`: `["lib/", "dist/", "docs/"]`.** Este es el campo que hace el trabajo,
  porque es literalmente una lista de "qué es el producto", y lo dice sobre todo
  por lo que **no** está: `demo/`, `test/`, `scripts/`, `vendor/`, `server.mjs`,
  `run.sh`. `dist/` sí está, porque es la forma en que el ADR 0015 distribuye la
  librería y es lo que un paquete llevaría.
- **`private: true` se queda, y `version` queda en `0.0.0`.** El ADR 0015 dice que
  la superficie pública no está congelada, así que el manifiesto declara qué **es**
  la sdk sin afirmar que está publicada. Los campos son la declaración; se vuelven
  operativos el día que la superficie se cierre. Descartado inventar un `0.1.0`,
  que sería un número que no significa nada y que después hay que mantener.
- **`scripts` queda con los verbos de la sdk**: `start` (`./run.sh`), `build`
  (`./scripts/construir-libreria.sh`), `check` (`./scripts/verificar-cortes.mjs`)
  y `test` (`node --test`). `build` y `check` no existían y son los dos verbos de
  la sdk que hoy sólo viven adentro de `run.sh` y del README. **`serve` y
  `content` salen**, porque nombran rutas de una demo: van al README de la demo,
  con su ruta completa, que es donde nombrarlas no es una copia de nada.

## Consecuencias

**Nada de esto dice que la sdk se consuma como módulo de npm.** Cómo se obtiene el
archivo lo sigue diciendo `docs/integrating-the-library.md` §8, que es su dueño, y
sigue siendo un `<script src>` que define un global (ADR 0015).

**`files` es verificable sin publicar nada**: `npm pack --dry-run` lista el
paquete, y lo que lista es exactamente esta decisión leída por la herramienta.

**El nombre de la demo por default queda en un solo lugar del repositorio**, el
`run.sh`, porque los dos scripts que lo nombraban salieron del manifiesto.

**El día que la superficie se cierre, esto es lo que hay que cambiar y nada
más**: sacar `private`, poner una versión que signifique algo, y revisar si
`main`/`exports` tienen que pasar a `dist/` porque el consumidor deje de ser una
página con `<script src>`. Queda anotado acá para que esa conversación no
empiece de cero.

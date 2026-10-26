---
title: "HLS y DASH lado a lado"
description: "lib/ queda con lo común (el renderer, el modelo de un corte, las capacidades), hls/ con lo de HLS, dash/ vacía con su regla; lo que hace la demo no cambia, medido contra la publicación de hoy con un script que queda en el repo"
started: 2026-10-26
origin: "Nicolás, 2026-10-26, plan aprobado; despacho de agent-nicolas-laptop-865daf a hls-demo-18 (fase 18). David Hassoun al tanto"
depends_on: []
category: chore
---

# Fase 18: HLS y DASH lado a lado

El diseño está en `DESIGN.md`; esto es el contrato.

## Objetivo

Que la fase siguiente pueda prototipar en `dash/` los mecanismos de SVTA2053 v3 sobre MPEG-DASH
importando de `lib/` lo común, sin mover nada antes. Y que eso no cambie lo que hace ninguna demo.

## Decisiones

- ADR 0116: `lib/` es lo que no nombra el formato, y el grep del ADR 0003 corre sobre la carpeta.
- ADR 0117: `lib/signalling.js` se parte en `lib/experience.js`, `lib/capabilities.js` y
  `hls/signalling.js`; `media.js` y `concurrent-hls.js` pasan a `hls/`.
- ADR 0118: la publicación se compara contra la anterior con `scripts/comparar-publicacion.mjs`; el
  dist y los imports de los tests de demo pueden cambiar sólo de forma inerte.
- ADR 0119: `demo/` no se toca y `dash/` nace con su regla.

## Alcance

1. El comparador de publicaciones, probado en rojo.
2. La partición de la librería: `lib/`, `hls/`, el build, `package.json`, los imports.
3. Las costuras y la publicación: `verificar-cortes.mjs`, `publicar.sh`, `demos-cambiadas.sh`.
4. `dash/README.md` y la documentación que la mudanza dejó falsa.
5. La verificación final contra `0739c38`, y el merge a main local.

## Fuera de alcance

- Cualquier código de DASH.
- Cualquier cambio de lo que hace una demo, y cualquier archivo de `demo/` salvo los imports de sus
  tests (ADR 0118).
- Publicar y pushear.
- Subir a `lib/` auxiliares que hoy sólo usa el cableado de HLS.

## Criterio de cierre

Contra `0739c38`: `npm test` 378/378, `npm run check` verde, `scripts/publicar.sh --all` en seco con
0 referencias faltantes, 0 borrados y la misma lista de copias (salvo el dist y los tests de demo
que el ADR 0118 admite), y `comparar-publicacion.mjs` verde.

## Riesgos

- **Partir `signalling.js` cambia el código de una declaración.** Mitigación: se mueve por script,
  declaración entera, y el comparador exige el mismo conjunto de declaraciones (T-01, T-02).
- **El orden nuevo del build evalúa una constante antes de su dependencia.** Mitigación: el dist se
  evalúa en node y define el mismo global con las mismas claves (T-02).
- **El lexer del comparador declara iguales dos dists distintos.** Mitigación: rojo provocado por
  rama, y el dist sin comentarios pasa `node --check` (T-01).
- **Cambia un archivo publicado que no debía.** Mitigación: comparación por demo y corrida en seco
  antes y después (T-05).
- **Los servers de Nicolás en 8080-8082.** Mitigación: trabajo en `.worktrees/fase-18`; nadie
  reconstruye el `dist/` de main.
- Aceptado: los comentarios de las páginas publicadas que citan `lib/signalling.js` quedan viejos
  hasta que la fase DASH toque `demo/`.

## Stakeholders

Nicolás (aprobó el alcance); David Hassoun (trabaja en el repo, al tanto).

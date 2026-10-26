---
id: "0124"
title: En DASH la lista remota se pide 60 s antes del corte
status: accepted
scope: phase-19
date: 2026-10-26
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

En HLS se siguió la regla de hls.js para pedir el ASSET-LIST (ADR 0108, 0109). dash.js no pide nada
de esto.

## Decisión

SVTA da la regla: demorar la resolución remota hasta que el objeto está por volverse activo
(5.2.2.2.2). 23009-1 da el número para la misma situación en Alternative MPD:
`@earliestResolutionTimeOffset`, 60 s por default (Table 63). La librería pide `$remote.slots`
cuando el playhead está a 60 s del inicio del corte, o al entrar en la ventana por un seek. El
pre-roll se pide al cargar.

## Consecuencias

- Los panes HLS y DASH pueden pedir su lista en momentos distintos; lo que se compara es qué piden y
  qué presentan, no cuándo piden.

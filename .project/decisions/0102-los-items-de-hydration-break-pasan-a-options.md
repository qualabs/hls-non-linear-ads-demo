---
id: "0102"
title: "Los ítems de hydration-break pasan a `options`, y sus lectores leen la primera"
status: accepted
scope: project
date: 2026-10-22
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El asset-list de hydration-break está escrito a mano y sus ítems no tienen `options`. Lo leen por `payload[0].layout` los scripts (`creativos.sh`, `l-capas.sh`, `senalizar-contenido.sh`), los tests y la página (`js/senalizacion.js`).

## Decisión

La L y la esquina pasan a `options: [HLS, MP4]`, con `start`, `duration` e `identifiers` en el sobre. Cada lector lee la primera opción de un ítem (`item.options?.[0] ?? item`), que es la HLS de hoy; la tabla de campos de la página desciende por `options` y explica `options` y `codecs`. El banner y el lineal no cambian.

## Consecuencias

`selectOption` mezcla el sobre con la opción, así que la librería ve el mismo objeto de hoy. Un lector olvidado devuelve `null` sin fallar: por eso el grep de toda la demo y las capturas antes y después.

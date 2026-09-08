---
id: "0021"
title: Un signalling/ por demo, y dos demos que necesitarían la misma lista son una demo con dos corridas
status: accepted
scope: project
date: 2026-09-08
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Los trece asset-lists de `signalling/` bajan a la demo con el resto de la página
(ADR 0020). Eso deja abierta la pregunta que importa de verdad, porque es la que
va a volver: **¿qué pasa el día que dos demos necesiten el mismo asset-list?** Si
no está contestada, la contesta quien esté ejecutando la segunda demo, en el
medio de su trabajo.

## Decisión

**Un `signalling/` por demo, adentro de su carpeta.** Los trece asset-lists van
enteros a `demo/compatibility-pair/signalling/`. No son formas: son formas **con
las URIs de esta demo puestas**, que es como el README ya los describe ("as the
SVTA Layout Controller emits them, with the URIs filled in").

Y de ahí sale la respuesta al caso de la lista repetida, que es más angosto de lo
que parece. **Dos demos sobre material distinto no pueden compartir un
asset-list**, porque cada lista apunta a los segmentos de su propio contenido.
Así que el caso aparece sólo entre dos demos sobre el **mismo** contenido, y dos
demos sobre el mismo contenido son una demo con dos corridas, que es lo que
`senalizar-contenido.sh <segundo> <layout>` ya hace hoy con un argumento.

**El criterio, entonces: si dos carpetas de `demo/` necesitaran el archivo
idéntico, eso no pide una carpeta compartida, pide que sean una sola demo con dos
corridas.**

Descartado: un `demo/signalling/` compartido al lado de los por-demo. Cuesta una
pregunta nueva en cada asset-list que se agregue ("¿este es de todos o de uno?"),
y esa pregunta se paga siempre, mientras que la copia se paga en un caso que la
propia forma del dato vuelve improbable.

## Consecuencias

**Los cuatro `asset-list-repliegue-*.json` están rotos a propósito y son también
corridas servibles de esta demo**: así los ejercitó la T-02 de la fase 03, con el
player corriendo. Se quedan en la demo.

**Cuatro archivos existen dos veces y está dicho.** Esos mismos cuatro tienen su
copia en `test/fixtures/asset-lists/` por el ADR 0023, y no hay chequeo que
compare las dos. Es un residual aceptado explícito, por la misma decisión que
gobierna el resto de los fixtures.

**Una demo nueva empieza con su `signalling/` vacío y lo llena con las URIs de su
propio contenido.** No hereda nada de esta demo, y eso es lo correcto: heredar
una lista sería heredar las rutas de otro material.

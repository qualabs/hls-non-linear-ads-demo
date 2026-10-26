---
id: "0116"
title: lib/ es lo que no nombra el formato, hls/ y dash/ lo que lo nombra, y el grep del ADR 0003 corre sobre lib/ entera
status: accepted
scope: project
date: 2026-10-26
supersedes: null
superseded_by: null
generalizes: ["0020"]
generalized_by: null
---

## Contexto

La fase siguiente prototipa sobre MPEG-DASH los mecanismos de SVTA2053 v3, reusando lo común.
Nicolás aprobó la estructura: `lib/` lo común, `hls/` lo de HLS, `dash/` lo de DASH. Hacía falta
una pregunta que reparta un archivo de la librería, y un chequeo que la sostenga.

La costura del ADR 0003 ya partía `lib/` en dos con un grep por archivo, sobre listas escritas a
mano, más un chequeo de completitud que exigía que cada `lib/*.js` estuviera en una de las dos.
Sus términos son el vocabulario de HLS, y su lado del renderizado es lo que un player de DASH
reusaría.

## Decisión

**Un archivo de la librería va a `lib/` si un player de DASH lo usaría tal cual; si no, va a la
carpeta de su formato, `hls/` o `dash/`.** Es la pregunta del ADR 0020 un nivel más adentro.

**El grep del ADR 0003 corre sobre `lib/*.js` entero**, más los consumidores de demo que ya
nombraba. `SIGNALLING_SIDE` y el chequeo de completitud se van: con el glob no hay lista que
olvidar, y el lado de la señalización es la carpeta del formato. Las tres líneas aceptadas de
`controls.js` no cambian.

**La costura del ADR 0015 corre sobre `lib/*.js` y `hls/*.js`.** `dash/*.js` se suma cuando exista
un archivo: un glob vacío le pasaría a grep una lista vacía, y grep leería stdin.

Que `lib/` no importe de `hls/` no lleva chequeo propio: el import contiene `hls` y el grep lo
encuentra.

## Consecuencias

- Un archivo nuevo en `lib/` entra solo en la costura 0003; uno que nombre HLS ahí da rojo.
- Generaliza el ADR 0020: la raíz sigue siendo la librería y `demo/` donde se muestra; adentro de la
  librería, ahora hay una carpeta común y una por formato.
- El ADR 0003 sigue valiendo entero; cambia cómo se verifica, no lo que afirma.
- Descartado: una costura nueva con su propia lista de términos (dos listas se separan), y seguir
  con la lista a mano (es lo que obligaba al chequeo de completitud).

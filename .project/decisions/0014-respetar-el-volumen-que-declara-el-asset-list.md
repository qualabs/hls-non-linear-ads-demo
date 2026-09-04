---
id: 0014
title: Respetar el volumen que declara el asset list, con el default en silencio
status: accepted
scope: project
date: 2026-09-04
supersedes: 0010
superseded_by: null
---

## Contexto

El ADR 0010 hizo arrancar el aviso concurrente en silencio **siempre**, con
el contenido primario conservando su audio y un control visible para
encenderlo. Lo decidió sobre una medición: la T-03 barrió los seis payloads
que emite el Layout Controller de SVTA y `volume` no aparece en ninguno de
los seis, en ningún elemento. Con el campo ausente la capa de señalización
asume 100 (`DEFAULT_VOLUME` en `js/signalling.js`), así que obedecer el
campo al pie de la letra habría arrancado todos los avisos a todo volumen.
El renderizador, en consecuencia, no lo lee a propósito y lo dice en un
comentario.

David corrigió la lectura del formato en la reunión del 2026-09-04: "you can
specify volume in the asset list JSON" (14:06) y, sobre por qué la
herramienta no lo emite, "it only puts it on there if you change the value,
so by default 100 volume" (23:09). El campo existe y la ausencia es el
default de la herramienta, no un hueco del modelo. Y propuso el caso
concreto para la demo: "the bottom left be 100, and then the other ones are
all 10" (14:15).

Eso choca de frente con el 0010. Una mezcla declarada por la señalización y
un aviso que arranca siempre callado no pueden estar en la misma corrida
grabada.

## Decisión

El estado inicial del audio de cada elemento del aviso es el `volume` que
declara el asset list.

**Cuando el campo no viene, el default es 0, o sea silencio.**

El contenido primario conserva su audio y el reproductor sigue exponiendo un
control visible: esa parte del 0010 no cambia, y se repite acá para que este
ADR se lea solo.

## Es una divergencia deliberada con la semántica de SVTA

Para la herramienta de SVTA un `volume` ausente vale 100, y David lo dijo con
esas palabras. Acá vale 0.

La razón de la divergencia es una sola: **audio inesperado en cámara es peor
que audio faltante.** Una corrida donde un aviso se lleva el audio del
programa no se puede usar y se descubre recién en la toma; un aviso que
arranca callado cuando debía sonar se ve venir y se arregla con un click en
el control.

Va a la lista de cosas para SVTA, y el pedido concreto es que el formato diga
qué significa el campo ausente en lugar de dejarlo en el default de una
herramienta: o dice 0, o dice que lo decide el cliente. Hoy un asset list que
salió de la herramienta y uno escrito a mano sin el campo dicen lo mismo en el
papel y cosas opuestas en pantalla.

## Consecuencias

El renderizador deja de ignorar el campo, y el comentario que dice que no se
lee a propósito se va con él.

**El default de 0 es de los elementos del aviso y no del primario, y
confundirlos apaga el programa.** `resolveElement` resuelve todos los
elementos con la misma constante, primario incluido, y el bloque
`primaryContent` que emite la herramienta tampoco trae `volume`: se ve en
`signalling/asset-list-multiView.json`. Un `DEFAULT_VOLUME = 0` a secas
dejaría el contenido primario en silencio en los cinco layouts, y es
exactamente la clase de falla que no se ve en una captura. El primario
mantiene su 100; el default de 0 aplica al resto.

La demo puede mostrar la mezcla que David propuso, y eso es un asset list
nuevo y no código.

Dos documentos vigentes citan el 0010 y quedan viejos el día que esto se
implemente: la sección `Before you record` del `README.md` y las líneas que
`scripts/senalizar-contenido.sh` imprime en cada arranque. Los dos le dicen a
quien graba que desmutee el contenido primario antes de tocar el botón del
aviso, y ese consejo nació de que el aviso arrancaba siempre callado.

El 0010 no se corrige ni se reescribe: con la información que tenía, decidió
bien. Queda `superseded`.

Y queda media pregunta menos para SVTA. La lista del `PROJECT.md` decía que
la herramienta no emite `volume` nunca; lo correcto es que no lo emite en el
default. Lo que sigue abierto es la otra mitad, que es cuál de varias fuentes
concurrentes querría escuchar quien mira, y esto no la contesta: la contesta
quien arma la campaña, y ahora tiene dónde escribirlo.

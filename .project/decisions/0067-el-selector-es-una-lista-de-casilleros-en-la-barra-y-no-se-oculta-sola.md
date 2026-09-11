---
id: "0067"
title: El selector es una lista de casilleros en la barra de controles, y no se oculta sola
status: accepted
scope: phase-11
date: 2026-09-11
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Nicolás descartó el botón de "entrar al multi view" a favor de ir agregando
videos: *"en lugar de un botón enable multiview, lo que tenemos que hacer es que
cuando estemos en la ventana de multiview aparezca un botón tipo dropdown (muy
estético y lindo) que te deje ir seleccionando qué videos querés ver"*, y fijó
dónde vive: *"como un elemento que se agrega en los controles del player, que es
generalmente donde elegís audio, volumen, fullscreen"*.

`aws-multiview` resuelve lo mismo con **tres entradas** al mismo componente: el
"+" para agregar, el menú por región para reemplazar, y un item de quitar. Esa
división existe por la condición del ADR 0066: allá la lista de ausentes se vacía
con el mosaico lleno.

Y hay un hecho del cromo de este proyecto que decide la mitad de este ADR: **el
auto-ocultado corre contra un temporizador y nada lo suspende**. No hay mecanismo
de *hold* en `lib/controls.js`.

## Decisión

**Una lista de casilleros y no un menú de agregar**, en la fila de arriba de los
controles, al lado del control de audio.

- Una fila por vista de la oferta, con su `name` y el estado de tildada o no.
- **El contenido principal también es una fila**, tildada y **bloqueada**.
- Tildar sube la vista a la grilla; destildar la baja.
- Con cuatro tildadas, las que no lo están quedan deshabilitadas (ADR 0066).
- Destildar la última vista deja una sola caja, que es la salida (ADR 0065).

**Y la lista no se oculta sola**: se copia el mecanismo de *holds* de
`demo-ibc/js/visibility.js` de `aws-multiview` —un `Set` donde cualquier
componente toma un hold y el temporizador sólo corre cuando todos se soltaron— y
se lo agrega a `lib/controls.js`.

Todo vive adentro del elemento del player.

## Consecuencias

**Una sola lista cubre los tres gestos** que allá necesitan tres entradas, y es la
forma literal de lo que Nicolás pidió: *"que te deje ir seleccionando qué videos
querés ver"*.

**Sin el mecanismo de holds la lista se cierra a los 2,6 segundos en medio de la
elección**, que es el defecto que esta decisión existe para no tener. Es lo único
del cromo que se construye de cero en esta fase, y su verificación necesita un
control para poder fallar: la misma espera **sin** hold tiene que ocultar el
cromo.

**El programa no se puede bajar de la grilla**, y es una consecuencia de esta
forma tanto como una decisión propia. El primario no es un elemento como los
otros aunque cuente como vista: lleva el `currentTime` del que salen `activeAt()`,
`applyPlayback`, `seeked` y el largo que mide la barra, así que no se puede
apagar. Bajarlo sería dejarlo reproduciendo e invisible, un estado sin contraparte
en el contrato, donde todo elemento es una caja con `uri` y el primario tiene
`uri: null` justamente porque ya está en pantalla. El sustituto que da casi todo
el valor ya existe: agrandar una cámara es exactamente "ver sólo esa" (ADR 0069).

**Adentro del player y no en la página**, por el ADR 0015 y por la R2 de
`aws-multiview`, que tiene una consecuencia concreta: en pantalla completa lo que
va a pantalla completa es el contenedor, así que un control de afuera desaparece
justo cuando más se lo quiere.

El alcance es de fase porque decide cómo se comporta un control y no qué es este
repositorio, que es el criterio con el que la fase 07 marcó los suyos.

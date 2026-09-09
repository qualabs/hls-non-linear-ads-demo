---
id: "0027"
title: Enfocable es una caja de video del aviso, y nada más
status: superseded
scope: project
date: 2026-09-08
supersedes: null
superseded_by: "0031"
generalizes: null
generalized_by: null
---

## Contexto

El foco de audio del ADR 0026 se mueve con un toque sobre una caja, así que hay
que decir qué cajas lo toman. La composición tiene tres clases de elemento: el
contenido primario, los nodos de video del aviso, y las imágenes, que son un
layout entero de los cinco.

El primario no es una caja como las otras dos: ocupa el fondo entero y un
`pointerdown` sobre la imagen **ya significa** alternar el cromo
(`lib/controls.js:724-744`), que es la regla que la fase 04 midió y escribió.

## Decisión

Enfocable es **una caja de video del aviso**, y nada más.

**El primario no es blanco del gesto**, y la razón es una colisión: hacerlo
enfocable convertiría cada toque sobre la imagen con el cromo arriba en un cambio
de audio, y el gesto que hoy baja el cromo pasaría a cambiar el sonido.

**Las imágenes tampoco.** Una foto no tiene audio, y volver a habilitarle
punteros sólo crearía una zona donde el toque no alterna el cromo y no hace nada.

**El aviso lineal a cuadro entero del break 5 sí es enfocable, y no molesta.**
Declara 100 en el aviso y 0 en el programa (`lib/signalling.js:208-216`), así que
enfocarlo, y desenfocarlo, dan la misma mezcla que ya estaba. Tapa la imagen
entera y por eso hereda el toque que alternaba el cromo, pero el resultado
audible es idéntico, así que no necesita una excepción por tamaño de caja.

## Consecuencias

**No hace falta un blanco para "sólo el programa".** El switch de la composición
ya apaga todo, y la mezcla declarada es la respuesta del anunciante: volver a ella
es el camino del ADR 0029, y existe sin agregarle un blanco al gesto.

Descartado **hacer enfocable el primario** para tener una vuelta a "sólo el
programa" desde el gesto: cuesta la colisión de arriba y el camino de vuelta ya
existe.

La consecuencia de implementación es que los punteros se habilitan sobre los
nodos de video del aviso y sobre ninguna otra cosa, que es lo que el ADR 0028
detalla, y que la capa de los avisos sigue sin recibirlos.

---

**2026-09-09 — superseded por el ADR 0031.** Esta decisión sigue vigente en
qué es enfocable y en por qué el primario queda afuera de esa lista; lo que
ya no es cierto sin matiz es "y nada más": el ADR 0031 le agrega al primario
una salida de foco angosta y condicional, sin sumarlo al índice de foco ni
tocar la colisión que esta decisión describió.

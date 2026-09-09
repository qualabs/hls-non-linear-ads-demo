---
id: "0026"
title: El foco de audio es exclusivo, y es un índice único de toda la composición
status: accepted
scope: project
date: 2026-09-08
supersedes: null
superseded_by: null
generalizes: ["0014"]
generalized_by: null
---

## Contexto

El ADR 0014 dejó el audio de cada elemento en manos del asset list: el `volume`
declarado es el **estado inicial** de cada elemento, con el default en 0 para el
aviso y 100 para el primario. Su frase de cierre reparte quién contesta cuál de
varias fuentes concurrentes querría escuchar quien mira, y le asigna la respuesta
a quien arma la campaña: "la contesta quien arma la campaña, y ahora tiene dónde
escribirlo".

Falta la otra mitad, y en un multiview es la que importa: tiene sentido que quien
mira elija qué escuchar, y lo que estamos construyendo es un multiview. Nicolás
lo encuadró así, y con tres argumentos: el asset list todavía está en desarrollo,
así que una restricción futura puede vivir ahí; un usuario ya puede mutear o
bajar el volumen del televisor, así que impedirlo es en buena medida ilusorio; y
sobre todo, es la capacidad que un multiview pide. Su encuadre del alcance,
textual: *"creo que tiene sentido desarrollarlo como prueba de concepto para
mostrar cómo sería. Y luego, cualquier cosa, agregar restricciones a futuro
dentro del asset list para poder decir que se puede o que no. Pero hoy prefiero
agregarlo."*

La regla venía enunciada como "el elemento tocado se lleva el nivel del
primario", y medida contra el código no sirve. En el Quad la mezcla es primario
10, `view2` 10, `view3` 100, `view4` 10
(`demo/compatibility-pair/signalling/asset-list-multiView.json`), así que darle al
elemento tocado el nivel del primario no cambia nada audible; y en
`cornerOverlay`, donde el primario está en 100 por default y el aviso en 0, subir
el aviso a 100 deja dos bandas sonoras a la vez. Un foco es una **redistribución**
y esa regla lo escribe como una asignación.

## Decisión

El elemento con foco suena a 100 y **todo el resto de la composición va a 0**, el
primario incluido. En los elementos del aviso eso es `muted`, que es lo que
`applyAudio` ya hace cuando el nivel es 0; en el primario es `volume = 0` y nunca
`muted`.

El foco es **un índice de estado del renderer, uno solo para toda la
composición**, y no un flag por elemento. De ahí sale gratis el caso de dos o más
elementos audibles: el Quad son tres cuadrantes más el primario, y dos
experiencias solapadas pueden poner avisos de dos breaks distintos encima del
programa (`asset-list-solapado.json`, y `activeAt` devuelve una lista). Con un
índice único sobre lo que está en pantalla eso no es un caso: es la misma regla
aplicada a una lista más larga.

El audio es una línea de código. Donde `applyAudio` (`lib/renderer.js:471-481`)
dice `volumeOf(element)`, dice el nivel efectivo, que es `volumeOf(element)`
cuando nadie tiene el foco, 1 en el elemento que lo tiene y 0 en todos los demás.
La aritmética va en una función pura exportada al lado de `volumeOf`, por la
misma razón por la que ésa está exportada: un test le puede apuntar sin un
navegador.

**El foco no se pisa con el switch de la composición.** El foco escribe `volume`,
y `muted` sólo en los nodos del aviso, que es donde `applyAudio` ya lo escribía:
`video.muted` no se toca en ningún camino. Las dos cosas quedan bien nombradas,
el switch decide **si suena algo** y el foco decide **qué, de lo que suena**. Con
la composición muteada, tocar una caja no suena y sí se ve, porque la compuerta
del `muted` del primario sigue en pie y la marca sobre la caja no depende del
audio. Levantar el mute desde el gesto sería exactamente la peor de las tres
mediciones de la fase 04.

## Por qué generaliza el ADR 0014 y no lo supersede

Nada de lo que el 0014 decide se vuelve falso. Su palabra es **inicial**, y el
contrato la repite (`docs/contrato-senalizacion-renderizado.md:214`): un control
de quien mira que cambia la mezcla después de arrancada es exactamente lo que esa
palabra deja abierto. Lo que se ensancha es el reparto de quién contesta:

- **El asset list declara la mezcla** y es el estado inicial de cada elemento.
  Eso es del 0014 y no se toca.
- **Quien mira puede sobrescribirla mientras el aviso está en pantalla**, y el
  override muere con el aviso: el default vuelve a ser lo declarado (ADR 0029).

Descartado un **supersede**, porque el mecanismo del 0014 sigue en pie completo.
Y descartada una **excepción escrita adentro del 0014**, porque ese ADR asignó el
dueño de la respuesta de forma explícita, y cambiarlo es una decisión nueva y no
una nota al pie.

## Consecuencias

La media pregunta que el 0014 dejó abierta para SVTA sigue abierta como pregunta
de **formato**: cuál de varias fuentes concurrentes se escucha y cómo se expresa.
Esto la contesta para el renderizado y no para el formato, y la pregunta se queda
en la lista del `PROJECT.md`.

**La restricción queda pendiente y es deliberado.** Un aviso que el anunciante
declaró a 100 se puede callar, y hoy nada lo impide. La contrapartida es una nota
a futuro en el asset list —un campo que diga si el volumen se puede cambiar o si
un elemento es enfocable—, que es del formato, y el ADR 0004 manda consumir el
asset list como lo emite la herramienta de SVTA.

Descartado **atenuar el resto** en lugar de callarlo: inventa un número de mezcla
que nadie declaró y no arregla el Quad, donde `view3` a 100 seguiría tapando a
todos. Y descartado que **el elemento con foco conserve su nivel declarado** y
sólo bajen los demás: en el Quad la composición entera quedaría en 10, o sea que
enfocar bajaría el volumen, que en cámara se lee como una falla. Descartado
también un **flag de foco por elemento**, que permite dos focos a la vez, que es
el defecto que esta decisión resuelve.

El contrato de señalización y renderizado no cambia: `volume` ya está en él y el
documento dice de sí mismo que la política de audio no está ahí, así que un
override en tiempo de ejecución es del renderizado por definición del propio
documento. La costura del ADR 0003 aguanta sin excepciones nuevas y el grep de
`scripts/verificar-cortes.mjs` no crece.

# Los controles de la composición: las decisiones y lo que se midió

2026-09-04. Cuatro decisiones que el bloque de la task dejó abiertas, cada una
con el número que la sostiene, y cuatro cosas que quedaron anotadas.

## 1. Los controles van sobre la imagen y no debajo, así que el fullscreen es del contenedor

El bloque planteó la consecuencia estructural como una condicional: *si la barra
va debajo del área de la composición, el elemento que va a fullscreen deja de ser
la caja 16:9 de la imagen*. Las dos imágenes de referencia contestan la
condicional: la barra está **abajo de todo pero adentro del marco**, sobre la
imagen, con el reloj a la izquierda y el largo a la derecha; la pausa va centrada
sobre la composición y el control de audio arriba a la derecha, los dos también
adentro del marco.

Entonces **no hay contenedor nuevo**. El elemento que va a fullscreen es el
contenedor que el integrador entrega —`#player` en esta página—, que es el mismo
que la capa de avisos cubre y el mismo que el renderizador mide. La trampa de
medición no se compensa: no existe.

**Medido, en el marco:** la caja que el renderizador mide (`layer`), la del
contenedor, la del `<video>` y la de la imagen son **la misma caja**, en el mismo
lugar, con y sin aviso en pantalla:

| | x | y | ancho | alto |
| --- | --- | --- | --- | --- |
| el contenedor | 988 | 257,078125 | 715 | 402,1875 |
| la que mide el renderizador | 988 | 257,078125 | 715 | 402,1875 |
| los controles | 988 | 257,078125 | 715 | 402,1875 |
| el `<video>` | 988 | 257,078125 | 715 | 402,1875 |
| la imagen | 988 | 257,078125 | 715 | 402,1875 |

Y los píxeles del break, que es la medición que la fase 01 corrió cinco veces:
lo que el renderizador dibujó contra lo que `boxToPixels` dice, con el área que
el propio renderizador mide. **Delta máximo 0,000000 px** en los dos elementos de
`cornerOverlay`, primario incluido.

En fullscreen el contenedor deja de ser 16:9, y eso no lo decide esta task: el
navegador le impone el tamaño del viewport (1920 × 901 acá, relación 2,131) y la
regla del user-agent lleva `!important`. Lo que pasa está medido y es menos de lo
que parecía. Con un layout activo el primario llena el área por `object-fit:
cover` (ADR 0013), así que la composición es exacta sobre el área medida y ningún
aviso queda flotando fuera de la imagen: el overlay de esquina arranca en x = 0 y
la imagen también. Sin aviso en pantalla el primario vuelve a `contain` y aparece
el pilarbox de 159,111 px por lado. La consecuencia, dicha de frente: **en
fullscreen sobre un viewport que no tiene la relación de aspecto del contenido, el
encuadre del primario salta al entrar y al salir de cada break.** Está en las
capturas 4 y 6, y en `t03-el-fullscreen-y-la-caja.json`.

Eso se leyó de los píxeles de las capturas y no de un estilo computado, que es lo
que en este repositorio ya dio dos falsos "OK". A media altura del cuadro:

```
$ convert t03-4-fullscreen-controles-escondidos.png -format "%[pixel:p{X,540}]" info:
  x=0 negro   x=158 negro   x=165 srgb(42,28,51)   x=1755 srgb(0,73,88)   x=1762 negro
$ convert t03-6-fullscreen-con-aviso.png -format "%[pixel:p{X,540}]" info:
  x=0 srgb(232,221,195)   x=158 srgb(232,221,197)   x=1919 srgb(23,26,16)
```

Sin aviso hay pilarbox y con aviso no lo hay. Nota para quien lea el JSON: su
campo `laImagen` calcula la caja de `contain`, así que **no** describe el estado
con un layout activo, donde el primario está en `cover` y llena el área.

## 2. El apilado: un z-index arriba del rango, y la capa de avisos intacta

Los controles son una capa hermana de la de avisos, agregada después, con
`z-index: 2147483000`. No es "uno más que el máximo visto": el `zDepth` lo
declara el payload de un tercero, así que el número está arriba del rango que ese
número puede tomar.

La otra mitad del invariante es lo que este archivo **no** hace: no le toca el
`z-index` a la capa de avisos, que sigue en `auto` y por lo tanto sigue sin ser un
contexto de apilado.

**Medido, con la sonda sintética de la T-10 de la fase 01** —un `squeezebackFrame`
con el aviso de fondo en `zDepth` 0 y el primario encima en 1, que es el caso que
ningún asset-list del recorrido tiene—: la captura 5 muestra el aviso magenta
ocupando el cuadro entero, el primario encima, y los cuatro controles arriba de
los dos. Los estilos computados en ese mismo instante: capa de avisos `auto`,
aviso de fondo `z-index: 0`, primario `z-index: 1` con `position: relative`,
controles `2147483000`.

## 3. El estado "el aviso en pantalla no tiene audio" se va del control y queda en la línea del pane

El botón `#ad-audio` distinguía dos estados con el mismo botón deshabilitado: *no
hay aviso* y *el aviso en pantalla no tiene audio*. El control de la composición
no puede heredarlos, y no por falta de lugar: **nunca está deshabilitado, porque
la composición siempre tiene audio.** Los dos estados eran estados de un control
que dejó de existir.

La información sigue siendo cierta y sigue viéndose en cámara, así que **se muda a
la línea de estado del pane** (`#demo-state`), que es donde la página ya dice qué
hay en pantalla. Se calcula del contrato —`mediaType` de cada elemento— así que no
agrega una sola línea a la superficie pública: la página lee lo que ya leía.
Queda `primary content + CONCURRENT AD (squeezebackLShape) · … · nothing was
replaced · stills: this ad has no audio`.

## 4. Qué hace el control de audio hoy, y qué le toca a la T-05

Es el de la composición y es el que la saca del mute con el que la página arranca
por la política de autoplay: conmuta `video.muted`. Los elementos del aviso siguen
saliendo mudos, que es el default del ADR 0014 y es lo que el código ya hacía. La
mezcla por elemento la declara el asset list y es la T-05, **y ahí el mute de la
composición tiene que pasar a ser una compuerta sobre esa mezcla**: hoy no hace
falta porque no hay nada más que suene.

---

## Cuatro cosas que quedaron anotadas y no arregladas

**1. El pane de fábrica no tiene controles nativos, y nunca los tuvo.** El ADR
0015 cierra con "el pane de fábrica conserva sus controles nativos, y eso no es
una inconsistencia… la asimetría visual entre los dos panes refuerza el argumento
de compatibilidad", y el bloque de esta task lo repite como restricción. En el
código, `#stock-video` entró en la T-09 de la fase 01 con `playsinline muted` y
nada más, y sigue igual. O sea que la asimetría que el ADR describe no existe:
antes de esta task el único pane con controles nativos era el nuestro, que es la
asimetría al revés, y después de esta task no los tiene ninguno de los dos. La
task tiene prohibido tocar ese pane, así que queda dicho: **si la asimetría es
parte del argumento, hay que agregarle `controls` al `<video>` de fábrica**, y es
una línea.

**2. `squeezebackFrame` no está en el recorrido.** El bloque pide verificar el
apilado contra "el que pone el aviso de fondo y el primario encima
(`squeezebackFrame`)", y el contrato lo cita igual. Ninguno de los seis
asset-list de `signalling/` es ese layout: en los cinco del recorrido el primario
está siempre en `zDepth` 0 y los avisos en 1, 2 y 3. `squeezebackFrame` es el
sexto payload de la herramienta de SVTA y vive en los fixtures de los tests y en
la sonda de la T-10. Por eso la verificación del apilado se hizo con la sonda
sintética y no con un break del recorrido: es el único modo de ver ese caso en
esta página.

**3. La barra es seekeable, y eso no lo pidió nadie.** Un click sobre el riel
mueve el primario, y el renderizador ya seguía el `seeked`. Se agregó porque una
barra de progreso que no lleva a ningún lado se lee como rota, no porque el bloque
lo pida. Es reversible: son cinco líneas.

**4. El largo que la barra muestra es el del `<video>`, no el del programa
señalizado.** `video.duration` da 180,000 s y la barra dice `3:00`, releído en
cada cuadro (ADR 0016). Es lo correcto para la clase concurrente, que nunca cambia
el largo. Vale saber que el player de fábrica del par **sí** ve otra línea de
tiempo —la T-12 de la fase 01 midió 49,47 s de diferencia después de cuatro
breaks— y que esa diferencia no se refleja en esta barra ni tiene por qué: la
barra es de la composición.

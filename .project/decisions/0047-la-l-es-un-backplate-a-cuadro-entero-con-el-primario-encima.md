---
id: "0047"
title: La L es un backplate a cuadro entero con el contenido primario encima, y no dos tiras
status: accepted
scope: phase-08
date: 2026-09-09
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El minuto del break de hidratación trae un aviso en formato L, que es el más fuerte de los
tres no lineales. La fase lo autoró como **dos elementos de aviso**: una tira vertical a la
derecha y una horizontal abajo, con el contenido primario replegado a la esquina superior
izquierda y sin declararse como elemento del layout.

Nicolás lo probó y marcó que **eso no es lo que la industria hace**:

> *"La L, hoy por lo que veo son como dos videos, y eso no es lo que generalmente se hace.
> Lo que se hace realmente es: el video principal se encoge y se pone por delante
> —manteniendo su relación de aspecto y quedando unido contra los bordes superior y
> derecho—. Por el otro lado, el aviso es un único video que ocupa todo el viewport
> completo pero está en el fondo... El usuario final percibe una banda con forma de L, pero
> la realidad es que es un video completo de fondo con el principal arriba."*

Y no es un detalle estético: **el público del HLS Interest Group es gente que sabe cómo se
autora una L de verdad**, y una demo que existe para mostrar el mecanismo con su propia L
autorada al revés es exactamente lo que esa sala nota.

**El contrato ya expresaba la forma correcta y no hubo que pedirle nada.** Su regla 2 dice
que en `squeezebackFrame` *"el aviso está en `zDepth` 0 y el contenido primario en 1, o sea
que el aviso es el fondo"*, y su regla 3 dice que el primario es un elemento del layout como
cualquier otro, con su `box`, su `zDepth` y su `volume`. El renderizador nombra el caso por
su nombre: posiciona el primario en absoluto para que su `z-index` sea comparable con el de
los nodos del aviso, y su comentario dice que sin eso *"the layouts where the ad is the
background and the picture goes on top of it would come out inverted"*.

## Decisión

**El aviso de la L es un solo elemento a cuadro entero en `zDepth` 0, y el contenido
primario es un elemento declarado en `zDepth` 1** con su caja encogida y anclada contra los
bordes superior y derecho:

```json
"layout": {
  "primaryContent": { "zDepth": 1, "viewport": "0 0 40 40" },
  "assets": [
    { "id": "lBackplate", "uri": "…", "viewport": "0 0 0 0", "zDepth": 0 }
  ]
}
```

La caja del primario **escala los dos ejes por igual**, que es lo que mantiene su relación
de aspecto: sobre un área de imagen de 16:9, el 60 % del ancho y el 60 % del alto siguen
siendo 16:9. Una caja que no lo hiciera deformaría la imagen en el propio `transform`, y el
modo de llenado no la salva.

**Y el creativo es un video a viewport completo**, no dos tiras: su contenido vive en la
banda izquierda y en la inferior, y su centro queda tapado por el partido.

**La geometría de las dos bandas sale del asset list y no del creativo.** Son la caja del
primario vista del otro lado, así que el SVG del creativo es una plantilla y
`scripts/creativos.sh` sustituye los números leyéndolos de la señalización.

## Consecuencias

- **La demo muestra la L como la industria la autora**, que es la única forma en que la
  sala a la que va dirigida la lee como correcta.
- **No cambió una línea de la librería.** El contrato lo expresó sin agregarle un campo, y
  eso es una medición sobre el contrato y no una casualidad: una forma que el documento ya
  nombraba se autoró leyéndolo.
- **Un solo número gobierna el creativo y el layout.** Si el `viewport` del primario cambia,
  el creativo lo sigue. Escrito en dos lugares, el creativo quedaría con tipografía debajo
  del partido o con una franja negra al costado, **y nada fallaría**: es el criterio del
  ADR 0044 aplicado a la geometría de un creativo.
- El asset list pasa de dos elementos de aviso a uno, así que la carpeta de contenido de la
  barra horizontal desaparece.
- El `type` sigue siendo `squeezebackLShape`, que es el nombre del layout en el documento de
  requerimientos y lo que el espectador percibe. Lo que cambió es cómo está autorado, y el
  mecanismo por debajo es el que el contrato llama `squeezebackFrame`.

---
id: "0094"
title: La capacidad se configura como concurrentVideo y concurrentImage, y mandarla en el pedido es opcional
status: accepted
scope: project
date: 2026-10-20
supersedes: "0086"
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El ADR 0086 fijó `capabilities: { videoDecoders, imageOverVideo }` en `attach`, y que esa
capacidad viajara siempre en el pedido del asset-list, como `sgai-video-decoders` y
`sgai-image-over-video`. Los nombres de la opción eran los ejes de R29.1 en camelCase.

El 2026-10-20 David Hassoun cambió la sección 5.3.3 de SVTA2053 (`v3-DRAFT`, cambios con control
de cambios de esa fecha) en dos puntos que tocan esto:

- **Los nombres de la configuración.** *"The capabilities of the device are determined by the
  application, which knows the device and platform it runs on, and are set by the application on
  the configuration of the implementation library of the Player. The configuration SHALL contain
  at least the following properties: concurrentVideo (uint) [...] concurrentImage (Boolean)"*.
  Los parámetros del pedido no cambian de nombre: *"`sgai-video-decoders` [...] carries the value
  of concurrentVideo"*, *"`sgai-image-over-video` [...] carries 1 when concurrentImage is true, and
  0 when it is false"*.
- **Mandarla es opcional.** *"a Player MAY also send the configured capabilities to the APS as
  query parameters [...] Sending them is OPTIONAL. Because capability values add to the
  information that can be used to fingerprint a device or a viewer, a Player SHOULD send them only
  where the security and personal data policies that apply to the implementer allow it; where
  those policies allow it, sending them is RECOMMENDED."* Y el filtro no depende de mandarla:
  *"A capability that is not configured discards nothing."*

Con el ADR 0086, configurar la capacidad y mandarla eran lo mismo: un integrador que no puede
mandarla no tenía forma de que la librería filtrara.

## Decisión

```js
QualabsConcurrentHls.attach(hls, {
  container,
  capabilities: { concurrentVideo: 2, concurrentImage: true },
  sendCapabilities: true
});
```

- `capabilities` lleva los dos nombres de la spec, `concurrentVideo` (entero mayor que cero, el
  primario incluido) y `concurrentImage` (booleano). Cada uno es opcional y el que falta no filtra
  ni viaja.
- **Los nombres viejos no se leen.** La spec no pide compatibilidad hacia atrás. Una clave que la
  librería no lee, `videoDecoders` o `imageOverVideo` incluidas, se avisa por `console.warn`,
  porque si no un integrador con la configuración vieja quedaría filtrando sobre nada sin
  enterarse.
- **`sendCapabilities` separa mandar de configurar.** El filtro usa siempre lo configurado; el
  pedido lo lleva sólo si `sendCapabilities` es `true`. El default es `true`: es lo que la spec
  recomienda donde las políticas lo permiten, y es el comportamiento que ya tenían las demos. Las
  dos páginas de `stage-pair` que lo usan lo pasan explícito, porque el pedido es lo que muestran.
  El default queda como punto abierto para David (ver Consecuencias).
- Los parámetros del pedido siguen siendo `sgai-video-decoders` y `sgai-image-over-video`, y las
  constantes `VIDEO_DECODERS_PARAM` e `IMAGE_OVER_VIDEO_PARAM` no cambian.
- El reporte de `onResolved` habla en los mismos términos: `needs` es `{ concurrentVideo,
  concurrentImage }`, y lleva `sent`, si la capacidad viajó en ese pedido.
- Sigue sin haber eje HTML, por la misma razón que en el 0086.

## Consecuencias

- Lo que del 0086 sigue en pie: la capacidad se pide y no se detecta, va por ejes y no por clase,
  y viaja con los nombres de la spec. Lo que deja de valer: los nombres de la opción, y que
  configurarla implique mandarla.
- `stage-pair` (`stage.json`, `js/capabilities.js`, el banco de medición y los verificadores de
  Python) usa los nombres nuevos. El texto del modo en la URL (`ours-2dec-img`) no cambia.
- **Abierto: el default de `sendCapabilities`.** `true` sigue la recomendación de la spec y no
  cambia nada para quien ya integró; `false` haría que mandarla sea una decisión explícita del
  integrador, que es quien conoce sus políticas de datos. Se cambia en una línea de
  `lib/concurrent-hls.js` y otra de `lib/signalling.js`.
- **Abierto: la forma de la configuración.** La spec dice que la configuración *contiene* las dos
  propiedades, sin decir si van sueltas o agrupadas. Se dejaron dentro de `capabilities`, que es
  donde ya estaban.

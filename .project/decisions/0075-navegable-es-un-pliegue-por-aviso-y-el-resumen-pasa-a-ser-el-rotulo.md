---
id: "0075"
title: Navegable es un pliegue por aviso, y el resumen de hoy pasa a ser el rótulo
status: accepted
scope: phase-12
date: 2026-09-11
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

La sección de señalización lee en vivo el `EXT-X-DATERANGE` de la playlist que el
player está reproduciendo y el asset-list que fue a buscar. Eso es lo que la hace
verdadera y lo que el pedido dijo explícitamente que no se puede perder.

Pero el JSON no se muestra entero: `showSignalling()` lo reduce a `URI`, `DURATION`,
`type` y la lista de cajas, con su razón escrita al lado —*"the whole file is 100
lines and the point is what a break declares, not every viewport of every box"*—.
O sea que **ya hay una reducción, y cien líneas que la página no muestra en ningún
lado**.

## Decisión

**Un `<details>` por `ASSET`, cerrado, con el JSON crudo de ese asset adentro.** El
`<summary>` es la línea de resumen que hoy se imprime, que **deja de ser el contenido
y pasa a ser el rótulo**.

Tres reglas más:

- **La lectura en vivo no se toca.** El tag y el asset-list se siguen pidiendo por
  red. Un tag pegado en el HTML es lo único que esta sección no puede ser.
- **El aviso que está en pantalla se marca en vivo**, comparando por `itemId` contra
  `provider.activeAt(video.currentTime)`, que es la regla 6 del contrato.
- **Se marca y no se abre solo.** Abrir el pliegue automáticamente pelea con quien
  está leyendo: si alguien abrió el aviso 3, el player le abriría el 4 encima a los
  ocho segundos.

## Consecuencias

- **La reducción deja de ser una pérdida.** Las cien líneas entran sin costar
  pantalla, y lo que se ve de entrada sigue siendo corto.
- **Navegar es plegar, y nada más.** Descartado un visor de árbol JSON: es un
  componente que nadie pidió, en una página que no tiene framework ni bundler.
  Descartado también un botón de "ver crudo": eso es un interruptor entre dos bloques
  y el de abajo vuelve a ser cien líneas.
- **`<details>` es nativo**, así que llega accesible por teclado y sin una línea de
  librería, que es la línea que esta demo viene sosteniendo desde la fase 01.
- **La marca en vivo no cuesta una lectura nueva.** `paint()` ya llama a `activeAt` en
  cada `timeupdate`; lo que se agrega es la comparación.
- **El riesgo se muda al ancho.** Cien líneas de JSON adentro de un pliegue son el
  elemento que puede volver a romper el ancho del documento en un teléfono, que ya
  pasó en esta página con los `<pre>`: a 500 px de viewport el documento scrolleaba a
  539. Por eso la verificación de esa task incluye una captura con el pliegue
  **abierto**, y no sólo cerrado.

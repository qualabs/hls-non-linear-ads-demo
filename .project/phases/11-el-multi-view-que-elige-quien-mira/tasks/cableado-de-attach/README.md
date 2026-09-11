# El cableado de `createMultiview` en `attach()`

2026-09-11. La decisión 11 del `DESIGN.md` dice que `attach()` cablea el módulo
del estado de quien mira entre `createSignalling` y `createRenderer` y le pasa
el handle al cromo. Ninguna fila del `TASKS.md` nombra `lib/concurrent-hls.js`
como entry point de eso, así que es un hueco del plan y no una task: esto es su
evidencia.

## 1. Lo que se cableó

`lib/concurrent-hls.js`, y es el único archivo de `lib/` que cambia. Dos líneas
de código y el comentario que las explica:

| dónde | qué |
| --- | --- |
| el import | `createMultiview` desde `./multiview.js` |
| `attach()` | el proveedor que se construye es `createMultiview(createSignalling(...))`. Lo que baja al renderizado, a `playedRanges` y al handle que la página recibe es el decorado |
| `createControls` | un argumento más, `multiview`, que es **el mismo objeto** que el renderizado recibió |

La entrada `multiview` de `KINDS_PLAYED` ya estaba: la puso la T-02.

**El decorado es el que sale por el handle**, y es la parte que no es obvia. El
contrato es el mismo y lo que reporta activo es lo que está en pantalla, cajas
incluidas, así que una página que traza el contrato traza lo que se dibuja y no
lo que se habría dibujado si nadie hubiera elegido nada.

## 2. La página de la demo, que no existía

`demo/multiview-offer/index.html` no estaba escrito: la T-04 dejó el contenido,
la playlist señalizada, los tres asset-lists y el test, y la página es de la
T-11, que está pendiente. Sin una página no hay dónde ver el cableado, así que
se escribió la mínima: el contenedor, el `<video>`, y las seis líneas de la
integración que el README del repositorio publica. No tiene narración, ni guion,
ni recorrido guiado, que es lo que la T-11 le agrega.

## 3. La corrida mirada, sobre la demo servida

`la-corrida.py`, sobre `node server.mjs demo/multiview-offer` en el puerto 8109,
Chrome del sistema por Playwright, headless, 1200×820 con `device_scale_factor`
2. **21 chequeos, 0 fallas.** La corrida entera está en `la-corrida.json`.

| momento | lo que se leyó |
| --- | --- |
| t=10 s, sin ventana | el botón del selector existe y está **oculto**; una sola caja; las tres marcas de la barra, una violeta y dos verdes |
| t=26 s, el aviso concurrente | el `cornerOverlay` de siempre, dos cajas, y el botón sigue oculto: un aviso no es una oferta |
| t=50 s, la oferta de 3 | el botón aparece con la ventana; todavía una sola caja, porque componer es opcional |
| la lista abierta | cuatro filas: `Tears of Steel` tildada y bloqueada, más `Caminandes, early`, `Caminandes, late` y `Elephants Dream, early`, que son los nombres que el asset-list de la demo declara |
| tildar de a una | dos cajas y después tres, las vistas reproduciendo, y el contrato que la página traza pasa a decir `multiViewOffer#BREAK-2-MULTIVIEW.0 · 3 element(s)` |
| destildar las dos | el programa como venía, sin ningún caso especial |
| t=110 s, cerrada la ventana | el botón se fue con ella |

Capturas: `1-el-selector-en-la-demo.png` (la lista abierta sobre el programa) y
`3-tres-cajas.png` (la composición de tres armada desde el selector).

El único 404 de la corrida es `/favicon.ico`, que esta página no declara. Las
doce URLs que la demo sí usa contestan 200.

## 4. Las otras dos demos

**El botón del selector ahora EXISTE en el DOM de las dos**, y eso es lo que hay
que medir en lugar de suponerlo: antes de este cableado `attach()` no le pasaba
`multiview` a `createControls`, así que el botón y el panel no se construían;
ahora se construyen siempre y lo que los apaga es que ninguna oferta esté
activa. `otras-demos.py` lo mide sobre las dos demos servidas, y da **verde en
las diez lecturas**:

```
== compatibility-pair  (http://localhost:8080/)
   {"left": 1305, "top": 312, "ancho": 34, "alto": 34}
   qa-btn qa-btn--views         hidden=True  display=none   {"left": 0, "top": 0, "ancho": 0, "alto": 0}
   qa-btn qa-btn--audio         hidden=False display=grid   {"left": 1305, "top": 312, "ancho": 34, "alto": 34}

== hydration-break  (http://localhost:8081/)
   {"left": 1219, "top": 2806, "ancho": 34, "alto": 34}
   qa-btn qa-btn--views         hidden=True  display=none   {"left": 0, "top": 0, "ancho": 0, "alto": 0}
   qa-btn qa-btn--audio         hidden=False display=grid   {"left": 1219, "top": 2806, "ancho": 34, "alto": 34}
```

La fila de arriba mide lo que medía —34×34, el tamaño de un botón— y el de audio
la ocupa entera, pegado al borde. Lo que lo sostiene es la regla
`.qa-btn[hidden] { display: none }` de `lib/controls.js:481`, escrita a mano
porque `.qa-btn` es `display: grid` y le gana al `[hidden]` del navegador. El
panel vacío es `position: absolute` con `opacity: 0` y `pointer-events: none`,
así que no ocupa lugar ni toma un click.

Capturas: `regresion-compatibility-pair.png` y `regresion-hydration-break.png`.

## 5. El recorrido de `compatibility-pair`, contra su base

El comparador de la T-12 (`tasks/T-12/lectura-del-recorrido.py`), corrido contra
`lectura-base.json` **en el mismo puerto 8080 de la base**, que es lo que evita
el rojo conocido por cambio de puerto:

```
== VERDE: 14 de 14 segundos iguales ==
   El recorrido dibuja lo mismo, en las mismas cajas, que antes de la fase.
```

La lectura nueva quedó en `lectura-con-el-cableado.json`.

## 6. Los tres conteos

| chequeo | resultado |
| --- | --- |
| `npm test` | 156 pruebas, 156 pasan, 0 fallan |
| `npm run check` | verde: 3 ocurrencias aceptadas en la primera costura, cero hits en la segunda |
| `npm run mutaciones` | los 5 chequeos en verde sin romper nada, y las 11 roturas en rojo |

# graphics/creativos/ — la tipografía de los cuatro avisos

**Acá está la mitad de cada creativo que NO se genera.** El reparto es del ADR 0045 y sale de
mediciones, no de comodidad: lo pictórico se genera —la lata, el zapato, la costa—, **la
geometría y toda la tipografía se escriben a mano como SVG** y se rasterizan con Chrome
headless, que da alfa real y dimensiones exactas.

La razón, medida: una L generada volvió como la foto de una L dentro de un rectángulo negro,
sin alfa y con las dimensiones equivocadas, y la versión SVG compuso perfecto en el primer
intento. El titular grande sale tipográficamente limpio del generador; **el texto chico sobre
el producto sale deformado.**

## Cada archivo está al tamaño exacto de su caja, y eso no es una preferencia

El ADR 0013 llena cada caja del layout con **recorte centrado y sin deformar**
(`object-fit: cover`), así que un creativo que no tiene la relación de aspecto de su caja **se
recorta por los bordes** — y los bordes son donde vive la tipografía de un banner. Los números
salen de los porcentajes del `viewport` de cada elemento en
`signalling/asset-list-hydration-break.json`, sobre un área de imagen de 1280×720:

| archivo | caja del asset list | píxeles | relación |
| --- | --- | --- | --- |
| `banner.svg` | `70 0 0 0` | 1280 × 216 | 5,93 : 1 |
| `l-vertical.svg` | `0 0 0 60` | 512 × 720 | 0,71 : 1 |
| `l-horizontal.svg` | `60 0 0 0` | 1280 × 288 | 4,44 : 1 |
| `overlay.svg` | `75 0 0 75` | 320 × 180 | 16 : 9 |
| `linear-endcard.svg` | cuadro entero | 1920 × 1080 | 16 : 9 |

Los tres primeros números coinciden con los que la T-03 de la fase 01 midió sobre la
herramienta de SVTA, que es de donde salen las cajas.

## Las tres marcas son de fantasía y no imitan a nadie

**NEONECTAR** (una gaseosa botánica), **KALTO** (zapatillas), **MERIDIA** (viajes). Identidad
propia: nada de script cursivo blanco sobre rojo, nada de pipa, nada de tres tiras, nada de
felino saltando.

Y eso no se confía al prompt: **está medido que el generador deriva hacia el vestido comercial
real incluso cuando se le prohíbe explícitamente.** Cada pieza generada pasa un chequeo humano
antes de ir a pantalla, y la nota de ese chequeo está en la evidencia de la T-05.

## Cómo se compone

`scripts/creativos.sh`. El fondo es la imagen generada, recortada a la caja; encima va el PNG
rasterizado de estos SVG, con alfa. Para los avisos que son video, el fondo se mueve con un
zoom lento de ffmpeg y **la tipografía se queda quieta**, que es la otra mitad del ADR 0045: el
movimiento va sólo donde la tipografía puede irse de cuadro, y acá no puede porque no se mueve.

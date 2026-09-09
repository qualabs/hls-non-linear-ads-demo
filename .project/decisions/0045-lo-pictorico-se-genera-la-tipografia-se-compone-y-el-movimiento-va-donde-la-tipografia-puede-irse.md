---
id: "0045"
title: Lo pictórico se genera, la tipografía se compone, y el movimiento se genera sólo donde la tipografía puede irse de cuadro
status: accepted
scope: project
date: 2026-09-09
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

No existe una fuente de publicidad con marcas de fantasía, así que cada creativo hay que
producirlo. Hay tres herramientas disponibles y tres mediciones que dicen para qué sirve
cada una.

**Imagen.** La L generada volvió como la foto de una L dentro de un rectángulo negro, sin
canal alfa y con las dimensiones equivocadas; la versión SVG rasterizada con Chrome
headless compuso perfecto en el primer intento. El titular grande sale tipográficamente
perfecto y el texto chico sobre el producto sale deformado.

**Video.** Medido corriéndolo con `veo-3.1-fast-generate-001` en `us-central1`, dándole
como entrada la imagen fija de una marca de fantasía: 8,0 s de 1920×1080 a 24 fps, h264,
25.353.878 bytes, sin pista de audio, en 118 s. Honra el primer cuadro con el titular y
el tagline intactos; sale a 1920×1080 exactos, que el generador de imagen no hace; mejora
el texto chico sin garantizarlo, de `S9KIMLING BOTANICAL SODL` en la entrada a
`SPARKLING BOTANICAL SOOL` en el video; y **el titular se va de cuadro cuando la cámara
empuja**, con lo que el último cuadro es un plano de producto sin tipografía. No es un
defecto del modelo: es lo que hace un movimiento de cámara.

## Decisión

**Tres caminos, y el corte es por tipo de pieza:**

- **Lo pictórico se genera**: la lata, el zapato, la foto del destino, el fondo del panel.
- **La geometría y la tipografía se escriben a mano como SVG** y se rasterizan con Chrome
  headless, que da alfa real y dimensiones exactas: el marco de la L, el banner, el
  scorebug, el reloj, el bug de canal, los wordmarks y todo el texto chico.
- **El movimiento se genera sólo donde la tipografía puede irse de cuadro**, que hoy es
  un solo lugar: el spot lineal, donde la tipografía vuelve al final compuesta con SVG.
  Los formatos no lineales siguen siendo imagen fija con tipografía compuesta, porque ahí
  el texto tiene que quedarse quieto y legible durante todo el break.

**Y cada creativo generado pasa un chequeo humano de vestido comercial antes de ir a
pantalla**, video incluido. Está medido que el generador deriva hacia el vestido
comercial real incluso cuando se le prohíbe explícitamente: con la pipa de Nike y las
tiras de Adidas prohibidas en el prompt, el zapato volvió con un destello lateral curvo
incómodamente parecido a una pipa, y un fondo de fútbol no pedido salió con una camiseta
parecida a la de un club conocido con parche de sponsor en el pecho.

## Consecuencias

- La tipografía nunca se le confía al generador, ni de imagen ni de video, y eso es lo
  que hace que un creativo se pueda corregir editando texto.
- El chequeo de vestido comercial es un paso de la definición de done de la task que
  produce creativos, y no una nota en un README.
- **El metraje del programa no se genera, y el argumento no es la disponibilidad**: un
  minuto pide seis o más generaciones que tengan que coincidir en estadio, camiseta, luz
  y posición de cámara, y el público de una sala técnica mira video por trabajo. Un spot
  de producto de ocho segundos con un solo movimiento de cámara es donde el modelo hoy es
  bueno; un minuto de partido con continuidad no lo es.
- Del costo, leído y no verificado en la factura: la variante fast está entre US$0,10 y
  US$0,15 por segundo según la documentación, del orden de un dólar el clip.
- Y dos trampas de instrumento que esta medición dejó, las dos del mismo tipo que el
  chequeo del scroll de la fase 07. **Los ids de modelo se buscan en la documentación y
  no se inventan**: los `-preview` no existen más, los vivos terminan en `-001`, y el 404
  de un id retirado dice *"was not found **or** your project does not have access to
  it"*, que no distingue las dos cosas, así que probar candidatos mide la lista de
  candidatos y no la disponibilidad. **Y con un cuerpo vacío el chequeo no puede dar otra
  cosa que un 400**, porque la validación corre antes del lookup del modelo: el
  instrumento que dice algo es `{"instances":[{}],"parameters":{}}`.

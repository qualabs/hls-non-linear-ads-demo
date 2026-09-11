---
id: "0073"
title: Los tipos de aviso se dibujan del contrato y no se fotografían
status: accepted
scope: phase-12
date: 2026-09-11
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

La sección 1 de la página del break de hidratación tiene que mostrar los distintos
tipos de aviso, y el pedido original lo formuló como capturas de pantalla.

Una captura choca de frente con la vara que esa página se puso, escrita en el
comentario de cabecera de su propio `index.html`: *"none of it is a recording"*, y
*"no caption on this page can claim something it has not read off the contract"*.
**Una captura es exactamente lo contrario: una afirmación congelada que envejece sin
avisar.** Y envejece en silencio, que es lo caro: el asset-list se edita, el creativo
se recompone, y la imagen sigue ahí diciendo cómo era la demo el día que alguien
apretó el obturador.

El proveedor ya entrega todo lo que un dibujo necesita. Por cada aviso: el `type`, el
`box` de cada elemento en porcentajes de inset, el `zDepth`, el `mediaType`, y cuál
elemento es el contenido primario. Los dos defaults que la herramienta de SVTA omite
(ADR 0004, ADR 0014) vienen ya aplicados del otro lado de la costura, así que dibujar
desde ahí no re-implementa nada.

Y está verificado, contra la fuente y no de memoria, que se puede preguntar por
adelantado: `activeAt` es un `filter` sobre el array completo de experiencias
resueltas, así que contesta por tiempos que todavía no se reprodujeron.

## Decisión

**Las formas de aviso se dibujan con las cajas que el proveedor resolvió, leídas de
los dos métodos que el contrato documenta. No hay capturas de pantalla en la página.**

Los avisos se enumeran recorriendo los rangos de `programRanges()` de `kind`
`'concurrent'`, muestreando `activeAt` a lo largo de cada uno y juntando los `itemId`
distintos, que es la regla 6 del contrato.

**Y la propiedad se fija con una aserción y no con una intención**: un chequeo de la
suite exige que ninguno de los identificadores de layout aparezca como literal en
`index.html` ni en el módulo que dibuja, con su control en la campaña de mutación.

## Consecuencias

- **La galería no puede quedar vieja, y eso deja de depender de que alguien se
  acuerde.** Si el asset-list cambia, el dibujo cambia solo. No hay un paso de
  regeneración, no hay un dueño de ese paso, y no hay una fecha de vencimiento que
  nadie mira.
- **El repositorio no gana imágenes que mantener**, y la página no gana un modo de
  captura que existiría sólo para sacarse fotos y que nadie ejercitaría en el evento.
- **Lo que se pierde es el creativo.** El dibujo es esquemático: muestra dónde va cada
  caja, no qué se ve adentro. Se acepta, y por una razón de audiencia: el público lee
  playlists para vivir, acaba de ver los creativos en movimiento treinta segundos
  antes, y un rectángulo rotulado `70 6.25 12.5 6.25` contra la caja de la imagen le
  dice más que una foto.
- **Si el dibujo llegara a necesitar un método que el contrato no tiene, eso es un
  hallazgo y no un permiso para agregarlo.** Sería la señal de que se está dibujando
  algo que el contrato no dice.
- Descartado el híbrido —el diagrama con la captura adentro de cada caja—: suma los
  costos de las dos opciones y no cancela ninguno.

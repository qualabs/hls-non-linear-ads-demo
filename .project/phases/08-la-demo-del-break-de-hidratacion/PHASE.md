---
phase: 08-la-demo-del-break-de-hidratacion
title: "La demo del break de hidratación"
status: in-progress
started: 2026-09-09
closed: null
---

# Fase 08: la demo del break de hidratación

Una demo nueva en `demo/`, para el HLS Interest Group. El objetivo lo fijó Nicolás:

> *"es una demo nueva en `demo/`. La demo que ya tenemos debe quedar y es una demo
> técnica que su objetivo es validar el desarrollo. Esta es una demo que su objetivo
> es mostrar el potencial de uno o varios casos de uso reales de esta forma de poner
> ads y como este desarrollo lo resuelve."*

Es la primera fase del proyecto **cuyo entregable es lo que se ve en escenario y no lo
que lo hace posible**. Las siete anteriores construyeron el mecanismo y lo verificaron;
ninguna tuvo que hacer que alguien quiera el mecanismo.

Sigue siendo un POC y la vara de ejecución es la de siempre: quick and dirty en lo que
no se ve, y nada se mide más allá de lo que hace falta para que la pantalla cuente el
caso.

## Objetivo

Que **un ingeniero de un broadcaster entienda el caso de negocio en treinta segundos de
mirar la pantalla**. Lo estético es el vehículo de eso y no el entregable.

El caso de uso es uno solo y lo decidió Nicolás: el **break de hidratación**. Un partido
para el juego un minuto, la transmisión no corta a tanda, deja la imagen en vivo y le
pone publicidad no lineal encima. La tesis que la demo demuestra es que el espectador se
queda mirando, y que una tanda lineal en ese minuto lo manda al baño.

## La propiedad que hace que valga

**No es una grabación.** El programa es un HLS real, los `EXT-X-DATERANGE` son reales, el
asset list se pide por red y se resuelve, y los avisos son elementos de video
reproduciendo. De ahí sale la restricción de diseño más fuerte de la fase: **ningún beat
del guion puede afirmar un estado que no leyó**, así que el texto se dispara contra la
señalización resuelta y no contra un cronómetro.

## Alcance

1. **Una demo nueva en `demo/hydration-break/`**, con su propio contenido, su
   señalización, su página y su suite. `./run.sh hydration-break` la levanta, porque el
   ADR 0022 ya sirve la carpeta de cualquier demo como raíz de documentos.
2. **El minuto: un break de cuatro avisos con tres formas de aviso** —lineal a cuadro
   entero, imagen fija no lineal, video no lineal— en una curva de intrusión: banner,
   L, lineal, overlay. El lineal va tercero (ADR 0043) y es un `ASSET` sin bloque de
   layout, que es el camino del ADR 0019. El banner es imagen fija (ADR 0046).
3. **El guion, anclado a la señalización** (ADR 0037): un beat nombra un rango o un
   aviso y una anticipación, nunca un segundo del programa. Vive en `story/story.json`
   como archivo declarado (ADR 0038), se arma cuando la señalización está resuelta y su
   primer beat es una placa con el player en pausa (ADR 0039).
4. **La demo guiada arranca sola, y tiene una sola salida** (ADR 0042): el botón de
   saltear. Un estado y no dos páginas.
5. **El freno es un `pause` del primario y la librería no se toca** (ADR 0040). La placa
   es una capa de la página, y el contenedor del player lleva su propio contexto de
   apilado (ADR 0041).
6. **La página en la estética acordada**: secciones de altura completa con el player
   primero, grande y sin marco; tope de cuatro secciones; paleta corta y neutra, con el
   color traído por el video; la marca de Qualabs junto a la de SVTA en el masthead y
   nunca adentro del cuadro (fase 04). En inglés, como la demo actual.
7. **Los assets**: partido amateur limpio de derechos más el paquete de canal ficticio
   hecho por nosotros, y tres marcas de fantasía. Lo pictórico se genera, la tipografía
   se compone como SVG, y el movimiento se genera sólo en el spot lineal (ADR 0045). El
   corrimiento de la parada del juego se declara una vez (ADR 0044).
8. **La verificación**: `npm test` y `npm run check` en verde, el suite propio de la demo
   con sus tres chequeos, y la corrida mirada entera.

## Fuera de alcance

Es la mitad del valor de esta fase, porque una demo "linda" no tiene criterio de
terminado.

- **`demo/compatibility-pair/` no se toca ni en una línea.** Es la demo técnica y su
  objetivo sigue vigente. No se le agrega una sección, no se le cambia el copy, no se le
  mueve el recorrido.
- **La librería no cambia.** La superficie pública y el contrato entre las dos capas
  quedan iguales. Si la página necesita algo que la sdk no da, **eso es un hallazgo para
  reportar y no un cambio para hacer acá** (ADR 0040).
- **No se agrega un layout ni una capacidad al mecanismo.** Los cinco layouts están, el
  aviso lineal está, la mezcla está, el foco está, la imagen fija está.
- **No hay par de compatibilidad en esta página**, ni un segundo `EXT-X-DATERANGE` de la
  clase de Apple. La comparación va en el tiempo (ADR 0043).
- **No hay narración ni TTS.** Tipografía y nada más.
- **No hay iOS.**
- **No hay stream en vivo de verdad.** Es un VOD con los Date Ranges en la media playlist
  (ADR 0005), y el plate **representa** una parada del juego en lugar de serla.
- **No se filma nada y no se compra stock.** La decisión de contenido lo resuelve.
- **El metraje del programa no se genera**, y el argumento no es la disponibilidad del
  generador: está disponible y aun así el plate se construye (ADR 0045).
- **No hay diseño responsive propio.** El celular tiene que ser usable, no tiene una
  versión.
- **No hay teclado ni accesibilidad sobre la página.** Misma razón que en las fases 06 y
  07.
- **No hay ad server, ni VAST, ni telemetría, ni analytics.**
- **No hay internacionalización.**
- **No se pule.** Un POC no se pule: la vara es que la pantalla cuente el caso.
- **La fecha no ata a esta demo, y es decisión tomada y no pregunta pendiente.** Las
  fechas del proyecto —el draft del 21 de septiembre, la ventana de grabación del 28 al
  30, el evento del 7 de octubre— gobiernan la librería y no esta demo. No se planifica
  contra ninguna de ellas y **no se vuelve a preguntar**.
- **Si esta demo se reusa comercialmente**, la decisión de contenido se reabre, porque
  filmar el plate propio pasa a ser la opción barata. Hoy se diseña para la sala del HLS
  Interest Group y nada más.

## Riesgos

**R1. El plate no aparece.** El material limpio son clips de 7 a 20 s y hay que
concatenar varios para llegar a ~90 s con tres actos, y la parada del juego es la parte
más difícil de encontrar en material amateur. Mitigación: el paquete de canal ficticio es
lo que hace que casi cualquier metraje limpio se lea como transmisión, así que **se
produce primero y no último** (T-03); y la parada se puede armar con un plano de técnico
y equipo que no sea del mismo partido que el juego, porque una transmisión real también
corta de plano.

**R2. El generador deriva hacia el vestido comercial real.** Medido dos veces, con la
prohibición escrita en el prompt. Mitigación: el chequeo humano de vestido comercial está
**adentro de la definición de done de la T-05**, no como recomendación (ADR 0045).

**R3. El trabajo de assets es de 1,5 a 2 días de una persona, y es la misma persona que
la librería.** No es un riesgo de fecha —esta demo no tiene una— es de secuencia: la
página no se puede empezar si primero hay que juntar el plate. Mitigación: **la T-02
construye la demo contra el contenido de la demo actual como suplente**, así que el guion
y la página avanzan sin material propio, porque el guion se ancla a la señalización y no
al material (ADR 0037). Los dos frentes no se bloquean y ninguno espera al otro.

**R4. La página se convierte en un pozo sin fondo.** "Linda" no tiene criterio de
terminado. Mitigación: el fuera de alcance de arriba, el tope de cuatro secciones, y que
el criterio de aceptación sea el de los treinta segundos y no una lista de refinamientos.

**R5. El guion y el player se pelean.** Un beat frena el programa y el usuario lo
despausa, o al revés. Mitigación: el ADR 0042, una sola salida, con el botón visible
durante toda la demo guiada.

**R6. Frenar la composición en medio de un aviso está leído en el código y no medido en
el navegador.** Es la propiedad sobre la que se apoya el guion entero (ADR 0040): si el
`pause` del primario no congelara las cajas de video del aviso, la placa aparecería sobre
un aviso que sigue corriendo y el mecanismo de la demo guiada se cae. **Es el riesgo que
decide el tamaño de la fase.** Mitigación: **es la primera task**, se mide antes de
construir sobre ella, y se mide en un aviso con varias cajas de video y no en uno solo.
Si sale al revés, frenar pasa a ser trabajo de la librería y la fase crece.

**R7. Un chequeo escrito de buena fe puede no poder fallar.** Pasó tres veces en este
proyecto: el scroll de la fase 07 sobre una página que no scrollea, el cuerpo vacío que
devuelve 400 exista el modelo o no, y el 404 que no distingue "no existe" de "no tenés
acceso". Mitigación: **el chequeo de anclas de la T-07 se verifica con un ancla
deliberadamente equivocada** antes de darlo por bueno, y el resultado de ese control va
en la evidencia.

## Arquitectura del producto

El proyecto no tiene `docs/arc42/` y esta fase no lo crea: los dos documentos de `docs/`
cumplen ese papel para el único lector que tienen, quien construye con la sdk.
**Ninguno de los dos cambia**, porque la superficie pública de la librería y el contrato
entre las dos capas quedan iguales (ADR 0040). Si al ejecutar resulta que alguno tenía
que cambiar, eso es el hallazgo del ADR 0040 y se reporta.

Lo que sí se escribe sale del **ADR 0025**, que dice que el README de la raíz enruta y
cada demo cuenta su corrida: `demo/hydration-break/README.md` con lo que la demo necesita
antes de correr, qué pone en pantalla y qué esperar mientras corre —incluido encender el
audio una vez al empezar, que es el mismo paso de la demo actual y por la misma política
de autoplay—, una fila nueva en la tabla de `demo/` del README de la raíz que diga qué
argumenta, y el `CREDITS.md` con la atribución del material.

## Quién mira

**Sin fecha, y es decisión tomada** (ver fuera de alcance). Quien mira es Nicolás, y lo
que mira son los treinta segundos: abrir la página, no tocar nada, y ver si el caso de
negocio llegó.

## Límite de gasto

Autorizado: **`agy` con `generate_image`**, libre, contra la suscripción. **Veo: hasta
dos generaciones** de hasta 10 s con `veo-3.1-fast-generate-001`, del orden de un dólar
cada una. **Cualquier otro servicio pago, no.** Si hicieran falta más de dos generaciones
de Veo, la task para y pregunta en lugar de encadenarlas.
